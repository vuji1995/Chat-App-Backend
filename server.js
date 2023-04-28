const PORT = process.env.PORT || 6001;
const dotenv = require(`dotenv`);
dotenv.config({ path: `./config.env` });
const app = require(`../backend/app`);
const mongoose = require(`mongoose`);

const DB = process.env.MONGO_URL.replace(`<PASSWORD>`, process.env.PASSWORD);

mongoose
  .connect(DB, {})
  .then((con) => {
    console.log(`DB is connected`);
  })
  .catch((err) => {
    console.log(err);
  });

const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server);

io.on("connection", (socket) => {
  console.log("A client connected");

  socket.on("message", (message) => {
    console.log("Received message:", message);
    io.emit("message", message);
  });
});

server.listen(PORT, () => {
  console.log(`Aplikacija radi na portu broj ${PORT}`);
});

console.log(process.cwd());
