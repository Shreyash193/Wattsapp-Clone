const nodeMailer = require('nodemailer');

const dotenv = require('dotenv');
dotenv.config();

const transporter = nodeMailer.createTransport({
    service: 'gmail',
    auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS,
    }
});