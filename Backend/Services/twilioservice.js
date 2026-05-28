const twilio = require('twilio');

dotenv = require('dotenv');
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;

const client = twilio(accountSid, authToken);


const sendOTPtoPhoneNumber = async (phone) =>{
    try{
        console.log("Sending OTP to phone number:", phone);
        console.log("MY VERIFY SERVICE SID IS:", serviceSid);
        if(!phone){
            throw new Error("Phone number is required");
        }
        const response = await client.verify.v2.services(serviceSid).verifications.create({
            to:phone,
            channel:"sms"
        })
        console.log("Twilio response:", response);
        return response;
    }
    catch(err){
        console.error("Error sending OTP:", err);
        throw err;
    }
}

const verifyOTP = async (phone,otp) =>{
    try{
        console.log("Verifying OTP for phone number:", phone);
        console.log("OTP to verify:", otp);
        const response = await client.verify.v2.services(serviceSid).verificationChecks.create({
            to:phone,
            code:otp,
        })
        console.log("Twilio response:", response);
        return response;
    }
    catch(err){
        console.error("Error sending OTP:", err);
        throw new Error("Failed to verify OTP");
    }
}

module.exports = {
    sendOTPtoPhoneNumber,
    verifyOTP
}