const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const schedule = require('node-schedule'); // Import node-schedule

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    cb(null, uploadDir); // Ensure 'uploads/' directory exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Rename file with timestamp
  },
});

const upload = multer({ storage: storage });

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'tothefuture2407@gmail.com', // Your Gmail
    pass: 'othk obnr qpjv hxcn',       // Replace with your Gmail app password
  },
});

// Route to handle email scheduling
app.post('/schedule-email', upload.single('image'), async (req, res) => {
  try {
    // Destructure input fields
    const { recipient, subject, body, sendDate, sendTime } = req.body;

    // Input validation
    if (!recipient || !subject || !body || !sendDate || !sendTime) {
      return res.status(400).json({ message: 'All fields (recipient, subject, body, sendDate, sendTime) are required.' });
    }

    // Combine the send date and time to create a Date object in UTC
    const localDateTime = new Date(`${sendDate}T${sendTime}:00`); // Local time input
    const scheduledSendDate = new Date(localDateTime.toLocaleString('en-US', { timeZone: 'UTC' })); // Convert to UTC
    
    if (isNaN(scheduledSendDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date or time format.' });
    }

    // Ensure the scheduled time is in the future
    if (scheduledSendDate <= new Date()) {
      return res.status(400).json({ message: 'Scheduled time must be in the future.' });
    }

    // Configure email options
    const mailOptions = {
      from: '"Your App Name" <tothefuture2407@gmail.com>',
      to: recipient, // Recipient's email
      subject: subject.trim(),
      html: body.trim(),
    };

    // Attach file if uploaded
    if (req.file) {
      mailOptions.attachments = [
        {
          filename: req.file.originalname,
          path: path.join(__dirname, 'uploads', req.file.filename),
        },
      ];
    }

    // Log when the email is scheduled
    console.log(`Email scheduled for ${recipient} at ${scheduledSendDate.toISOString()}`);

    // Schedule the email using node-schedule (in UTC)
    schedule.scheduleJob(scheduledSendDate, async () => {
      try {
        console.log(`Email sending to ${recipient} at ${new Date().toISOString()}`);
        await transporter.sendMail(mailOptions);
        console.log(`Email successfully sent to ${recipient} at ${new Date().toISOString()}`);
      } catch (error) {
        console.error('Failed to send email:', error.message);
      }
    });

    res.status(200).json({ message: `Email scheduled to be sent at ${scheduledSendDate.toISOString()}.` });
  } catch (error) {
    console.error('Error scheduling email:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

const PORT = process.env.PORT || 1000; // Fallback to 5000 if the PORT env variable is not set
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
