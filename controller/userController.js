const User = require(`../model/userModel`);
const jwt = require(`jsonwebtoken`);
const { promisify } = require(`util`);
const crypto = require(`crypto`);
const sendEmail = require(`../utils/email`);

//GOOGLE CLOUD IMAGE SAVING
const { Storage } = require("@google-cloud/storage");
const Multer = require("multer");

const storage = new Storage({
  projectId: "profileimagesstorage",
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const bucket = storage.bucket("profile_images_storage");

const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const signInToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET_STRING, {
    expiresIn: process.env.EXPIRES_IN,
  });
};

exports.login = async (req, res, next) => {
  if (typeof req.body !== "object") {
    return res
      .status(400)
      .json({ status: "failed", message: "Invalid JSON payload" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(200).json({
      status: "failed",
      message: "Please provide email and password!",
    });
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return res.status(200).json({
      status: "failed",
      message: "Email or password are incorrect!",
    });
  }

  const token = signInToken(user._id);

  res.status(200).json({
    status: "success",
    token,
    message: "You have logged in successfully!",
  });
};

exports.protectedRoute = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith(`Bearer`)
  ) {
    token = req.headers.authorization.split(` `)[1];
  }

  if (!token) {
    return res.status(401).json({
      status: "failed",
      message: "Invalid token",
    });
  }

  try {
    const decoded = await promisify(jwt.verify)(
      token,
      process.env.SECRET_STRING
    );

    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
      return res.status(400).json({
        status: "failed",
        message: "The user belonging to this token does not exists",
      });
    }

    //send user's data to current user
    res.status(200).json({
      status: "success",
      data: {
        user_id: freshUser._id,
        email: freshUser.email,
        name: freshUser.name,
      },
    });
  } catch (error) {
    /*
    return res.status(401).json({
      status: "failed",
      message: "Invalid token",
    });*/
    return res.redirect("http://localhost:3000/");
  }
};

exports.forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(400).json({
      status: "failed",
      message: `User with this email : ${req.body.email} does not exists`,
    });
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/resetPassword/${resetToken}`;

  const message = `Forgot password? Submit a PATCH request with your new password and password confirm to ${resetURL}.\ If you didn't forgot your password please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token is valid for 10minutes!",
      message,
    });
    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (error) {
    user.createPasswordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(400).json({
      status: "error",
      message: `${error}`,
    });
  }
};

exports.resetPassword = async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user || user === undefined) {
    return res.status(500).json({
      status: "failed",
      message: "Token is expired or invalid!",
    });
  }

  if (!req.body.password || !req.body.passwordConfirm) {
    return res.status(400).json({
      status: "failed",
      message: "Please provide both password and passwordConfirm!",
    });
  }

  if (req.body.password !== req.body.passwordConfirm) {
    return res.status(400).json({
      status: "failed",
      message: "Please provide same password and passwordConfirm!",
    });
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;
  await user.save();

  const token = signInToken(user._id);

  res.status(200).json({
    status: "success",
    message: "password changed",
    token,
  });
};

exports.testServer = async (req, res, next) => {
  const data = req.body;
  res.status(200).json({
    status: "success",
    message: "password changed",
    data,
  });
};

exports.uploadProfileIMG = async (req, res, next) => {
  multer.single("profilePicture")(req, res, (err) => {
    if (err) {
      console.error(err);
      return res.status(400).json({ error: "Error uploading file" });
    }

    if (!req.file) {
      console.error("No file received");
      return res.status(400).json({ error: "No file received" });
    }

    const timeStamp = new Date()
      .toLocaleString("en-GB", {
        timeZone: "Europe/Paris",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      })
      .replace(/[/\\]/g, "-")
      .replace(/[,]/g, "")
      .replace(/[\s:]/g, "-");

    const email = req.body.email;
    const blob = bucket.file(`${email}-${timeStamp}-${req.file.originalname}`);
    const blobStream = blob.createWriteStream();

    blobStream.on("error", (err) => {
      console.error(err);
      return next(err);
    });

    blobStream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

      return res.status(200).json({ imageUrl: publicUrl });
    });

    blobStream.end(req.file.buffer);
  });
};

exports.getProfileImage = async (req, res, next) => {
  let imageUrl = `test`;
  console.log(req.body);
  const prefix = `${req.body.email}-`;

  const [files] = await storage.bucket(bucket.name).getFiles({
    prefix: prefix,
  });

  if (files.length > 0) {
    // sort the files by creation time (newest first)
    const sortedFiles = files.sort((a, b) => {
      return b.metadata.timeCreated - a.metadata.timeCreated;
    });

    // get the URL of the newest file
    const newestFile = sortedFiles[0];
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${newestFile.name}`;

    res.status(200).json({
      status: "success",
      body: {
        imageUrl,
      },
    });
  }
};

exports.getUserData = async (req, res, next) => {
  console.log(req.body);
  const user_id = req.body.id;

  try {
    const user = await User.findById(user_id);
    console.log(user);
    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "failed",
      error,
    });
  }
};
