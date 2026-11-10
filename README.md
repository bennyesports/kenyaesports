# 🎮 Esports Tournament & M-Pesa Payment Platform

A full-stack esports tournament management and live payment platform built for competitive gaming, featuring automated event tracking via MongoDB Atlas and seamless mobile money checkouts using the Safaricom Daraja STK Push API.

---

## 🚀 Tech Stack

* **Backend:** Node.js, Express.js, Mongoose
* **Frontend:** React, Vite, CSS
* **Database:** MongoDB Atlas (Cloud Cluster)
* **Payment Gateway:** Safaricom Daraja API (M-Pesa Sandbox STK Push)
* **Deployment:** Render (Backend) & Vercel/Netlify (Frontend)

---

## 🛠️ Project Structure

```text
esports-platform/
├── server.js              # Main backend server and API routing
├── package.json           # Root backend dependencies & start scripts
├── .env                   # Environment variables (Secret keys - not tracked by git)
├── .gitignore             # Git ignore rules
├── server/                # Backend controllers & business logic
│   └── controllers/
│       └── mpesaController.js
└── client/                # React Vite Frontend application
    ├── src/               # React components and UI code
    ├── package.json       # Frontend dependencies
    └── vite.config.js