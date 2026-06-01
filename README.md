# 💬 WhatsApp-like Chat Application

A full-stack real-time chat application built with React, Node.js, Socket.IO, and MongoDB.

---

## 🗂️ Project Structure

```
Clone/
├── Backend/    # Node.js + Express REST API & Socket.IO server
└── Frontend/   # React + Vite client application
```

---

## ⚙️ Tech Stack

### Backend
- **Node.js** + **Express**
- **MongoDB** + **Mongoose**
- **Socket.IO** — real-time messaging
- **JWT** — authentication
- **Cloudinary** — media uploads
- **Nodemailer** — email service
- **Twilio** — SMS/OTP service
- **Multer** — file handling

### Frontend
- **React 19** + **Vite**
- **Zustand** — state management
- **Tailwind CSS** + **DaisyUI** — styling
- **Socket.IO Client** — real-time updates
- **React Router DOM** — routing
- **Axios** — HTTP requests
- **Framer Motion** — animations

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB instance
- Cloudinary account
- Twilio account (for OTP)

### Backend Setup

```bash
cd Backend
npm install
```

Create a `.env` file in `Backend/`:

```env
PORT=3000
MONGO_URI=<your_mongodb_uri>
JWT_SECRET=<your_jwt_secret>
FRONTEND_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>

EMAIL_USER=<your_email>
EMAIL_PASS=<your_email_password>

TWILIO_ACCOUNT_SID=<twilio_sid>
TWILIO_AUTH_TOKEN=<twilio_token>
TWILIO_PHONE_NUMBER=<twilio_phone>
```

```bash
npm start
```

### Frontend Setup

```bash
cd Frontend
npm install
```

Create a `.env` file in `Frontend/`:

```env
VITE_API_URL=http://localhost:3000
```

```bash
npm run dev
```

---

## ✨ Features

- 🔐 User authentication with OTP verification
- 💬 Real-time one-on-one messaging via Socket.IO
- 📷 Image & media sharing (Cloudinary)
- 👤 User status updates
- 🌙 Theme support (light/dark)
- 🔔 Online/offline presence indicators
- 😀 Emoji picker support

---

## 📡 API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/...` | Authentication routes |
| GET/POST | `/api/chat/...` | Chat & messaging routes |
| GET/POST | `/api/status/...` | Status routes |
