// Global variables
let canvas, ctx;
let image;
let imageData;

let animateCalculations = false;
let minCostDisplay, currentCostDisplay;
let animationToggle;

// Segmentation variables
let segments = [];
let isAnchorSet = false;
let anchorPoint = null;
let tempPath = null;

// Algorithm variables
let costMap;
let processed;
let totalCost;
let previous;

// UI elements
let coordsDisplay, costDisplay;
let delaySlider;
let animationDelay = 0;

// Memoization cache
const pathCache = new Map();

function init() {
    canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');

    // Create UI elements
    createButton('Browse', loadImage);
    createButton('Undo', undo);
    createButton('Reset', reset);
    
    // Create new UI elements
    coordsDisplay = createDisplay('Coordinates: ');
    currentCostDisplay = createDisplay('Current Cost: ');
    minCostDisplay = createDisplay('Minimum Cost: ');
    
    animationToggle = document.createElement('input');
    animationToggle.type = 'checkbox';
    animationToggle.id = 'animationToggle';
    animationToggle.addEventListener('change', (e) => {
        animateCalculations = e.target.checked;
    });
    const toggleLabel = document.createElement('label');
    toggleLabel.htmlFor = 'animationToggle';
    toggleLabel.textContent = 'Animate Calculations';
    document.body.appendChild(animationToggle);
    document.body.appendChild(toggleLabel);

    delaySlider = document.createElement('input');
    delaySlider.type = 'range';
    delaySlider.min = '0';
    delaySlider.max = '1000';
    delaySlider.value = '0';
    delaySlider.addEventListener('input', (e) => {
        animationDelay = parseInt(e.target.value);
    });
    document.body.appendChild(delaySlider);

    canvas.addEventListener('click', onCanvasClick);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseout', onMouseOut);
}

function loadImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            image = new Image();
            image.onload = function() {
                canvas.width = image.width;
                canvas.height = image.height;
                ctx.drawImage(image, 0, 0);
                imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                
                // Initialize algorithm data structures
                costMap = new Array(canvas.width * canvas.height).fill(Infinity);
                processed = new Array(canvas.width * canvas.height).fill(false);
                totalCost = new Array(canvas.width * canvas.height).fill(Infinity);
                previous = new Array(canvas.width * canvas.height).fill(null);
                
                reset();
            };
            image.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function createButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.addEventListener('click', onClick);
    document.body.appendChild(button);
}

function createDisplay(label) {
    const display = document.createElement('div');
    display.textContent = label;
    document.body.appendChild(display);
    return display;
}

function onCanvasClick(event) {
    const point = getImageCoordinates(event);
    
    if (!isAnchorSet) {
        // Set anchor point
        anchorPoint = point;
        drawPoint(point.x, point.y, 'green');
        isAnchorSet = true;
    } else {
        // Set end point and finalize segment
        calculateLiveWirePath(anchorPoint, point, false).then(path => {
            segments.push(path);
            drawPath(path, 'darkred');
            
            // Reset for next segment
            isAnchorSet = false;
            anchorPoint = null;
            tempPath = null;
            redrawCanvas();
        });
    }
}
function onMouseDown(event) {
    const point = getImageCoordinates(event);
    
    if (!isAnchorSet) {
        // Odd click: Set anchor point
        anchorPoint = point;
        drawPoint(point.x, point.y, 'green');
        isAnchorSet = true;
    } else {
        // Even click: Set end point and finalize segment
        const path = calculateLiveWirePath(anchorPoint, point);
        segments.push(path);
        drawPath(path, 'red');
        
        // Reset for next segment
        isAnchorSet = false;
        anchorPoint = null;
    }
    
    tempPath = null; // Clear any temporary path
    redrawCanvas();
}

function onMouseMove(event) {
    const point = getImageCoordinates(event);
    
    if (point.x < 0 || point.x >= canvas.width || point.y < 0 || point.y >= canvas.height) {
        onMouseOut();
        return;
    }

    coordsDisplay.textContent = `Coordinates: (${point.x}, ${point.y})`;

    if (isAnchorSet) {
        // Clear previous temporary path
        redrawCanvas();

        // Calculate and draw the live wire path
        calculateLiveWirePath(anchorPoint, point, true);
    }
}

function onMouseOut() {
    coordsDisplay.textContent = 'Coordinates: ';
    costDisplay.textContent = 'Cost: ';
    tempPath = null;
    redrawCanvas();
}

async function calculateLiveWirePath(start, end, isTemp = false) {
    const cacheKey = `${start.x},${start.y}-${end.x},${end.y}`;
    if (pathCache.has(cacheKey)) {
        return pathCache.get(cacheKey);
    }

    // Reset data structures
    costMap.fill(Infinity);
    processed.fill(false);
    totalCost.fill(Infinity);
    previous.fill(null);

    // Priority queue to store pixels to be processed
    const queue = new PriorityQueue();

    // Initialize start pixel
    const startIndex = coordinateToIndex(start.x, start.y);
    totalCost[startIndex] = 0;
    queue.enqueue(startIndex, 0);

    let minCost = Infinity;

    // Add a maximum iteration count to prevent infinite loops
    let maxIterations = canvas.width * canvas.height;
    let iterations = 0;

    while (!queue.isEmpty() && iterations < maxIterations) {
        iterations++;
        const currentIndex = queue.dequeue();
        if (processed[currentIndex]) continue;

        processed[currentIndex] = true;
        const { x: currentX, y: currentY } = indexToCoordinate(currentIndex);

        if (animateCalculations && isTemp) {
            ctx.fillStyle = 'yellow';
            ctx.fillRect(currentX, currentY, 1, 1);
            await sleep(animationDelay);
        }

        // Check if we've reached the end point
        if (currentX === end.x && currentY === end.y) {
            break;
        }

        // Process neighbors
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;

                const neighborX = currentX + dx;
                const neighborY = currentY + dy;

                if (neighborX < 0 || neighborX >= canvas.width || neighborY < 0 || neighborY >= canvas.height) {
                    continue;
                }

                const neighborIndex = coordinateToIndex(neighborX, neighborY);
                if (processed[neighborIndex]) continue;

                const linkCost = calculateLinkCost(currentX, currentY, neighborX, neighborY);
                const newTotalCost = totalCost[currentIndex] + linkCost;

                if (newTotalCost < totalCost[neighborIndex]) {
                    totalCost[neighborIndex] = newTotalCost;
                    previous[neighborIndex] = currentIndex;
                    queue.enqueue(neighborIndex, newTotalCost);

                    if (newTotalCost < minCost) {
                        minCost = newTotalCost;
                        minCostDisplay.textContent = `Minimum Cost: ${minCost.toFixed(2)}`;
                    }

                    if (animateCalculations && isTemp) {
                        ctx.fillStyle = 'blue';
                        ctx.fillRect(neighborX, neighborY, 1, 1);
                        currentCostDisplay.textContent = `Current Cost: ${newTotalCost.toFixed(2)}`;
                        await sleep(animationDelay);
                    }
                }
            }
        }
    }

    // Reconstruct the path
    const path = [];
    let currentIndex = coordinateToIndex(end.x, end.y);
    
    while (currentIndex !== null) {
        const { x, y } = indexToCoordinate(currentIndex);
        path.unshift({ x, y });
        currentIndex = previous[currentIndex];

        if (isTemp) { //animateCalculations &&
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(x, y, 1, 1);
            await sleep(animationDelay);
        }
    }

    pathCache.set(cacheKey, path);
    return path;
}

function calculateLinkCost(x1, y1, x2, y2) {
    const index1 = (y1 * canvas.width + x1) * 4;
    const index2 = (y2 * canvas.width + x2) * 4;

    const rDiff = imageData.data[index1] - imageData.data[index2];
    const gDiff = imageData.data[index1 + 1] - imageData.data[index2 + 1];
    const bDiff = imageData.data[index1 + 2] - imageData.data[index2 + 2];

    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

function coordinateToIndex(x, y) {
    return y * canvas.width + x;
}

function indexToCoordinate(index) {
    return {
        x: index % canvas.width,
        y: Math.floor(index / canvas.width)
    };
}

function getImageCoordinates(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(event.clientX - rect.left);
    const y = Math.round(event.clientY - rect.top);
    return { x, y };
}

function drawPoint(x, y, color) {
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawPath(path, color) {
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
}

function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);

    // Redraw all segments
    segments.forEach(segment => drawPath(segment, 'darkred'));

    // Redraw anchor point if set
    if (isAnchorSet && anchorPoint) {
        drawPoint(anchorPoint.x, anchorPoint.y, 'green');
    }

    // Redraw temporary path if exists
    if (tempPath) {
        drawPath(tempPath, 'rgba(255, 0, 0, 0.5)');
    }
}

function undo() {
    if (segments.length > 0) {
        segments.pop();
    }
    isAnchorSet = false;
    anchorPoint = null;
    tempPath = null;
    redrawCanvas();
}

function reset() {
    segments = [];
    isAnchorSet = false;
    anchorPoint = null;
    tempPath = null;
    pathCache.clear();
    currentCostDisplay.textContent = 'Current Cost: ';
    minCostDisplay.textContent = 'Minimum Cost: ';
    redrawCanvas();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Simple priority queue implementation
class PriorityQueue {
    constructor() {
        this.elements = [];
    }

    enqueue(element, priority) {
        this.elements.push({ element, priority });
        this.elements.sort((a, b) => a.priority - b.priority);
    }

    dequeue() {
        return this.elements.shift().element;
    }

    isEmpty() {
        return this.elements.length === 0;
    }
}

// Initialize the application
init();