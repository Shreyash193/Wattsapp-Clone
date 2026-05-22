const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    phone:{
        type:String,
        required:true,
        unique:true
    },
    phoneSuffix:{
        type:String,
        required:true
    },
    userName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        validate: {
            validator: function(v) {
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
            }
        }
    },
    emailotp:{
        type:String,
        required:true
    },
    emailotpExpires:{
        type:Date,
        required:true
    },
    profilePicture:{
        type:String,
    },
    about:{
        type:String,
    },
    isonline:{
        type:Boolean,
        default:false
    },
    lastseen:{
        type:Date,
        default:Date.now
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    aggreed:{
        type:Boolean,
        default:false
    }
},{timestamps:true});

const User = mongoose.model("user",userSchema);
module.exports = User;