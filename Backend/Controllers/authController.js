const optGenerator = require('../Utils/otpGenerator');
const twilioService = require("../Services/twilioservice");
const User = require('../Models/user');
const generateToken = require('../Utils/generteToken');
const { sendOtpToEmail } = require('../Services/emailService');
const response = require('../Utils/responseHandler');
const { uploadFileToCloudinary } = require('../config/cloudinaryConfig');
const Conversation = require('../Models/conversation');


//send otp
const otpSend = async (req, res) => {
    console.log("sending otp");
    const { phone, phoneSuffix, email } = req.body;
    const otp = optGenerator();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);
    let user;
    try {
        if (email) {
            user = await User.findOne({email:email});
            if (!user) {
                user = new User({ email });
            }
            user.emailotp = otp;
            user.emailotpExpires = expiry;
            await user.save();
            //send otp to email

            await sendOtpToEmail(email, otp);

            return response(res, 200, "OTP sent to email", { email });
        }
        if (!phone || !phoneSuffix) {
            return response(res, 400, "Phone number and suffix are required");
        }

        const fullPhoneNumber = `${phoneSuffix}${phone}`;
        user = await User.findOne({ phone });
        if (!user) {
            user = new User({ phone, phoneSuffix });
        }

        await twilioService.sendOTPtoPhoneNumber(fullPhoneNumber);
        await user.save();

        return response(res, 200, "OTP sent to phone number", { phone: fullPhoneNumber });
        
    }
    catch (err) {
        console.error(err);
        return response(res, 500, "Internal server error");
    }
}


//verify otp

const verifyOtp = async(req,res)=>{
    console.log("verifying otp");
    const {email, phone, phoneSuffix, otp}=req.body;
    try{
        let user;
        if(email){
            user=await User.findOne({email:email});
            if(!user){
                return response(res,404,"User not found");
            }

            const now=new Date();
            if(!user.emailotp || String(user.emailotp) !== String(otp) || now > new Date(user.emailotpExpires)){
                return response(res,400,"Invalid or expired OTP");
            }
            user.isVerified=true;
            user.emailotp=null;
            user.emailotpExpires=null;
            await user.save();
            // return response(res,200,"Email verified successfully");
        }
        else{
            if(!phone || !phoneSuffix){
                return response(res,400,"Phone number and suffix are required");
            }
            const fullPhoneNumber=`${phoneSuffix}${phone}`;
            user=await User.findOne({phone});
            if(!user){
                return response(res,404,"User not found");
            }
            const result=await twilioService.verifyOTP(fullPhoneNumber,otp);
            if(result.status!=="approved"){
                return response(res,400,"Invalid OTP");
            }
            user.isVerified=true;
            await user.save();
            // return response(res,200,"Phone number verified successfully");
        }
        const token = generateToken(user?._id);
        res.cookie("token",token,{
            httpOnly:true,
            maxAge:7*24*60*60*1000
        });
        return response(res,200,"OTP verified successfully",{token,user});
    }
    catch(err){
        console.error(err);
        return response(res,500,"Internal server error");
    }
}


const updateProfile = async(req,res)=>{
    console.log("updating profile");
    const {userName,username,aggreed,agreed,about}=req.body || {};
    const userId=req.userId;
    try{
        const user = await User.findById(userId);
        if(!user){
            return response(res,404,"User not found");
        }
        const file=req.file;
        if(file){
            const uploadResult = await uploadFileToCloudinary(file);
            user.profilePicture=uploadResult.secure_url; 
        }
        else if(req.body?.profilePicture){
            user.profilePicture=req.body.profilePicture;
        }

        const profileName = userName || username;
        if(profileName){
            user.userName=profileName;
        }
        const profileAgreed = aggreed ?? agreed;
        if(profileAgreed !== undefined){
            user.aggreed=profileAgreed;
        }
        if(about){
            user.about=about;
        }
        await user.save();
        console.log(user);
        return response(res,200,"Profile updated successfully",{user});

    }
    catch(err){
        console.error(err);
        return response(res,500,"Internal server error");
    }
}

const checkAuthenticated = async(req,res)=>{
    console.log("checking authentication");
    try{
        const userId = req.userId;;
        if(!userId){
            return res.status(401).json("Unauthorized");
        }
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json("User not found");
        }

        return response(res,200,"Authenticated",{user});
    }
    catch(err){
        console.error(err);
        return res.status(500).json("Internal server error");
    }
}

const logout = async(req,res)=>{
    try{
        res.cookie("token","",{expires:new Date(0)});
        return response(res,200,"Logged out successfully");
    }
    catch(err){
        console.error(err);
        return response(res,500,"Internal server error");
    }
}

const getAllUsers = async(req,res)=>{
    const loggedInUser = req.userId;
    try{
        const users = await User.find({_id:{$ne:loggedInUser}}).select("userName profilePicture isonline lastseen about phone phoneSuffix").lean();

        const userWithConversation = await Promise.all(users.map(async(user)=>{
            const conversation = await Conversation.findOne({
                participants:{$all:[loggedInUser,user._id]}
            }).populate({
                path:"lastMessage",
                select:"content createdAt sender receiver",
            }).lean();

            return {
                ...user,
                conversation:conversation || null 
            }
        }));
        return res.status(200).json({users:userWithConversation});
    }
    catch(err){
        console.error(err);
        return res.status(500).json("Internal server error");
    }
}

module.exports={otpSend,verifyOtp,updateProfile,logout,checkAuthenticated,getAllUsers};
