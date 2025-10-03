const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
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

module.exports = {
  generateOTP,
  sendOTPEmail
};