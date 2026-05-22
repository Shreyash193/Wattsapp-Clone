const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
    participants:[{type:mongoose.Schema.Types.ObjectId,ref:"user"}],
    lastMessage:{type:mongoose.Schema.Types.objectId,ref:"message"},
    unreadCount:{type:Number,default:0}
},{timestamps:true});

const Conversation = mongoose.model("conversation",conversationSchema);
module.exports = Conversation;
