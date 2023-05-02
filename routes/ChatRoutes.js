const path = require("path");
const express = require(`express`);
const router = express.Router();
const chatController = require(`../controller/chatController`);

router.post("/createChat", chatController.createChat);
router.get("/:userId", chatController.userChats);
router.post("/find/:firstId/:secondId", chatController.findChat);
router.post("/getChats", chatController.getAllChats);

module.exports = router;
