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
  let playerHitsOnAi = 0

  const optionsContainer = document.querySelector(".options-container");
  const shipOptions = Array.from(optionsContainer.children);
  const shipCount = shipOptions.length;
  let totalShipLength = 0
  const shipsQuery = optionsContainer.querySelectorAll('div');
  shipsQuery.forEach(ship => {
    // Get the ship length attribute value and convert it to a number
    const shipLength = parseInt(ship.getAttribute('ship-length'));
    totalShipLength += shipLength;
});


  let ships = []; // Ship coordinates that have been placed
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
  let totalShipLengthAi= shipsAI.length
  let aiHitOnPlayer = 0

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

  // Click on Player Board
  function handleCanvasClick(event) {}

  let playerTurn = false 
  // Click on AI Board
  function handleCanvasClickAI(event) {
    if (!playerTurn) return
    
  

    const rect = canvasAI.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const gridX = Math.floor(x / cellSizeAI);
    const gridY = Math.floor(y / cellSizeAI);
    
    if (playerTurn){
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
        aiHitOnPlayer = aiHitOnPlayer + 1
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
      playerTurn = false
      $('#player-status').addClass('invisible')
      $('#ai-status').removeClass('invisible')

      setTimeout(function() {
        
        let bombDrop = generateUniqueCoordinate(hitsOnPlayer)
       
        const bombDropX = bombDrop[0]
        const bombDropY = bombDrop[1]

        console.log(ships.some((ship) => ship[0] === bombDropX && ship[1] === bombDropY))
        console.log(bombDrop)
  
        

        if (
          ships.some((ship) => ship[0] === bombDropX && ship[1] === bombDropY)
        ) {
          ctx.fillStyle = "red";
          ctx.fillRect(
            bombDropX * cellSize,
            bombDropY * cellSize,
            cellSize,
            cellSize
          );
          playerHitsOnAi = playerHitsOnAi + 1
          hitsOnPlayer.push([bombDropX, bombDropY]);
        } else {
          ctx.fillStyle = "blue";
          ctx.fillRect(
            bombDropX * cellSize,
            bombDropY * cellSize,
            cellSize,
            cellSize
          );
          hitsOnPlayer.push([bombDropX, bombDropY]);
        }

        playerTurn = true
        $('#player-status').removeClass('invisible')
        $('#ai-status').addClass('invisible')
      }, 2000);


      

    }
  }
  }

  function generateUniqueCoordinate(existingCoordinates) {
    // Generate random coordinates
    const randomX = Math.floor(Math.random() * 10);
    const randomY = Math.floor(Math.random() * 10);
    const newCoordinate = [randomX, randomY];

    // Check if the generated coordinates already exist in the input array
    if (existingCoordinates.some(coord => coord[0] === randomX && coord[1] === randomY)) {
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
      
      coordinates.forEach(pair => {
        ships.push(pair)
      })

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

  function isValidPosition(x, y, coordinates) {
    if (x < 0 || x > 9 || y < 0 || y > 9) {
      // outside of board
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
      return false;
    }

    // invalid placement, overlapping ships
    if(ships.some(coord1 => coordinates.some(coord2 => coord1[0] 
      === coord2[0] && coord1[1] === coord2[1]))){
        return false
      }

    return true;
  }

  function checkWinner(){
    if (totalShipLength === playerHitsOnAi){
        playerTurn = false
    }
    if (totalShipLengthAi === aiHitOnPlayer){
      playerTurn = false
    }
  }

  function startGame() {
    $("#start-btn").hide();
    $('#player-status').removeClass('invisible')
    playerTurn = true
  }

  const rotateBtn = document.querySelector("#rotate-btn");
  const startBtn = document.querySelector("#start-btn");

  // rotate ships
  rotateBtn.addEventListener("click", rotate);
  startBtn.addEventListener("click", startGame);
  // prevent drag ghost animation
  document.addEventListener("dragover", function (e) {
    e.preventDefault();
  });
  // on drag n drop
  shipOptions.forEach((ship) => ship.addEventListener("dragend", placeShip));

  function initGame() {
    drawBoard();
    $('#player-status').addClass('invisible')
      $('#ai-status').addClass('invisible')
    canvasAI.addEventListener("click", handleCanvasClickAI);
  }

  initGame();
});
