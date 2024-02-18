document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("battleshipCanvasPlayer");
  const canvasAI = document.getElementById("battleshipCanvasAI");

  const ctx = canvas.getContext("2d");
  const ctxAI = canvasAI.getContext("2d");

  const gridSize = 10;

  const cellSize = canvas.width / gridSize;
  const cellSizeAI = canvasAI.width / gridSize;

  let angle = 0;
  let shipsPlacedCount = 0;
  let playerHitsOnAi = 0,
    playerMissOnAI = 0,
    aiHitOnPlayer = 0,
    aiMissOnPlayer = 0;

  const optionsContainer = document.querySelector(".options-container");
  const shipOptions = Array.from(optionsContainer.children);
  const shipCount = shipOptions.length;
  let totalShipLength = 0;
  const shipsQuery = optionsContainer.querySelectorAll("div");
  shipsQuery.forEach((ship) => {
    // Get the ship length attribute value and convert it to a number
    const shipLength = parseInt(ship.getAttribute("ship-length"));
    totalShipLength += shipLength;
  });

  let ships = []; // Ship coordinates that have been placed
  let shipsArray = [];
  let shipsAI = []; // Ship placement
  let shipsAiArray = [];

  let totalShipLengthAi = 0;

  let hitsOnPlayer = [];
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

  let playerTurn = false;
  // Click on AI Board
  function handleCanvasClickAI(event) {
    if (!playerTurn) return;

    const rect = canvasAI.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const gridX = Math.floor(x / cellSizeAI);
    const gridY = Math.floor(y / cellSizeAI);
    // mini fill in square
    const squareSize = cellSizeAI / 2;
    const offsetX = (cellSizeAI - squareSize) / 2;
    const offsetY = (cellSizeAI - squareSize) / 2;

    if (playerTurn) {
      if (!hitsAI.some((hitAI) => hitAI[0] === gridX && hitAI[1] === gridY)) {
        if (
          shipsAI.some((shipAI) => shipAI[0] === gridX && shipAI[1] === gridY)
        ) {
          ctxAI.fillStyle = "red";
          ctxAI.fillRect(
            gridX * cellSizeAI + offsetX,
            gridY * cellSizeAI + offsetY,
            squareSize,
            squareSize
          );
          playerHitsOnAi++;
          changeElementText("ai-hits", playerHitsOnAi);
          hitsAI.push([gridX, gridY]);
          checkForSunkShips(hitsAI, shipsAiArray, ctxAI);
        } else {
          ctxAI.fillStyle = "blue";
          ctxAI.fillRect(
            gridX * cellSizeAI,
            gridY * cellSizeAI,
            cellSizeAI,
            cellSizeAI
          );
          hitsAI.push([gridX, gridY]);
          playerMissOnAI++;
          changeElementText("ai-misses", playerMissOnAI);
        }
        playerTurn = false;
        if (checkWinner()) {
          return;
        }
        $("#player-status").addClass("invisible");
        $("#ai-status").removeClass("invisible");

        setTimeout(function () {
          let bombDrop = generateUniqueCoordinate(hitsOnPlayer);

          const bombDropX = bombDrop[0];
          const bombDropY = bombDrop[1];

          if (
            ships.some((ship) => ship[0] === bombDropX && ship[1] === bombDropY)
          ) {
            ctx.fillStyle = "red";
            ctx.fillRect(
              bombDropX * cellSize + offsetX,
              bombDropY * cellSize + offsetY,
              squareSize,
              squareSize
            );

            hitsOnPlayer.push([bombDropX, bombDropY]);
            aiHitOnPlayer++;
            changeElementText("player-hits", aiHitOnPlayer);
            checkForSunkShips(hitsOnPlayer, shipsArray, ctx);
          } else {
            ctx.fillStyle = "blue";
            ctx.fillRect(
              bombDropX * cellSize,
              bombDropY * cellSize,
              cellSize,
              cellSize
            );
            hitsOnPlayer.push([bombDropX, bombDropY]);
            aiMissOnPlayer++;
            changeElementText("player-misses", aiMissOnPlayer);
          }

          playerTurn = true;
          $("#player-status").removeClass("invisible");
          $("#ai-status").addClass("invisible");
        }, 2000);
      } else {
        displayError("Bomb already placed");
      }
    }
  }

  function changeElementText(elementId, text) {
    let element = document.getElementById(elementId);
    element.textContent = text;
  }

  function generateUniqueCoordinate(existingCoordinates) {
    // Generate random coordinates
    const randomX = Math.floor(Math.random() * 10);
    const randomY = Math.floor(Math.random() * 10);
    const newCoordinate = [randomX, randomY];

    // Check if the generated coordinates already exist in the input array
    if (
      existingCoordinates.some(
        (coord) => coord[0] === randomX && coord[1] === randomY
      )
    ) {
      // If the coordinates already exist, recursively call the function to generate new coordinates
      return generateUniqueCoordinate(existingCoordinates);
    }

    // If the generated coordinates do not exist in the input array, return them
    return newCoordinate;
  }

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
      shipsArray.push(coordinates);
      coordinates.forEach((pair) => {
        ships.push(pair);
      });

      for (let i = 0; i < coordinates.length; i++) {
        ctx.fillStyle = "gray";
        ctx.fillRect(
          coordinates[i][0] * cellSize,
          coordinates[i][1] * cellSize,
          cellSize,
          cellSize
        );
      }

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

  function displayError(error) {
    changeElementText("error-msg", error);
    setTimeout(function () {
      changeElementText("error-msg", "");
    }, 2000);
  }

  function isValidPosition(x, y, coordinates) {
    if (x < 0 || x > 9 || y < 0 || y > 9) {
      // outside of board
      displayError("invalid placement, outside of board");
      return false;
    }

    // invalid placement, len of ship exits board
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
      displayError("invalid placement, part of shipment leaves board");
      return false;
    }

    // invalid placement, overlapping ships
    if (
      ships.some((coord1) =>
        coordinates.some(
          (coord2) => coord1[0] === coord2[0] && coord1[1] === coord2[1]
        )
      )
    ) {
      displayError("invalid placement, overlapping ships");
      return false;
    }

    return true;
  }

  function checkForSunkShips(bombHits, ships, ctx) {
    // Iterate over each ship
    for (let i = 0; i < ships.length; i++) {
      const ship = ships[i];
      let isSunk = true;

      // Check if all coordinates of the ship are present in bomb hits
      for (let j = 0; j < ship.length; j++) {
        const coordinate = ship[j];
        if (
          !bombHits.some(
            (hit) => hit[0] === coordinate[0] && hit[1] === coordinate[1]
          )
        ) {
          isSunk = false;
          break;
        }
      }

      if (isSunk) {
        ship.forEach((coordinate) => {
          let [x, y] = coordinate;

          ctx.fillStyle = "gray";
          ctx.fillRect(x * cellSizeAI, y * cellSizeAI, cellSizeAI, cellSizeAI);

          const squareSize = cellSizeAI / 2;
          const offsetX = (cellSizeAI - squareSize) / 2;
          const offsetY = (cellSizeAI - squareSize) / 2;

          ctx.fillStyle = "yellow";
          ctx.fillRect(
            x * cellSizeAI + offsetX,
            y * cellSizeAI + offsetY,
            squareSize,
            squareSize
          );
        });

        // Remove the ship from the ships array
        ships.splice(i, 1);
        i--;
      }
    }
  }

  function generateShipCoordinates() {
    // Initialize arrays to store ship coordinates
    const shipArrays = [];
    const allShipCoordinates = [];

    // Function to generate random coordinates for a ship of given length
    function generateShip(length) {
      let ship;
      let overlaps;

      do {
        ship = [];
        overlaps = false;
        const x = Math.floor(Math.random() * 10); // Random x-coordinate (0 to 9)
        const y = Math.floor(Math.random() * 10); // Random y-coordinate (0 to 9)

        // Check if ship can be placed horizontally without going out of bounds
        const canPlaceHorizontally = x + length <= 10;

        // Check if ship can be placed vertically without going out of bounds
        const canPlaceVertically = y + length <= 10;

        if (canPlaceHorizontally) {
          for (let i = x; i < x + length; i++) {
            if (
              allShipCoordinates.some(
                (coord) => coord[0] === i && coord[1] === y
              )
            ) {
              overlaps = true;
              break;
            }
            ship.push([i, y]);
          }
        } else if (canPlaceVertically) {
          for (let i = y; i < y + length; i++) {
            if (
              allShipCoordinates.some(
                (coord) => coord[0] === x && coord[1] === i
              )
            ) {
              overlaps = true;
              break;
            }
            ship.push([x, i]);
          }
        } else {
          overlaps = true; // Ship cannot be placed in any direction
        }

        if (!overlaps) {
          // Add ship coordinates to allShipCoordinates
          ship.forEach((coord) => allShipCoordinates.push(coord));
        }
      } while (overlaps);

      return ship;
    }

    // Generate ships of specified lengths
    const shipLengths = [2, 2, 3, 4, 5];
    for (let i = 0; i < shipLengths.length; i++) {
      const ship = generateShip(shipLengths[i]);
      shipArrays.push(ship);
    }

    return [shipArrays, allShipCoordinates];
  }

  function checkWinner() {
    if (totalShipLength === playerHitsOnAi) {
      playerTurn = false;
      document.getElementById("gameOverModal").style.display = "block";
      document.querySelector("#gameOverModal .modal-content h2").textContent =
        "You are the winner!";
      return true;
    }
    if (totalShipLengthAi === aiHitOnPlayer) {
      playerTurn = false;
      document.getElementById("gameOverModal").style.display = "block";
      document.querySelector("#gameOverModal .modal-content h2").textContent =
        "The Ai has won :(";
      return true;
    }
    return false;
  }

  function startGame() {
    $("#start-btn").hide();
    $("#player-status").removeClass("invisible");
    playerTurn = true;
  }

  const rotateBtn = document.querySelector("#rotate-btn");
  const startBtn = document.querySelector("#start-btn");

  // rotate ships
  rotateBtn.addEventListener("click", rotate);
  startBtn.addEventListener("click", startGame);

  document
    .getElementById("newGameButton")
    .addEventListener("click", function () {
      document.getElementById("gameOverModal").style.display = "none";
      initGame();
    });

  // prevent drag ghost animation
  document.addEventListener("dragover", function (e) {
    e.preventDefault();
  });
  // on drag n drop
  shipOptions.forEach((ship) => ship.addEventListener("dragend", placeShip));
  canvasAI.addEventListener("click", handleCanvasClickAI);

  function initGame() {
    drawBoard();
    $("#player-status").addClass("invisible");
    $("#ai-status").addClass("invisible");
    $("#rotate-btn, .options-container").show();
    $(".options-container > div").show();
    changeElementText("ai-hits", 0);
    changeElementText("ai-misses", 0);
    changeElementText("player-hits", 0);
    changeElementText("player-misses", 0);
    playerMissOnAI = 0;
    playerHitsOnAi = 0;
    aiHitOnPlayer = 0;
    aiMissOnPlayer = 0;
    ships = [];
    shipsArray = [];
    shipsAiArray = [];
    shipsPlacedCount = 0;
    hitsAI = [];
    hitsOnPlayer = [];
    playerTurn = false;
    const [shipArrays, allShipCoordinates] = generateShipCoordinates();
    shipsAI = allShipCoordinates;
    shipsAiArray = shipArrays;
    totalShipLengthAi = allShipCoordinates.length;
  }

  initGame();
});
