# HeyBuddy!

A real-time chat application built with Node.js, Express, React, Socket.IO, and WebRTC.

## Features

- Local authentication using email and password
- Account management — update profile details and avatar
- Real-time messaging with Socket.IO
- WebRTC-powered document sharing between users
- PostgreSQL database with Sequelize ORM
- Image storage via Cloudinary
- Session management with Redis
- Redux Toolkit for state management

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React, Redux Toolkit, Socket.IO     |
| Backend  | Node.js, Express, Sequelize         |
| Database | PostgreSQL, Redis                   |
| Realtime | Socket.IO, WebRTC                   |
| Storage  | Cloudinary                          |
| DevOps   | Docker, Docker Compose              |

## Getting Started

### Prerequisites

- Node.js & NPM
- PostgreSQL
- Redis
- Cloudinary account

### Installation

```bash
# Clone the repository
git clone https://github.com/kajalnsut2500-m/HeyBuddy-.git
cd HeyBuddy-
```

```bash
# Install dependencies for each service
cd client && npm install
cd ../socket && npm install
cd ../server && npm install
```

Set up environment variables — copy `.env.example` to `.env` in the `server/` directory and fill in your values.

```bash
# Start each service
npm run start   # run inside client/, server/, and socket/
# or
npm run dev
```

### Docker (recommended)

```bash
docker-compose up
```

Make sure all `.env` files are configured before running Docker.

## Project Structure

```
HeyBuddy-/
├── client/      # React frontend
├── server/      # Express REST API
├── socket/      # Socket.IO server
└── docker-compose.yml
```
