const sgMail = require('@sendgrid/mail');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP Email
const sendOTPEmail = async (email, otp, name) => {
  const msg = {
    to: email,
    from: process.env.EMAIL_FROM,
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
    await sgMail.send(msg);
    console.log(`✅ Email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    throw error;
  }
};

// Send Join Request Notification to Project Owner
const sendJoinRequestEmail = async (ownerEmail, ownerName, requesterName, projectTitle, message) => {
  const msg = {
    to: ownerEmail,
    from: process.env.EMAIL_FROM,
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
    await sgMail.send(msg);
    console.log(`✅ Join request notification email sent successfully to ${ownerEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending join request notification:', error.message);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    throw error;
  }
};

// Send Join Request Response Notification to Requester
const sendRequestResponseEmail = async (requesterEmail, requesterName, projectTitle, status, ownerName) => {
  const msg = {
    to: requesterEmail,
    from: process.env.EMAIL_FROM,
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
    await sgMail.send(msg);
    console.log(`✅ Request response email sent successfully to ${requesterEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending request response email:', error.message);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    throw error;
  }
};

// Send Task Assignment Email
const sendTaskAssignmentEmail = async (assigneeEmail, assigneeName, taskTitle, taskDescription, projectTitle, assignedByName, dueDate) => {
  const msg = {
    to: assigneeEmail,
    from: process.env.EMAIL_FROM,
    subject: `New Task Assigned: "${taskTitle}" - ${projectTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Task Assigned!</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p>Hi <strong>${assigneeName}</strong>,</p>
          <p>You have been assigned a new task in the project <strong>"${projectTitle}"</strong>.</p>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="color: #667eea; margin-top: 0;">📋 Task Details:</h3>
            <p><strong>Task:</strong> ${taskTitle}</p>
            <p><strong>Description:</strong> ${taskDescription}</p>
            <p><strong>Assigned by:</strong> ${assignedByName}</p>
            ${dueDate ? `<p><strong>Due date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>` : ''}
          </div>
          
          <p>Please log in to your project dashboard to view the full task details and update your progress.</p>
          
          <div style="margin: 25px 0; padding: 15px; background: #e3f2fd; border-radius: 5px;">
            <p style="margin: 0; color: #1976d2;">
              💡 <strong>Tip:</strong> Keep your team updated on your progress by updating the task status regularly.
            </p>
          </div>
          
          <p>Good luck with your task!</p>
          <p>Best regards,<br>The Synergy Platform Team</p>
        </div>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Task assignment notification sent to ${assigneeEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending task assignment email:', error.message);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    throw error;
  }
};

// Send Meeting Invitation Email
const sendMeetingInvitationEmail = async (attendeeEmail, attendeeName, meetingTitle, meetingDescription, projectTitle, scheduledByName, meetingDate, meetingTime, meetingLink, agenda) => {
  const meetingDateTime = new Date(meetingDate);
  const formattedDate = meetingDateTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const msg = {
    to: attendeeEmail,
    from: process.env.EMAIL_FROM,
    subject: `Meeting Invitation: "${meetingTitle}" - ${projectTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">📅 You're Invited to a Team Meeting!</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p>Hi <strong>${attendeeName}</strong>,</p>
          <p>You have been invited to a team meeting for the project <strong>"${projectTitle}"</strong>.</p>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="color: #667eea; margin-top: 0;">📋 Meeting Details:</h3>
            <p><strong>Meeting:</strong> ${meetingTitle}</p>
            ${meetingDescription ? `<p><strong>Description:</strong> ${meetingDescription}</p>` : ''}
            <p><strong>Scheduled by:</strong> ${scheduledByName}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${meetingTime}</p>
            ${meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}" style="color: #667eea;">${meetingLink}</a></p>` : ''}
            ${agenda ? `<p><strong>Agenda:</strong> ${agenda}</p>` : ''}
          </div>
          
          <p>Please mark your calendar and join the meeting on time. You can find more details in your project dashboard.</p>
          
          <div style="margin: 25px 0; padding: 15px; background: #e3f2fd; border-radius: 5px;">
            <p style="margin: 0; color: #1976d2;">
              💡 <strong>Tip:</strong> Make sure to prepare any materials or updates you need to share during the meeting.
            </p>
          </div>
          
          <p>Looking forward to seeing you there!</p>
          <p>Best regards,<br>The Synergy Platform Team</p>
        </div>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Meeting invitation sent to ${attendeeEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending meeting invitation email:', error.message);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    throw error;
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendJoinRequestEmail,
  sendRequestResponseEmail,
  sendTaskAssignmentEmail,
  sendMeetingInvitationEmail
};