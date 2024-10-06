// Global variables
// let canvas, ctx;
let img;
let fileInput;
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

function setup() {
  const canvas = createCanvas(400, 400);
  canvas.parent("canvasContainer");

  createControlButtons();
  createAnimationControls();
  createInfoDisplay();

  // Initialize algorithm data structures
  costMap = new Array(width * height).fill(Infinity);
  processed = new Array(width * height).fill(false);
  totalCost = new Array(width * height).fill(Infinity);
  previous = new Array(width * height).fill(null);
}

function draw() {
  if (!img) return;

  image(img, 0, 0);

  // Draw all segments
  segments.forEach((segment) => drawPath(segment, color(139, 0, 0)));

  // Draw anchor point if set
  if (isAnchorSet && anchorPoint) {
    fill(0, 255, 0);
    noStroke();
    ellipse(anchorPoint.x, anchorPoint.y, 6);
  }

  // Draw temporary path if exists
  if (tempPath) {
    drawPath(tempPath, color(255, 0, 0, 128));
  }

  updateInfoDisplay();
}

function mousePressed() {
  if (
    !img ||
    mouseX < 0 ||
    mouseX > img.width ||
    mouseY < 0 ||
    mouseY > img.height
  ) {
    return; // Exit the function if the mouse is outside the image
  }
  const point = createVector(mouseX, mouseY);

  if (!isAnchorSet) {
    // Set anchor point
    anchorPoint = point;
    isAnchorSet = true;
    // current and min cost
    curentCostDisplay.html("Current Cost: ");
    minCostDisplay.html("Minimum Cost: ");
  } else {
    // Set end point and finalize segment
    console.log("caculate live wire path")
    calculateLiveWirePath(anchorPoint, point, false).then((path) => {
      segments.push(path);

      // Reset for next segment
      isAnchorSet = false;
      anchorPoint = null;
      tempPath = null;
    });
  }
}

function mouseMoved() {
  if (
    !img ||
    mouseX < 0 ||
    mouseX > img.width ||
    mouseY < 0 ||
    mouseY > img.height
  ) {
    return; // Exit the function if the mouse is outside the image
  }
  if (isAnchorSet) {
    const point = createVector(mouseX, mouseY);
    calculateLiveWirePath(anchorPoint, point, true);
  }
}

function createControlButtons() {
  const controlButtons = select("#controlButtons");

  const browseButton = createButton("Browse");
  browseButton.class(
    "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
  );
  browseButton.parent(controlButtons);
  browseButton.mousePressed(loadNewImage);

  const undoButton = createButton("Undo");
  undoButton.class(
    "bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mr-2"
  );
  undoButton.parent(controlButtons);
  undoButton.mousePressed(undo);

  const resetButton = createButton("Reset");
  resetButton.class(
    "bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
  );
  resetButton.parent(controlButtons);
  resetButton.mousePressed(reset);
}

function createAnimationControls() {
  const animationControls = select("#animationControls");

  animationToggle = createCheckbox("Animate Calculations", false);
  animationToggle.class("mb-2");
  animationToggle.parent(animationControls);
  animationToggle.changed(() => {
    animateCalculations = animationToggle.checked();
  });

  createP("Animation Delay").class("mb-1").parent(animationControls);
  delaySlider = createSlider(0, 100, 0);
  delaySlider.class("w-full");
  delaySlider.parent(animationControls);
  delaySlider.input(() => {
    animationDelay = delaySlider.value();
  });
}

function createInfoDisplay() {
  const infoDisplay = select("#infoDisplay");

  coordsDisplay = createP("Coordinates: ");
  coordsDisplay.parent(infoDisplay);

  pixelValueDisplay = createP("Pixel Value: ");
  pixelValueDisplay.parent(infoDisplay);

  currentCostDisplay = createP("Current Cost: ");
  currentCostDisplay.parent(infoDisplay);

  minCostDisplay = createP("Minimum Cost: ");
  minCostDisplay.parent(infoDisplay);
}

function updateInfoDisplay() {
  if (mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height) {
    coordsDisplay.html(`Coordinates: (${mouseX}, ${mouseY})`);
    const pixelValue = img.get(mouseX, mouseY);
    pixelValueDisplay.html(
      `Pixel Value: R${pixelValue[0]} G${pixelValue[1]} B${pixelValue[2]}`
    );
  } else {
    coordsDisplay.html("Coordinates: ");
    pixelValueDisplay.html("Pixel Value: ");
  }
}

function loadNewImage() {
  if (!fileInput) {
    fileInput = createFileInput(handleFile);
    fileInput.attribute("accept", "image/*");
    fileInput.elt.style.display = "none"; // Hide the browse button
  }
  fileInput.elt.click(); // Programmatically trigger the file dialog
}

function handleFile(file) {
  if (file.type === "image") {
    img = loadImage(file.data, () => {
      console.log(img, "hhhhhhhhhhhhhhe");
      resizeCanvas(img.width, img.height);
      reset();
    });
  }
}

function createButton(text, onClick) {
  const button = document.createElement("button");
  button.textContent = text;
  button.addEventListener("click", onClick);
  document.body.appendChild(button);
}

function createDisplay(label) {
  const display = document.createElement("div");
  display.textContent = label;
  document.body.appendChild(display);
  return display;
}

// function onCanvasClick(event) {
//   const point = getImageCoordinates(event);

//   if (!isAnchorSet) {
//     // Set anchor point
//     anchorPoint = point;
//     drawPoint(point.x, point.y, "green");
//     isAnchorSet = true;
//   } else {
//     // Set end point and finalize segment
//     calculateLiveWirePath(anchorPoint, point, false).then((path) => {
//       segments.push(path);
//       drawPath(path, "darkred");

//       // Reset for next segment
//       isAnchorSet = false;
//       anchorPoint = null;
//       tempPath = null;
//       redrawCanvas();
//     });
//   }
// }

function onMouseDown(event) {
  const point = getImageCoordinates(event);

  if (!isAnchorSet) {
    // Odd click: Set anchor point
    anchorPoint = point;
    drawPoint(point.x, point.y, "green");
    isAnchorSet = true;
  } else {
    // Even click: Set end point and finalize segment
    const path = calculateLiveWirePath(anchorPoint, point);
    segments.push(path);
    drawPath(path, "red");

    // Reset for next segment
    isAnchorSet = false;
    anchorPoint = null;
  }

  tempPath = null; // Clear any temporary path
  redrawCanvas();
}

function onMouseMove(event) {
  const point = getImageCoordinates(event);

  if (
    point.x < 0 ||
    point.x >= canvas.width ||
    point.y < 0 ||
    point.y >= canvas.height
  ) {
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
  coordsDisplay.textContent = "Coordinates: ";
  costDisplay.textContent = "Cost: ";
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

  while (!queue.isEmpty()) {
    const currentIndex = queue.dequeue();
    if (processed[currentIndex]) continue;

    processed[currentIndex] = true;
    const currentX = currentIndex % width;
    const currentY = Math.floor(currentIndex / width);

    if (animateCalculations && isTemp) {
      fill(255, 255, 0);
      noStroke();
      rect(currentX, currentY, 1, 1);
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

        if (
          neighborX < 0 ||
          neighborX >= canvas.width ||
          neighborY < 0 ||
          neighborY >= canvas.height
        ) {
          continue;
        }

        const neighborIndex = coordinateToIndex(neighborX, neighborY);
        if (processed[neighborIndex]) continue;

        const linkCost = calculateLinkCost(
          currentX,
          currentY,
          neighborX,
          neighborY
        );
        const newTotalCost = totalCost[currentIndex] + linkCost;

        if (newTotalCost < totalCost[neighborIndex]) {
          totalCost[neighborIndex] = newTotalCost;
          previous[neighborIndex] = currentIndex;
          queue.enqueue(neighborIndex, newTotalCost);

          console.log(newTotalCost, minCost)
          if (newTotalCost < minCost) {
            minCost = newTotalCost;
            // minCostDisplay.textContent = `Minimum Cost: ${minCost.toFixed(2)}`;
            minCostDisplay.html(`Minimum Cost: ${minCost.toFixed(2)}`);
          }

          if (animateCalculations && isTemp) {
            fill(0, 0, 255);
            noStroke();
            rect(neighborX, neighborY, 1, 1);
            currentCostDisplay.html(`Current Cost: ${newTotalCost.toFixed(2)}`);
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
    const x = currentIndex % width;
    const y = Math.floor(currentIndex / width);
    path.unshift({ x, y });
    currentIndex = previous[currentIndex];

    if (isTemp) {
        fill(255, 0, 0, 128);
        noStroke();
        rect(x, y, 1, 1);
        await sleep(animationDelay);
    }
  }

  pathCache.set(cacheKey, path);
  tempPath = isTemp ? path : null;
  return path;
}

function calculateLinkCost(x1, y1, x2, y2) {
    const c1 = img.get(x1, y1);
    const c2 = img.get(x2, y2);
    return dist(c1[0], c1[1], c1[2], c2[0], c2[1], c2[2]);
}

function coordinateToIndex(x, y) {
    return y * width + x;
}

function drawPath(path, color) {
  stroke(color);
  strokeWeight(2);
  noFill();
  beginShape();
  for (const point of path) {
    vertex(point.x, point.y);
  }
  endShape();
}

function undo() {
  if (segments.length > 0) {
    segments.pop();
  }
  isAnchorSet = false;
  anchorPoint = null;
  tempPath = null;
}

function reset() {
  segments = [];
  isAnchorSet = false;
  anchorPoint = null;
  tempPath = null;
  pathCache.clear();
  minCostDisplay.html(`Minimum Cost: `);
  currentCostDisplay.html(`Current Cost: `);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
