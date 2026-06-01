const express = require("express");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const connectDB = require("./config/dbconnect");
const bodyParser = require("body-parser");
const authRoute = require("./Routes/authRoute");
const chatRoute = require("./Routes/chatRoutes");
const statusRoute = require("./Routes/statusRoute");
const http = require("http");
const initializaSocket = require("./Services/socketService");

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowed = [
        "http://localhost:5173",
        "http://localhost:5174",
        process.env.FRONTEND_URL,
    ].filter(Boolean);

    if (origin && allowed.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    next();
});

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

connectDB();

const server = http.createServer(app);
const io = initializaSocket(server);

app.use((req, res, next) => {
    req.io = io;
    req.socketUserMap = io.socketUserMap;
    next();
});

app.use("/api/auth", authRoute);
app.use("/api/chat", chatRoute);
app.use("/api/status", statusRoute);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
