const nodemailer = require('nodemailer');

// Email configuration with optimized settings
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  },
  pool: true, // Use connection pool
  maxConnections: 5,
  maxMessages: 100,
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 20000 // 20 seconds
});

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP Email
const sendOTPEmail = async (email, otp, name) => {
  // For development: log OTP to console if email is not configured properly
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || 
      process.env.EMAIL_PASS === 'your-app-password' || 
      process.env.EMAIL_USER === 'your-email@gmail.com') {
    console.log(`\n🔐 OTP for ${email}: ${otp}`);
    console.log(`User: ${name}`);
    console.log(`Copy this OTP to verify the account\n`);
    return true; // Return success for development
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Email - Synergy Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Synergy Platform!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for signing up! Please use the following OTP to verify your email address:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't create an account with us, please ignore this email.</p>
        <p>Best regards,<br>Synergy Platform Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    console.log(`\n🔐 FALLBACK - OTP for ${email}: ${otp}`);
    console.log(`User: ${name}`);
    console.log(`Email failed, but you can use this OTP to verify the account\n`);
    return true; // Return success even if email fails, so user can still use OTP from console
  }
};

// Send Join Request Notification to Project Owner
const sendJoinRequestEmail = async (ownerEmail, ownerName, requesterName, projectTitle, message) => {
  // For development: log notification to console if email is not configured properly
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || 
      process.env.EMAIL_PASS === 'your-app-password' || 
      process.env.EMAIL_USER === 'your-email@gmail.com') {
    console.log(`\n📧 Join Request Notification for ${ownerEmail}`);
    console.log(`Project: ${projectTitle}`);
    console.log(`From: ${requesterName}`);
    console.log(`Message: ${message}\n`);
    return true; // Return success for development
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: ownerEmail,
    subject: `New Join Request for ${projectTitle} - Synergy Platform`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Join Request</h2>
        <p>Hi ${ownerName},</p>
        <p>You have received a new join request for your project "${projectTitle}".</p>
        <div style="background-color: #f4f4f4; padding: 20px; margin: 20px 0;">
          <p><strong>From:</strong> ${requesterName}</p>
          <p><strong>Message:</strong></p>
          <p style="font-style: italic;">${message}</p>
        </div>
        <p>Please log in to the Synergy Platform to review and respond to this request.</p>
        <p>Best regards,<br>Synergy Platform Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Join request notification email sent successfully to ${ownerEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending join request notification:', error.message);
    return false;
  }
};

// Send Join Request Response Notification to Requester
const sendRequestResponseEmail = async (requesterEmail, requesterName, projectTitle, status, ownerName) => {
  // For development: log notification to console if email is not configured properly
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || 
      process.env.EMAIL_PASS === 'your-app-password' || 
      process.env.EMAIL_USER === 'your-email@gmail.com') {
    console.log(`\n📧 Request Response Notification for ${requesterEmail}`);
    console.log(`Project: ${projectTitle}`);
    console.log(`Status: ${status}`);
    console.log(`From: ${ownerName}\n`);
    return true; // Return success for development
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: requesterEmail,
    subject: `Join Request ${status === 'accepted' ? 'Accepted' : 'Update'} for ${projectTitle} - Synergy Platform`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Join Request ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
        <p>Hi ${requesterName},</p>
        ${status === 'accepted' ? 
          `<p>Great news! Your request to join "${projectTitle}" has been accepted by ${ownerName}.</p>
           <p>You can now access the project and collaborate with the team.</p>` :
          `<p>Your request to join "${projectTitle}" has been reviewed by ${ownerName}.</p>
           <p>Unfortunately, the team is unable to accept your request at this time.</p>`
        }
        <p>You can log in to the Synergy Platform to view more details.</p>
        <p>Best regards,<br>Synergy Platform Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Request response email sent successfully to ${requesterEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending request response email:', error.message);
    return false;
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendJoinRequestEmail,
  sendRequestResponseEmail
};