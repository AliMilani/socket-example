const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const { newToken } = require("./utils");
const _ = require("lodash");

let users = [];

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
app.get("/online", (req, res) => {
  res.sendFile(__dirname + "/onlineUsers.html");
});
io.on("connect", (socket) => {
  // users.push(socket.id);
  console.log("a user connected", socket.id);
});

io.on("connection", (socket) => {
  socket.on("disconnect", () => {
    console.log("user disconnected" + socket.id);
    // set user to offline by socketId
    // const user = _.find(users, { socketId: socket.id });
    // if (user) user.isOnline = false;
    let index = users.findIndex(user => user.socketId === socket.id)
    if (index !== -1) {
      users[index].isOnline = false
    }
    else console.log(index)
    broadcast(socket)
  });
  socket.on("chat message", (msg) => {
    // console.log(users);
    // check msg.token is valid
    const user = _.find(users, { token: msg.token });
    console.log(msg);
    if (user) {
      // send msg to all users
      io.emit("chat message", {text: msg.text, name: user.name});
    }
    else {
      // send error msg to sender
      socket.emit("error", {text: "Invalid token"});
    }
  });
  socket.on("register", (user) => {
    const token = newToken();
    // require('fs').writeFileSync('user.json', JSON.stringify({token, user}));
    const registeredUser = {
      name: user,
      token: token,
      isOnline: true,
      socketId: socket.id,
    };
    if (!users.find((u) => u.name === user)) {
      users.push(registeredUser);
      console.log("user registered", user);
      socket.emit("registered", registeredUser);
      broadcast(socket)
    } else {
      socket.emit("registered", null);
    }
  });
  socket.on("verifyToken", (token) => {
    const user = _.find(users, { token: token });
    if (user) {
      socket.emit("verified", user);
      const targetUser = users[users.findIndex(user => user.token === token)]
      targetUser.isOnline = true
      targetUser.socketId = socket.id
      // socket.emit("online users", getOnlineUsers(user.token))
      broadcast(socket)
    } else {
      socket.emit("verified", null);
    }
  });
  socket.on("online users", (token) => {
    // const onlineUsers = _.filter(users, (user) => user.isOnline && user.token !== token);
    socket.emit("online users", getOnlineUsers(token))
  });
  socket.on("load online users",(token) => {
    // const onlineUsers = _.filter(users, (user) => user.isOnline && user.token !== token);
    socket.emit("load online users", getOnlineUsers(token))
  });
  function getOnlineUsers(userToken) {
    const onlineUsers = _.filter(users, (user) => user.isOnline && user.token !== userToken);
    return onlineUsers.map(user=>user.name)
  }
  function broadcast(socket) {
    socket.broadcast.emit('online users', getOnlineUsers())
  }

});
server.listen(3000, () => {
  console.log("listening on *:3000");
});
