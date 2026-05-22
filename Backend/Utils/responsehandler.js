const response = (res,statusCode,message,data=null)=>{
    if(!res){
        console.error("Response object is required");
        return;
    }
    const responseObject = {
        status:statusCode < 400 ? "success" : "error",
        message:message,
        data:data
    }
    res.status(statusCode).json(responseObject);
}  

module.exports = response;