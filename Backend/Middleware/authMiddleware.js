const jwt = require("jsonwebtoken");

const authMiddleware = (req,res,next)=>{
    const token = req.cookies.token;

    if(!token){
        return res.status(401).json("authorization denied");
    }

    try{
        const decode = jwt.verify(token,process.env.JWT_SECRET);
        req.userId = decode.userId;
        console.log("Decoded user ID:", req.userId);
        next();
    }
    catch(err){
        console.error("Error verifying token:", err);
        return res.status(401).json("Invalid token"); 
    }
}

module.exports = authMiddleware;
