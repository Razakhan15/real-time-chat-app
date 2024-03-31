const express = require("express");
const dotenv = require("dotenv");
const connectDb = require("./config/db");
const userRoutes = require("./Routes/userRoutes");
const chatRoutes = require("./Routes/chatRoutes");
const messageRoutes = require("./Routes/messageRoutes");
const path = require("path");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
dotenv.config();
const PORT = process.env.PORT || 5000;
const app = express();
connectDb();
app.use(express.json()); //to accept json data from client

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

const __dirname1 = path.resolve("/coding/web development/prac/live chat using db");
console.log(__dirname1);
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "frontend", "build")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("api running successfully");
  });
}

app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, console.log(`app is running on ${PORT}`));
const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:5102",
  },
});
io.on("connection", (socket) => {
  console.log("connected to socket");
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });
  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("user joined ", room);
  });
  socket.on("typing", (room) => {
    socket.in(room).emit("typing");
  });
  socket.on("stop typing", (room) => {
    socket.in(room).emit("stop typing");
  });
  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;
    if (!chat.users) return console.log("chat.users not defined");
    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;
      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });
  socket.off("setup", () => {
    console.log("user disconnected");
    socket.leave(userData._id);
  });
});
