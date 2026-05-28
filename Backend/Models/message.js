const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    conversation:{type:mongoose.Schema.Types.ObjectId,ref:"conversation",required:true},
    sender:{type:mongoose.Schema.Types.ObjectId,ref:"user",required:true},
    receiver:{type:mongoose.Schema.Types.ObjectId,ref:"user",required:true},
    content:{type:String},
    imgorvideo:{type:String},
    contentType:{type:String,enum:["text","media"],default:"text"},
    reactions:[
        {user:{type:mongoose.Schema.Types.ObjectId,ref:"user"},
        emoji:{type:String}}
    ],
    messageStatus:{type:String,enum:["sent","delivered","read"],default:"sent"}  
},{timestamps:true});

const Message = mongoose.model("message",messageSchema);
module.exports = Message;