const express = require(`express`);
const app = express();
const userRouter = require(`../backend/routes/userRoutes`);
const chatRouter = require(`../backend/routes/ChatRoutes`);
const messageRouter = require(`../backend/routes/MessageRoutes`);
const cors = require(`cors`);
const bodyParser = require(`body-parser`);

//MIDLEWARE

app.use(bodyParser.json());

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    res.status(400).json({ status: "failed", message: "Invalid JSON payload" });
  } else {
    next();
  }
});

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

//ROUTES
app.use(`/`, userRouter);
app.use(`/chat`, chatRouter);
app.use(`/messages`, messageRouter);

module.exports = app;
