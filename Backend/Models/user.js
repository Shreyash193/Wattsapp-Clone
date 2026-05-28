const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    phone:{
        type:String,
        required:false,
        unique:false
    },
    phoneSuffix:{
        type:String,
        required:false
    },
    userName:{
        type:String,
        required:false
    },
    email:{
        type:String,
        required:false,
        unique:true,
        sparse:true,
        validate: {
            validator: function(v) {
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
            }
        }
    },
    emailotp:{
        type:String,
        required:false
    },
    emailotpExpires:{
        type:Date,
    },
    profilePicture:{
        type:String,
        required:false
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

const User = mongoose.models.user || mongoose.model("user", userSchema, "users");
module.exports = User;
