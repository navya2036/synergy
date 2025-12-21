# 🚀 Synergy — Project Collaboration Platform

Synergy is a full-stack project collaboration platform built with the MERN stack, designed to help teams manage projects, communicate in real time, and collaborate efficiently from a single workspace.

It supports secure authentication, role-based project access, real-time chat, task tracking, meeting scheduling, and cloud-based resource sharing.

## ✨ Key Features

### 🔐 Authentication & User Management

- Secure user registration and login using JWT
- Email verification using OTP
- User profiles with skills, education, and experience
- Role-based access control for project resources

### 📁 Project Management

- Create and manage projects with descriptions, categories, and required skills
- Define team size and manage project members
- Track project status and progress
- View projects created and joined by a user

### 🤝 Team Collaboration

- Real-time team chat using Socket.IO (with persistent chat history)
- Join request system with approval/rejection workflow
- Task management with priorities, deadlines, and status tracking
- Meeting scheduler with email notifications and attendance tracking

### 📄 Resource Sharing

- Upload and share PDF resources securely
- Files stored in Cloudinary (cloud storage)
- Metadata stored in MongoDB
- Access restricted to project members

## 🧠 Architecture Overview

- REST APIs for CRUD operations and data persistence
- Socket.IO for real-time project chat
- MongoDB as the primary database for users, projects, tasks, meetings, and messages
- Cloudinary for scalable and persistent file storage

## 🛠️ Tech Stack

### Frontend

- React.js
- Axios
- CSS
- Socket.IO Client

### Backend

- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Socket.IO
- Cloudinary (file storage)
- Nodemailer (email notifications)

## ⚙️ Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB
- npm or yarn

### Installation

**1️⃣ Clone the repository**

```bash
git clone https://github.com/navya2036/synergy.git
cd synergy
```

**2️⃣ Install backend dependencies**

```bash
cd server
npm install
```

**3️⃣ Install frontend dependencies**

```bash
cd ../client
npm install
```

### Environment Variables

Create a `.env` file inside the `server` folder:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Run the Application (Development)

From the root folder:

```bash
npm run dev
```

- **Frontend** → `http://localhost:3000`
- **Backend** → `http://localhost:5000/api`

### Production Build

```bash
cd client
npm run build
```

The frontend build is ready for deployment.

## 📂 Project Structure

```
synergy/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/
│       ├── contexts/
│       └── utils/
│
├── server/                 # Node.js backend
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API routes
│   ├── middleware/         # Auth middleware
│   ├── utils/              # Email & helper utilities
│   └── server.js
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

## 🚧 Future Enhancements

- Role-based permissions (Admin / Member)
- Video conferencing integration
- Activity logs & analytics
- Real-time collaborative documents
- Mobile application support

## 📜 License

This project is licensed under the MIT License.
