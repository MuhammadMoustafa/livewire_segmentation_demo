let costMap, processed, totalCost, previous;
const pathCache = new Map();
let isCalculating = false;

function initializeAlgorithmDataStructures() {
  costMap = new Array(width * height).fill(Infinity);
  processed = new Array(width * height).fill(false);
  totalCost = new Array(width * height).fill(Infinity);
  previous = new Array(width * height).fill(null);
}

async function calculateLiveWirePath(start, end, isTemp = false) {
  const cacheKey = `${start.x},${start.y}-${end.x},${end.y}`;
  if (pathCache.has(cacheKey)) {
    tempPath = pathCache.get(cacheKey);
    return tempPath;
  }

  resetDataStructures();
  const queue = new PriorityQueue();
  const startIndex = coordinateToIndex(start.x, start.y);
  totalCost[startIndex] = 0;
  queue.enqueue(startIndex, 0);

  let minCost = Infinity;
  let bestPath = [];
  isCalculating = true;
  tempPath = [];

  while (!queue.isEmpty() && isCalculating) {
    const currentIndex = queue.dequeue();
    if (processed[currentIndex]) continue;

    processed[currentIndex] = true;
    const currentX = currentIndex % width;
    const currentY = Math.floor(currentIndex / width);

    if (isCalculating) {
      await drawProcessedPixel(currentX, currentY);
    }

    if (currentX === end.x && currentY === end.y) {
      const path = reconstructPath(currentIndex);
      const pathCost = totalCost[currentIndex];
      if (
        pathCost < minCost ||
        (pathCost === minCost && path.length < bestPath.length)
      ) {
        minCost = pathCost;
        bestPath = path;
      }
    }

    if (bestPath.length > 0 && shouldStopEarly(currentIndex, queue, minCost))
      break;

    await processNeighbors(currentIndex, end, isTemp, queue, minCost, bestPath);
  }

  isCalculating = false;
  bestPath =
    bestPath.length > 0
      ? bestPath
      : reconstructPath(coordinateToIndex(end.x, end.y));
  pathCache.set(cacheKey, bestPath);
  tempPath = isTemp ? bestPath : null;

  if (!isTemp) {
    segments.push(bestPath);
    isAnchorSet = false;
    anchorPoint = null;
  }

  return bestPath;
}

function resetDataStructures() {
  costMap.fill(Infinity);
  processed.fill(false);
  totalCost.fill(Infinity);
  previous.fill(null);
}

async function drawProcessedPixel(x, y) {
  fill(255, 255, 0); // Yellow color
  noStroke();
  rect(x, y, 1, 1);
    // await sleep(animationDelay);
  await sleep(10);
}

function shouldStopEarly(currentIndex, queue, minCost) {
  return (
    totalCost[currentIndex] > minCost ||
    (totalCost[currentIndex] === minCost && queue.peek().priority >= minCost)
  );
}

async function processNeighbors(
  currentIndex,
  end,
  isTemp,
  queue,
  minCost,
  bestPath
) {
  const currentX = currentIndex % width;
  const currentY = Math.floor(currentIndex / width);

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;

      const neighborX = currentX + dx;
      const neighborY = currentY + dy;

      if (!isValidPixel(neighborX, neighborY)) continue;

      const neighborIndex = coordinateToIndex(neighborX, neighborY);
      if (processed[neighborIndex]) continue;

      const linkCost = calculateLinkCost(
        currentX,
        currentY,
        neighborX,
        neighborY
      );
      const pathLengthPenalty = 0.1; // Adjust this value to change the impact of path length
      const newTotalCost =
        totalCost[currentIndex] + linkCost + pathLengthPenalty;

      if (newTotalCost < totalCost[neighborIndex]) {
        totalCost[neighborIndex] = newTotalCost;
        previous[neighborIndex] = currentIndex;
        queue.enqueue(neighborIndex, newTotalCost);

        updateCostDisplay(newTotalCost, minCost);

        if (animateCalculations && isTemp) {
          await animateNeighbor(neighborX, neighborY);
        }

        // Update tempPath for live red path
        if (isTemp) {
          tempPath = reconstructPath(neighborIndex);
          drawTempPath();
        }

        // Check if we've reached the end point
        if (neighborX === end.x && neighborY === end.y) {
          const path = reconstructPath(neighborIndex);
          if (
            newTotalCost < minCost ||
            (newTotalCost === minCost && path.length < bestPath.length)
          ) {
            minCost = newTotalCost;
            bestPath = path;
          }
        }
      }
    }
  }

  return { minCost, bestPath };
}

function reconstructPath(endIndex) {
  const path = [];
  let currentIndex = endIndex;

  while (currentIndex !== null) {
    const x = currentIndex % width;
    const y = Math.floor(currentIndex / width);
    path.unshift(createVector(x, y));
    currentIndex = previous[currentIndex];
  }

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

function isValidPixel(x, y) {
  return x >= 0 && x < width && y >= 0 && y < height;
}

function updateCostDisplay(newTotalCost, minCost) {
  if (newTotalCost < minCost) {
    minCostDisplay.html(`Minimum Cost: ${minCost.toFixed(2)}`);
  }
  currentCostDisplay.html(`Current Cost: ${newTotalCost.toFixed(2)}`);
}

async function animateNeighbor(x, y) {
  fill(0, 0, 255);
  noStroke();
  rect(x, y, 1, 1);
  await sleep(animationDelay);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

  peek() {
    return this.elements[0];
  }
}
