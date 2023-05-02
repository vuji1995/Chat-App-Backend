const path = require("path");
const MessageModel = require(path.join(__dirname, "../model/MessageModel"));

exports.addMessage = async (req, res) => {
  const chatId = req.body.message.chatId;
  const text = req.body.message.text;
  const senderId = req.body.message.senderId;

  const message = new MessageModel({
    chatId,
    senderId,
    text,
  });

  try {
    const result = await message.save();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.getMessages = async (req, res) => {
  const { chatId } = req.params;

  try {
    const result = await MessageModel.find({ chatId });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
};
