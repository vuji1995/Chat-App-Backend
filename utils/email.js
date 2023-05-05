const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.EMAIL_API_KEY);

const sendMail = async (options) => {
  const mailOptions = {
    from: "Chat App <chatappmail2023@gmail.com>",
    to: options.email,
    text: options.message,
    subject: options.subject,
  };

  await sgMail.send(mailOptions);
};

module.exports = sendMail;
