const express = require(`express`);
const router = express.Router();
const userController = require(`../controller/userController`);
const jwt = require(`jsonwebtoken`);
const User = require(`../model/userModel`);

const signInToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET_STRING, {
    expiresIn: process.env.EXPIRES_IN,
  });
};

router.post("/signup", async (req, res, next) => {
  const emailExists = await User.findOne({ email: req.body.email });
  if (emailExists) {
    return res.status(400).json({
      status: "failed",
      message: "Email already in use",
    });
  }

  const phoneNumberExists = await User.findOne({ phone: req.body.phone });
  if (phoneNumberExists) {
    return res.status(400).json({
      status: "failed",
      message: "Phone number already exists",
    });
  }

  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone,
      passwordConfirm: req.body.passwordConfirm,
    });

    await newUser.save();

    const token = signInToken(newUser._id);

    res.status(200).json({
      status: "success",
      token,
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    const errorMessage = error.message;
    res.status(500).json({
      status: "failed",
      message: errorMessage,
    });
  }
});

router.post(`/login`, userController.login);
router.get(`/protectedRoute`, userController.protectedRoute);
router.post(`/forgotPassword`, userController.forgotPassword);
router.patch(`/resetPassword/:token`, userController.resetPassword);
router.post(`/dashboard`, userController.protectedRoute);
router.post(`/uploadProfileIMG`, userController.uploadProfileIMG);
router.post(`/getProfileImage`, userController.getProfileImage);
router.post(
  `/getOtherUserProfileImage`,
  userController.getOtherUserProfileImage
);
router.post(`/getUserData`, userController.getUserData);

module.exports = router;
