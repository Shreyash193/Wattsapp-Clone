import axiosInstance from "./url.service"


export const sendOtp = async(phone,phoneSuffix,email)=>{
    try{
        const response = await axiosInstance.post('/auth/send-otp',{phone,phoneSuffix,email});
        return response.data;
    }
    catch(error){
        throw error.response ? error.response.data : error.message;
    }
}

export const verifyOtp = async(phone,phoneSuffix,otp,email)=>{
    try{
        const response = await axiosInstance.post('/auth/verify-otp',{phone,phoneSuffix,email,otp});
        return response.data;
    }
    catch(error){
        throw error.response ? error.response.data:error.message;
    }
}

export const updateUserProfile = async ( updateData)=>{
    try{
        const response = await axiosInstance.put('/auth/update-profile',updateData);
        return response.data;
    }
    catch(error){
        throw error.response ? error.response.data : error.message;
    }
}

export const checkUserAuth = async()=>{
    const response = await axiosInstance.post('/auth/check-auth');
    if(response.data.status === "success"){
        return {isAuthenticated:true,user:response?.data?.data?.user}
    }
    else if(response.data.status === "error"){
        throw error.response ? error.response.data : error.message;
    }
}

export const logoutUser = async () =>{
     try{
        const response = await axiosInstance.get('/auth/logout');
        return response.data;
     }
     catch(error){
        throw erroe.response ? error.response.data : error.message;
     }
}

export const getAllUsers = async()=>{
    try{
        const response = await axiosInstance.get('/auth/get-users');
        return response.data;
    }
    catch(error){
        throw error.response ? error.response.data : error.message;
    }
}

