const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server: server });

let players = [];

wss.on("connection", function connection(ws) {
  if (players.length >= 2) {
    console.log("Maximum number of players reached. Ignoring new connection.");
    return; // Stop further execution for this connection.
  }
  console.log("A new client connected");
  if (players.length < 2) {
    players.push(ws);
    if (players.length === 2) {
      players.forEach((player, idx) => {
        player.send(JSON.stringify({ type: "playerLoaded", player: idx + 1 }));
      });
    }
  }

  ws.on("message", function incoming(message) {
    console.log("received: %s", message);
    players.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  ws.on("close", function () {
    console.log("Client disconnected");
    players = players.filter((player) => player !== ws);
  });
});

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.send("Hello, world!");
});

const port = 3000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
