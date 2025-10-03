const express = require('express');
const nodemailer = require('nodemailer');
const Meeting = require('../models/Meeting');
const Project = require('../models/Project');
const User = require('../models/User');

const router = express.Router();

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send Meeting Invitation Email
const sendMeetingInvitationEmail = async (attendeeEmail, attendeeName, meetingTitle, meetingDescription, projectTitle, scheduledByName, meetingDate, meetingTime, meetingLink, agenda) => {
  // For development: log notification to console if email is not configured properly
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || 
      process.env.EMAIL_PASS === 'your-app-password' || 
      process.env.EMAIL_USER === 'your-email@gmail.com') {
    console.log(`\n📅 MEETING INVITATION NOTIFICATION:`);
    console.log(`To: ${attendeeEmail} (${attendeeName})`);
    console.log(`Project: ${projectTitle}`);
    console.log(`Meeting: ${meetingTitle}`);
    console.log(`Description: ${meetingDescription}`);
    console.log(`Scheduled by: ${scheduledByName}`);
    console.log(`Date & Time: ${new Date(meetingDate).toLocaleDateString()} at ${meetingTime}`);
    console.log(`Meeting Link: ${meetingLink || 'No link provided'}`);
    console.log(`Agenda: ${agenda || 'No agenda provided'}`);
    console.log(`\n📋 Please check your project dashboard to view meeting details.`);
    return;
  }

  try {
    const meetingDateTime = new Date(meetingDate);
    const formattedDate = meetingDateTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: attendeeEmail,
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
    });
    console.log(`✅ Meeting invitation sent to ${attendeeEmail}`);
  } catch (error) {
    console.error('❌ Error sending meeting invitation email:', error.message);
    console.log(`\n📧 FALLBACK - Meeting invitation for ${attendeeEmail}:`);
    console.log(`Meeting "${meetingTitle}" in project "${projectTitle}" scheduled by ${scheduledByName}`);
    console.log(`Date: ${new Date(meetingDate).toLocaleDateString()} at ${meetingTime}`);
    console.log(`Link: ${meetingLink || 'No link provided'}`);
  }
};

// Schedule a new meeting (only project leads can schedule meetings)
router.post('/', async (req, res) => {
  try {
    const { 
      projectId, 
      title, 
      description,
      scheduledBy, 
      scheduledByName,
      meetingDate,
      meetingTime,
      duration,
      meetingLink,
      location,
      agenda
    } = req.body;

    // Verify that the project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify that the person scheduling the meeting is the project lead
    if (project.creatorEmail !== scheduledBy) {
      return res.status(403).json({ message: 'Only project leads can schedule meetings' });
    }

    // Prepare attendees list (all project members)
    const attendees = project.members.map(memberEmail => ({
      email: memberEmail,
      name: memberEmail, // We'll use email as name for now
      status: 'invited'
    }));

    // Create the meeting
    const meeting = new Meeting({
      projectId,
      projectTitle: project.title,
      title,
      description: description || '',
      scheduledBy,
      scheduledByName,
      meetingDate: new Date(meetingDate),
      meetingTime,
      duration: duration || 60,
      meetingLink: meetingLink || '',
      location: location || 'Online',
      agenda: agenda || '',
      attendees
    });

    await meeting.save();

    // Send email notifications to all team members
    for (const attendee of attendees) {
      try {
        await sendMeetingInvitationEmail(
          attendee.email,
          attendee.name,
          title,
          description,
          project.title,
          scheduledByName,
          meetingDate,
          meetingTime,
          meetingLink,
          agenda
        );
      } catch (emailError) {
        console.error(`❌ Failed to send meeting invitation to ${attendee.email}:`, emailError.message);
        // Continue with other attendees even if one email fails
      }
    }

    res.status(201).json({
      message: 'Meeting scheduled successfully and invitations sent to all team members',
      meeting
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all meetings for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userEmail } = req.query;

    // Verify that the project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify that the user is a member of the project or the project lead
    if (!project.members.includes(userEmail) && project.creatorEmail !== userEmail) {
      return res.status(403).json({ message: 'Not authorized to view meetings for this project' });
    }

    const meetings = await Meeting.find({ projectId }).sort({ meetingDate: 1 });
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get meetings for a specific user (as attendee)
router.get('/attendee/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;
    const { status } = req.query;

    const filter = { 'attendees.email': userEmail };
    if (status) {
      filter.status = status;
    }

    const meetings = await Meeting.find(filter)
      .populate('projectId', 'title description')
      .sort({ meetingDate: 1 });

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update meeting attendance status
router.put('/:meetingId/attendance', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { userEmail, status } = req.body;

    if (!['invited', 'accepted', 'declined', 'maybe'].includes(status)) {
      return res.status(400).json({ message: 'Invalid attendance status' });
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Find the attendee and update their status
    const attendeeIndex = meeting.attendees.findIndex(att => att.email === userEmail);
    if (attendeeIndex === -1) {
      return res.status(403).json({ message: 'You are not invited to this meeting' });
    }

    meeting.attendees[attendeeIndex].status = status;
    await meeting.save();

    res.json({
      message: 'Attendance status updated successfully',
      meeting
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update meeting details (only project lead can update)
router.put('/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { title, description, meetingDate, meetingTime, meetingLink, location, agenda, userEmail } = req.body;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Only project lead can update meeting details
    if (meeting.scheduledBy !== userEmail) {
      return res.status(403).json({ message: 'Only the meeting organizer can update meeting details' });
    }

    // Update fields
    if (title) meeting.title = title;
    if (description !== undefined) meeting.description = description;
    if (meetingDate) meeting.meetingDate = new Date(meetingDate);
    if (meetingTime) meeting.meetingTime = meetingTime;
    if (meetingLink !== undefined) meeting.meetingLink = meetingLink;
    if (location) meeting.location = location;
    if (agenda !== undefined) meeting.agenda = agenda;

    await meeting.save();

    res.json({
      message: 'Meeting updated successfully',
      meeting
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel meeting (only project lead can cancel)
router.delete('/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { userEmail } = req.body;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Only project lead can cancel meetings
    if (meeting.scheduledBy !== userEmail) {
      return res.status(403).json({ message: 'Only the meeting organizer can cancel meetings' });
    }

    await Meeting.findByIdAndDelete(meetingId);

    res.json({ message: 'Meeting cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;