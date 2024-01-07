const nodeMailer = require('nodemailer');

const nodemailer = require('nodemailer');
const {HTML_TEMPLATE} = require('../public/javascripts/mail-template');
require('dotenv').config();

// Create a nodemailer transporter using your email service credentials
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 587, false for other ports
    // requireTLS: true,
    auth: {
        user: process.env.APP_MAIL_ID,
        pass: process.env.APP_MAIL_PASSWORD,
    },
});

// Function to send mail with OTP
const sendMail = (toEmail, otp) => {
  // Mail options
  const mailOptions = {
    debug: true,
    from: process.env.APP_MAIL_ID,
    to: toEmail,
    subject: 'OTP Verification',
    html: HTML_TEMPLATE(otp)
  };

  // Send mail
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending mail:', error);
    } else {
      console.log('Mail sent:', info.response);
    }
  });
};

// Export the sendMail function
module.exports = { sendMail };


module.exports = {
    sendMail
}