import io from "socket.io-client"
import userUserStore from "../Store/useUserStore";

let socket = null;

export const initializeSocket=()=>{
    if(socket){
        return socket;
    }
    const user=userUserStore.getState().user;

    const BACKEND_URL=import.meta.env.VITE_API_URL || "http://localhost:3000";

    socket=io (BACKEND_URL,{
        withCredentials:true,
        transports:["websocket","polling"],
        reconnectionAttempts:5,
        reconnectionDelay:1000,
    });

    //connections events

    socket.on("connect",()=>{
        console.log("socket connected",socket.id);
        socket.emit("user connected",user._id);
    })

    socket.on("connect_error",(error)=>{
        console.error("socket connection error",error);
    })
    
    //disconnection error
     socket.on("disconnect",(reason)=>{
        console.log("socket disconnected",reason);
       
    })

    return socket;
};

export const getSocket = ()=>{
    if(!socket){
        return initializeSocket();
    }
    return socket;
}

export const dissconnectSocket=()=>{
    if(socket){
        socket.disconnect();
        socket=null;
    }
}
