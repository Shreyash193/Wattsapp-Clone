const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const connectDB = require("./config/dbconnect");

dotenv.config();
const PORT = process.env.PORT || 5000;
const app = express();

//connect to database
connectDB();

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});