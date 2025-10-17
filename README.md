# Synergy - Project Collaboration Platform

Synergy is a comprehensive project collaboration platform that enables teams to work together effectively by providing tools for project management, resource sharing, and team communication.

## Features

### Project Management

- Create and manage projects with detailed descriptions
- Track project status and progress
- Set project timelines and milestones
- Manage team members and roles

### Team Collaboration

- **Team Chat**: Real-time communication within project teams
- **Resource Sharing**: Upload and share PDF resources with team members
- **Task Management**: Assign and track tasks with priorities and deadlines
- **Meeting Scheduler**: Schedule and manage team meetings

### Project Overview

- Visual progress tracking
- Team member statistics
- Resource management
- Deadline tracking

### User Management

- Secure authentication system
- Email verification
- User profiles with skills and experience
- Role-based access control

## Technology Stack

### Frontend

- React.js
- CSS for styling
- Axios for API communication
- Real-time updates

### Backend

- Node.js
- Express.js
- MongoDB for database
- JWT for authentication
- Multer for file uploads

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn package manager

### Installation

1. Clone the repository

```bash
git clone https://github.com/navya2036/synergy.git
cd synergy
```

2. Install dependencies for the server

```bash
cd server
npm install
```

3. Install dependencies for the client

```bash
cd ../client
npm install
```

4. Set up environment variables
   Create a `.env` file in the server directory with the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email_for_notifications
EMAIL_PASS=your_email_password
```

5. Quick Start (Run both client and server)

```bash
# Install all dependencies (both client and server)
npm run install-all

# Start both client and server with a single command
npm run dev
```

The application will be available at `http://localhost:3000`
The server will run on `http://localhost:5000`

Alternatively, you can start the servers separately:

For the backend:

```bash
cd server
npm start
```

For the frontend:

```bash
cd client
npm start
```

## Project Structure

```
project/
├── client/                 # Frontend React application
│   ├── public/
│   └── src/
│       ├── components/     # React components
│       ├── contexts/       # React contexts
│       └── utils/         # Utility functions
│
├── server/                 # Backend Node.js application
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   └── server.js          # Main server file
│
└── README.md              # Project documentation
```

## Features in Detail

### Project Management

- Create new projects with detailed descriptions
- Set project categories and required skills
- Define team size and roles
- Track project progress and status

### Team Collaboration

- Real-time team chat
- PDF resource sharing and management
- Task creation and assignment
- Meeting scheduling with notifications

### User Management

- Secure user registration with email verification
- Profile management with skills and experience
- Project join requests and approvals
- Role-based access control for project resources

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Security

- JWT-based authentication
- Secure password hashing
- Email verification for new accounts
- Protected API endpoints
- Secure file upload handling

## Future Enhancements

- Real-time collaborative document editing
- Video conferencing integration
- Project timeline visualization
- Advanced analytics and reporting
- Mobile application support

## License

This project is licensed under the MIT License - see the LICENSE file for details.
