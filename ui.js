function createControlButtons() {
    const controlButtons = select("#controlButtons");
  
    createStyledButton("Browse", loadNewImage, "bg-blue-500 hover:bg-blue-700", controlButtons);
    createStyledButton("Undo", undo, "bg-yellow-500 hover:bg-yellow-700", controlButtons);
    createStyledButton("Reset", reset, "bg-red-500 hover:bg-red-700", controlButtons);
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
  
  function createStyledButton(text, onClick, className, parent) {
    const button = createButton(text);
    button.class(`${className} text-white font-bold py-2 px-4 rounded mr-2`);
    button.parent(parent);
    button.mousePressed(onClick);
  }