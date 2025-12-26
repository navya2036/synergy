# 🚀 Synergy — Project Collaboration Platform

Synergy is a full-stack project collaboration platform built using the MERN stack. It enables teams to manage projects, collaborate in real time, and share resources efficiently from a single workspace.

The platform supports secure authentication, role-based project access, real-time communication, task tracking, meeting scheduling, and cloud-based file sharing.

## 🌐 Live Demo

**Frontend:** https://synergy-sigma.vercel.app  
**Backend API:** https://synergy-ut87.onrender.com/api

## ✨ Key Features

### 🔐 Authentication & User Management

- Secure user registration and login using JWT
- Email verification using OTP (SendGrid)
- User profiles with skills, education, and experience
- Role-based access control for project resources

### 📁 Project Management

- Create and manage projects with descriptions, categories, and required skills
- Define team size and manage project members
- Track project status (Active / Completed)
- View projects created and joined by a user

### 🤝 Team Collaboration

- Real-time team chat using Socket.IO with persistent chat history
- Join request system with approval/rejection workflow
- Task management with priorities, deadlines, and status tracking
- Meeting scheduler with email notifications and attendance tracking

### 📄 Resource Sharing

- Upload and share PDF resources securely
- Files stored in Cloudinary (cloud storage)
- File metadata stored in MongoDB
- Access restricted to project members only

## 🧠 Architecture Overview

- REST APIs for CRUD operations and data persistence
- Socket.IO for real-time project chat
- MongoDB Atlas as the primary database for users, projects, tasks, meetings, and messages
- Cloudinary for scalable and persistent file storage
- SendGrid for transactional email delivery (OTP & notifications)

## 🛠️ Tech Stack

### Frontend

- React.js
- Axios
- CSS
- Deployed on **Vercel**

### Backend

- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Socket.IO
- SendGrid (Email Service)
- Cloudinary (File Storage)
- DeplEnvironment Variables

### Backend (`server/.env`)

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=verified_sender_email
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend

```
REACT_APP_API_URL=https://synergy-ut87.onrender.com
```

## ▶️ Getting Started (Local Setup)

### Prerequisites

- Node.js (v14+)
- MongoDB
- npm or yarn

### Installation

```bash
git clone https://github.com/navya2036/synergy.git
cd synergy
```

### Backend

```bash
cd server
npm install
npm run dev
```

### Frontend

```bash
cd client
npm install
npm start
```

- **Frontend** runs on `http://localhost:3000`
- **Backend** runs on `http://localhost:5000/api └── server.js
  │
  └── README.md

```

## 🔐 Security Highlights

- JWT-based authentication
- Password hashing with bcrypt
- Protected API endpoints
- Email verification for new users
- Backend-enforced role and membership checks
- Secure cloud-based file storage
- Rate limiting on authentication routes
- Socket.IO authentication with JWT

## ⚠️ Email Deliverability Note

OTP and notification emails may initially appear in the spam folder due to domain reputation. Marking emails as **Not Spam** improves deliverability.

## 🚧 Future Enhancements

- Role-based permissions (Admin / Member)
- Video conferencing integration
- Activity logs & analytics
- Real-time collaborative documents
- Mobile application support

## 📜 License

This project is licensed under the MIT License.
```
