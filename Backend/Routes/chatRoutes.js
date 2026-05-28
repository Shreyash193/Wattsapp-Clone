const express = require("express");
const authController = require("../Controllers/authController");
const { multerMiddleware } = require("../config/cloudinaryConfig");
const authMiddleware = require("../Middleware/authMiddleware");
const chatController = require("../Controllers/chatController");

const router = express.Router();

router.post("/send-message",authMiddleware,chatController.sendMessage);
router.get("/conversations",authMiddleware,chatController.getConversations);
router.get("/conversations/:conversationId/messages",authMiddleware,chatController.getMessages);

//protected route

router.put("/messages/read",authMiddleware,chatController.markAsRead);
router.delete("/messages/:messageId",authMiddleware,chatController.deleteMessage);



module.exports=router;