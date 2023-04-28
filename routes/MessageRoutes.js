const express = require(`express`);
const router = express.Router();
const messageController = require(`../controller/messageController`);

router.post(`/sendMessage`, messageController.addMessage);
router.get(`/getMessage/:chatId`, messageController.getMessages);

module.exports = router;
