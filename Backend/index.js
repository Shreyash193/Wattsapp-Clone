const express = require("express");
const cors = require("cors");
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
const PORT = process.env.PORT || 5000;
const app = express();


const corsOption = {
    origin:process.env.FRONTEND_URL,
    crediantials:true,

}

app.use(cors(corsOption));

//middlewares
app.use(express.json()); //to parse json data
app.use(cors()); 
app.use(cookieParser()); //to parse cookies
app.use(bodyParser.urlencoded({ extended: true })); //to parse urlencoded data

//connect to database
connectDB();

//create server

const server = http.createServer(app);

const io= initializaSocket(server);

//creating middleware

app.use((req,res,next)=>{
    req.io=io;
    req.socketUserMap=io.socketUserMap
    next();
})





//routes
app.use("/api/auth", authRoute);
app.use("/api/chat", chatRoute);
app.use("/api/status", statusRoute);






server.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});
