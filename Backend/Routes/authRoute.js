const express = require("express");
const authController = require("../Controllers/authController");
const { multerMiddleware } = require("../config/cloudinaryConfig");
const authMiddleware = require("../Middleware/authMiddleware");
const chatController = require("../Controllers/chatController");

const router = express.Router();

router.post("/send-otp",authController.otpSend);
router.post("/verify-otp",authController.verifyOtp);
router.post("/logout",authController.logout);

//protected route

router.put("/update-profile",authMiddleware,multerMiddleware,authController.updateProfile);
router.post("/check-auth",authMiddleware,authController.checkAuthenticated);
router.get("/get-users",authMiddleware,authController.getAllUsers);


module.exports=router;