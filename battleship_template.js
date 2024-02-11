document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("battleshipCanvasPlayer");
  const canvasAI = document.getElementById("battleshipCanvasAI");

  const ctx = canvas.getContext("2d");
  const ctxAI = canvasAI.getContext("2d");

  const gridSize = 10;

  const cellSize = canvas.width / gridSize;
  const cellSizeAI = canvasAI.width / gridSize;

  let shipsAI = [
    // first ship
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    // second
    [4, 4],
    [5, 4],
    [6, 4],
    [7, 4],
    // thirds
    [1, 7],
    [1, 8],
    [1, 9],
    // fourth
    [9, 3],
    [9, 4],
    [9, 5],
    //fifth
    [9, 0],
    [9, 1],
  ]; // Ship placement
  let hits = [];
  let hitsAI = [];

  function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        ctx.strokeRect(i * cellSize, j * cellSize, cellSize, cellSize);
      }
    }

    ctxAI.clearRect(0, 0, canvasAI.width, canvasAI.height);
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        ctxAI.strokeRect(
          i * cellSizeAI,
          j * cellSizeAI,
          cellSizeAI,
          cellSizeAI
        );
      }
    }
  }

  // Click on Player Board
  function handleCanvasClick(event) {}

  // Click on AI Board
  function handleCanvasClickAI(event) {
    const rect = canvasAI.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const gridX = Math.floor(x / cellSizeAI);
    const gridY = Math.floor(y / cellSizeAI);

    if (!hitsAI.some((hitAI) => hitAI[0] === gridX && hitAI[1] === gridY)) {
      if (
        shipsAI.some((shipAI) => shipAI[0] === gridX && shipAI[1] === gridY)
      ) {
        ctxAI.fillStyle = "red";
        ctxAI.fillRect(
          gridX * cellSizeAI,
          gridY * cellSizeAI,
          cellSizeAI,
          cellSizeAI
        );
        hitsAI.push([gridX, gridY]);
      } else {
        ctxAI.fillStyle = "blue";
        ctxAI.fillRect(
          gridX * cellSizeAI,
          gridY * cellSizeAI,
          cellSizeAI,
          cellSizeAI
        );
        hitsAI.push([gridX, gridY]);
      }
    }
  }

  let angle = 0;
  let ships = []; // Ship coordinates that have been placed
  let shipsPlacedCount = 0;

  const optionsContainer = document.querySelector(".options-container");
  const shipOptions = Array.from(optionsContainer.children);
  const shipCount = shipOptions.length;

  function rotate() {
    const shipOptions = Array.from(optionsContainer.children);
    angle = angle === 0 ? 90 : 0;
    shipOptions.forEach(
      (ship) => (ship.style.transform = `rotate(${angle}deg)`)
    );
  }

  function placeShip(event) {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const gridX = Math.floor(x / cellSizeAI);
    const gridY = Math.floor(y / cellSizeAI);

    const coordinates = getPlacedShipCoordinates(gridX, gridY, angle, event);
    if (isValidPosition(gridX, gridY, coordinates)) {
      // update ships with newly placed coordinates
      ships.push(coordinates);

      for (let i = 0; i < coordinates.length; i++) {
        ctx.fillStyle = "gray";
        ctx.fillRect(
          coordinates[i][0] * cellSize,
          coordinates[i][1] * cellSize,
          cellSize,
          cellSize
        );
      }
      console.log(ships);
      // hide selection
      $(`#${event.target.id}`).hide();
      shipsPlacedCount = shipsPlacedCount + 1;
      if (shipsPlacedCount == shipCount) {
        $("#rotate-btn, .options-container").hide();
        $("#start-btn").show();
      }
    } else {
      console.log("false");
    }
  }

  function getPlacedShipCoordinates(x, y, angle, event) {
    const coordinates = [];
    const rot = angle;
    const len = parseInt(event.target.getAttribute("ship-length"));

    if (rot === 0) {
      for (let i = x - len + 1; i <= x; i++) {
        coordinates.push([i, y]);
      }
    } else if (rot === 90) {
      for (let j = y; j <= y + len - 1; j++) {
        coordinates.push([x, j]);
      }
    }

    return coordinates;
  }

  function isValidPosition(x, y, coordinates) {
    if (x < 0 || x > 9 || y < 0 || y > 9) {
      // outside of board
      return false;
    }

    if (
      coordinates.some(
        (coordinate) =>
          coordinate[0] < 0 ||
          coordinate[0] > 9 ||
          coordinate[1] < 0 ||
          coordinate[1] > 9
      )
    ) {
      // invalid placement, out of bounds
      return false;
    }

    return true;
  }

  const rotateBtn = document.querySelector("#rotate-btn");

  // rotate ships
  rotateBtn.addEventListener("click", rotate);
  // prevent drag ghost animation
  document.addEventListener("dragover", function (e) {
    e.preventDefault();
  });
  // on drag n drop
  shipOptions.forEach((ship) => ship.addEventListener("dragend", placeShip));

  function initGame() {
    drawBoard();

    canvasAI.addEventListener("click", handleCanvasClickAI);
  }

  initGame();
});
