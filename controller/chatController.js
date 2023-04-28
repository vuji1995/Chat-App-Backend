const chatModel = require(`../model/chatModel`);
const User = require(`../model/userModel`);

exports.createChat = async (req, res) => {
  const { receiverID } = req.body;
  const findUser = await User.findById(receiverID);
  if (findUser === null) {
    res.status(400).json({
      status: "failed",
      message: `User with ID: ${receiverID} does not exist!`,
    });
    return;
  }

  try {
    const newChat = new chatModel({
      members: [req.body.senderID, receiverID],
    });
    const result = await newChat.save();
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "failed",
      message: "An error occurred while creating a chat.",
    });
  }
};

exports.userChats = async (req, res) => {
  try {
    const chat = await chatModel.find({
      members: { $in: [req.params.userId] },
    });
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.findChat = async (req, res) => {
  try {
    const chat = await chatModel.findOne({
      members: { $all: [req.params.firstId, req.params.secondId] },
    });
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.getAllChats = async (req, res) => {
  console.log(req.body);
  try {
    const { senderID, receiverID } = req.body;
    const chats = await chatModel.find({
      members: { $all: [senderID, receiverID] },
    });
    console.log(chats);
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json(error);
  }
};
