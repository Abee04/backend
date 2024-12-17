const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const schedule = require('node-schedule');  // Import node-schedule

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "tmadhumitha24@gmail.com",       // Replace with your email
    pass: "xwnf ghxe irzj zrtc",    // Replace with your Gmail app password
  },
});

// Route to handle email scheduling
app.post('/schedule-email', upload.single('image'), async (req, res) => {
  const { recipient, subject, body, sendDate, sendTime } = req.body;

  // Combine the send date and time to create a Date object
  const scheduledSendDate = new Date(`${sendDate}T${sendTime}:00`);

  // Ensure the scheduled time is in the future
  if (scheduledSendDate <= new Date()) {
    return res.status(400).json({ message: 'Scheduled time must be in the future.' });
  }

  const mailOptions = {
    from: 'your-email@gmail.com',
    to: recipient,
    subject: subject,
    html: body,
  };

  if (req.file) {
    mailOptions.attachments = [
      {
        filename: req.file.originalname,
        path: path.join(__dirname, 'uploads', req.file.filename),
      },
    ];
  }

  // Use node-schedule to schedule the email at the specified time
  schedule.scheduleJob(scheduledSendDate, async () => {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${recipient} at ${scheduledSendDate}`);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  });

  res.status(200).json({ message: `Email scheduled to be sent at ${scheduledSendDate.toLocaleString()}.` });
});

// Start server and listen on the dynamically assigned port from Render
const PORT = process.env.PORT || 5000; // Fallback to 5000 if the PORT env variable is not set
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
