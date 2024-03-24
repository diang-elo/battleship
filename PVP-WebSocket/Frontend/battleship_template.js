document.addEventListener("DOMContentLoaded", function () {
  // At the beginning of your script

  // Gets the canvas elements for the player and AI boards.
  const canvas = document.getElementById("battleshipCanvasPlayer");
  const canvasAI = document.getElementById("battleshipCanvasAI");

  // Gets the 2D rendering contexts for the player and AI canvases.
  const ctx = canvas.getContext("2d");
  const ctxAI = canvasAI.getContext("2d");

  // Sets the size of the grid for both boards.
  const gridSize = 10;

  // Calculates the size of each cell based on the canvas width and grid size.
  const cellSize = canvas.width / gridSize;
  const cellSizeAI = canvasAI.width / gridSize;

  // Initializes variables for game state tracking.
  let angle = 0;
  let shipsPlacedCount = 0;
  let playerHitsOnAi = 0,
    playerMissOnAI = 0,
    aiHitOnPlayer = 0,
    aiMissOnPlayer = 0;

  // Selects the container for ship options and converts its children to an array.
  const optionsContainer = document.querySelector(".options-container");
  const shipOptions = Array.from(optionsContainer.children);
  const shipCount = shipOptions.length;
  let totalShipLength = 0;

  // Calculates the total length of all ships based on attributes
  const shipsQuery = optionsContainer.querySelectorAll("div");
  shipsQuery.forEach((ship) => {
    // Get the ship length attribute value and convert it to a number
    const shipLength = parseInt(ship.getAttribute("ship-length"));
    totalShipLength += shipLength;
  });

  // Initializes arrays for tracking ship placements and hits.
  let ships = [];
  let shipsArray = [];

  let totalShipLengthAi = 0;

  let hitsOnPlayer = [];
  let hitsAI = [];

  let webSocketPlayerShipsCoordinates = [];
  let webSocketPlayerShips = [];
  let player = null;
  let readyToPlay = false;
  let otherPlayerReady = false;
  const socket = new WebSocket("ws://localhost:3000");

  socket.addEventListener("open", function (event) {
    console.log("Connected to WS Server");
  });

  socket.onmessage = function (event) {
    console.log("Message received from server:", JSON.parse(event.data));
    const data = JSON.parse(event.data);
    handleIncomingMessage(data);
  };

  function sendSocketMessage(data) {
    socket.send(JSON.stringify(data));
  }

  function handleIncomingMessage(data) {
    switch (data.type) {
      case "newGame":
        // trigger new game
        document.getElementById("gameOverModal").style.display = "none";
        initGame();
        displayError("Other player wants to go again! Place your ships!");
        break;
      case "shipPositions":
        // Handle ship placement from the opponent
        if (!webSocketPlayerShipsCoordinates.length) {
          webSocketPlayerShips = data.ships;
          webSocketPlayerShipsCoordinates = data.ships.flat(1);
        }
        break;
      case "startGame":
        // start game
        if (readyToPlay && data.readyToPlay) {
          displayError("Game Started, Your turn to Fire!");
          $("#player-status").removeClass("invisible");
          playerTurn = true;
        }
        if (!readyToPlay && data.readyToPlay) {
          otherPlayerReady = true;
        }
        break;
      case "playerLoaded":
        player = data.player;
        break;
      case "attack":
        // coordinates of bomb placed and logic to update square
        const squareSize = cellSizeAI / 2;
        const offsetX = (cellSizeAI - squareSize) / 2;
        const offsetY = (cellSizeAI - squareSize) / 2;
        const bombDropX = data.coordinates[0];
        const bombDropY = data.coordinates[1];
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

        if (checkWinner()) {
          return;
        }
        playerTurn = true;
        $("#player-status").removeClass("invisible");
        $("#ai-status").addClass("invisible");

        // Handle attack from the opponent
        break;
      // Add cases as needed
    }
  }

  // Draws the grid on the canvas for both player and AI.
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
  // plater attacks and ai attacks
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
          webSocketPlayerShipsCoordinates.some(
            (webSocketPlayerShipsCoordinates) =>
              webSocketPlayerShipsCoordinates[0] === gridX &&
              webSocketPlayerShipsCoordinates[1] === gridY
          )
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
          checkForSunkShips(hitsAI, webSocketPlayerShips, ctxAI);

          const attackData = {
            type: "attack",
            coordinates: [gridX, gridY],
          };
          sendSocketMessage(attackData);
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

          const attackData = {
            type: "attack",
            coordinates: [gridX, gridY],
          };
          sendSocketMessage(attackData);
        }
        playerTurn = false;
        if (checkWinner()) {
          return;
        }
        $("#player-status").addClass("invisible");
        $("#ai-status").removeClass("invisible");
      } else {
        displayError("Bomb already placed");
      }
    }
  }

  // Updates the text content of a specified HTML element.
  function changeElementText(elementId, text) {
    let element = document.getElementById(elementId);
    element.textContent = text;
  }

  // Rotates the ships on the UI.
  function rotate() {
    const shipOptions = Array.from(optionsContainer.children);
    angle = angle === 0 ? 90 : 0;
    shipOptions.forEach(
      (ship) => (ship.style.transform = `rotate(${angle}deg)`)
    );
  }

  // Handles placing a ship on the player's board.
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

        const shipPositionsData = {
          type: "shipPositions",
          ships: shipsArray,
        };

        // Send the serialized data over the WebSocket
        // socket.send("shipPositionsData");
        sendSocketMessage(shipPositionsData);
      }
    } else {
      console.log("false");
    }
  }

  // Calculates the coordinates for a ship based on its starting position and orientation.
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

  // Displays an error message temporarily.
  function displayError(error) {
    changeElementText("error-msg", error);
    setTimeout(function () {
      changeElementText("error-msg", "");
    }, 2000);
  }

  // Validates the position of a ship to ensure it's within the game board and not overlapping other ships.
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
      displayError("invalid placement, part of ship leaves board");
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

  // Checks if  ships is sunk to change color
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

  // Checks if there's a winner by comparing the total ship lengths with hits.
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
        "You have lost :(";
      return true;
    }
    return false;
  }

  function startGame() {
    $("#start-btn").hide();
    // playerTurn = true;
    readyToPlay = true;
    const startData = {
      type: "startGame",
      player: player,
      readyToPlay: readyToPlay,
    };
    if (!otherPlayerReady) {
      changeElementText("error-msg", "Waiting for other Player ...");
    } else {
      $("#ai-status").removeClass("invisible");
      playerTurn = false;
    }
    sendSocketMessage(startData);
  }

  const rotateBtn = document.querySelector("#rotate-btn");
  const startBtn = document.querySelector("#start-btn");

  // rotate ships
  rotateBtn.addEventListener("click", rotate);
  startBtn.addEventListener("click", startGame);

  // Code to reset the game
  document
    .getElementById("newGameButton")
    .addEventListener("click", function () {
      document.getElementById("gameOverModal").style.display = "none";
      const attackData = {
        type: "newGame",
      };
      sendSocketMessage(attackData);
      initGame();
    });

  // prevent drag ghost animation
  document.addEventListener("dragover", function (e) {
    e.preventDefault();
  });
  // on drag n drop
  shipOptions.forEach((ship) => ship.addEventListener("dragend", placeShip));
  canvasAI.addEventListener("click", handleCanvasClickAI);

  // initialize game
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
    shipsPlacedCount = 0;
    hitsAI = [];
    hitsOnPlayer = [];
    playerTurn = false;
    totalShipLengthAi = 16;

    webSocketPlayerShipsCoordinates = [];
    webSocketPlayerShips = [];
    player = null;
    readyToPlay = false;
    otherPlayerReady = false;
  }

  initGame();
});
