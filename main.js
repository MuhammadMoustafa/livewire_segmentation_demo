// Global variables
let img;
let segments = [];
let isAnchorSet = false;
let anchorPoint = null;
let tempPath = null;
let isCalculating = false;

// UI elements
let coordsDisplay, pixelValueDisplay, currentCostDisplay, minCostDisplay;
let animationToggle, delaySlider;
let animateCalculations = false;
let animationDelay = 0;

function setup() {
  const canvas = createCanvas(400, 400);
  canvas.parent("canvasContainer");

  createControlButtons();
  createAnimationControls();
  createInfoDisplay();

  initializeAlgorithmDataStructures();
}

function draw() {
  if (!img) return;

  image(img, 0, 0);
  drawSegments();
  drawAnchorPoint();
  drawTempPath();
  updateInfoDisplay();
}

function mousePressed() {
  if (!isValidMousePosition()) return;

  const point = createVector(mouseX, mouseY);

  if (!isAnchorSet) {
    setAnchorPoint(point);
  } else if (isCalculating) {
    isCalculating = false;
  } else {
    finalizeSegment(point);
  }
}

function mouseMoved() {
  if (!isValidMousePosition()) return;

  if (isAnchorSet && !isCalculating) {
    const point = createVector(mouseX, mouseY);
    calculateLiveWirePath(anchorPoint, point, true);
  }
}

function isValidMousePosition() {
  return img && mouseX >= 0 && mouseX < img.width && mouseY >= 0 && mouseY < img.height;
}