const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const cron = require("node-cron");
const cors = require("cors");

const app = express();

// Middleware setup
app.use(bodyParser.json());
app.use(cors());

const emailQueue = []; // Temporary array to store scheduled emails

// Endpoint to schedule an email
app.post("/schedule-email", (req, res) => {
  const { recipient, subject, body, sendDate, sendTime } = req.body;

  if (!recipient || !sendDate || !sendTime || !body) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Combine the date and time into a full Date object
  const sendDateTime = new Date(`${sendDate}T${sendTime}:00`);

  if (sendDateTime <= new Date()) {
    return res.status(400).json({ message: "Scheduled time must be in the future!" });
  }

  // Add the email to the queue
  emailQueue.push({ recipient, subject, body, sendDateTime });
  res.status(200).json({ message: "Email scheduled successfully" });
});

// Function to send emails using Nodemailer
const sendEmail = (email) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "tmadhumitha24@gmail.com",  // Replace with your email
      pass: "xwnf ghxe irzj zrtc",     // Replace with your Gmail app password
    },
  });

  const mailOptions = {
    from: "tmadhumitha24@gmail.com",   // Replace with your email
    to: email.recipient,
    subject: email.subject || "Scheduled Email",
    text: email.body,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};

// Cron job to send emails at the correct time
cron.schedule("* * * * *", () => {
  const now = new Date();
  
  // Loop through the email queue and check for emails to send
  emailQueue.forEach((email, index) => {
    if (email.sendDateTime <= now) {
      sendEmail(email);
      emailQueue.splice(index, 1); // Remove sent email from the queue
    }
  });
});

const PORT = process.env.PORT || 5000; // Use Render's port or default to 5000 if running locally
app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
