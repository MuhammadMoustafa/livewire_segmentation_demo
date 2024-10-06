let fileInput;

function loadNewImage() {
  if (!fileInput) {
    fileInput = createFileInput(handleFile);
    fileInput.attribute("accept", "image/*");
    fileInput.elt.style.display = "none";
  }
  fileInput.elt.click();
}

function handleFile(file) {
  if (file.type === "image") {
    img = loadImage(file.data, () => {
      resizeCanvas(img.width, img.height);
      reset();
    });
  }
}

function setAnchorPoint(point) {
  anchorPoint = point;
  isAnchorSet = true;
  currentCostDisplay.html("Current Cost: ");
  minCostDisplay.html("Minimum Cost: ");
}

function finalizeSegment(point) {
  calculateLiveWirePath(anchorPoint, point, false).then((path) => {
    segments.push(path);
    isAnchorSet = false;
    anchorPoint = null;
    tempPath = null;
  });
}

function drawSegments() {
  segments.forEach((segment) => drawPath(segment, color(139, 0, 0)));
}

function drawAnchorPoint() {
  if (isAnchorSet && anchorPoint) {
    fill(0, 255, 0);
    noStroke();
    ellipse(anchorPoint.x, anchorPoint.y, 6);
  }
}

function drawTempPath() {
  if (tempPath) {
    drawPath(tempPath, color(255, 0, 0, 128));
  }
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
