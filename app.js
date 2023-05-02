const path = require("path");
const express = require(`express`);
const app = express();
const userRouter = require(path.join(__dirname, "/routes/userRoutes.js"));
const chatRouter = require(path.join(__dirname, "/routes/ChatRoutes.js"));
const messageRouter = require(path.join(__dirname, "/routes/messageRoutes.js"));
const cors = require(`cors`);
const bodyParser = require(`body-parser`);

//MIDLEWARE

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(bodyParser.json());

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    res.status(400).json({ status: "failed", message: "Invalid JSON payload" });
  } else {
    next();
  }
});

//ROUTES
app.use(`/`, userRouter);
app.use(`/chat`, chatRouter);
app.use(`/messages`, messageRouter);

module.exports = app;
