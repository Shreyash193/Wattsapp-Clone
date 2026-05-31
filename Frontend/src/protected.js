import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import userUserStore from "./Store/useUserStore";
import Loader from "./Utils/Loader";
import { checkUserAuth } from "./services/user.service";

export const protectedRoute = ()=>{
    const location = useLocation();
    const [isChecking,setIsChecking]=useState(true);

    const {isAuthenticated,setUser,clearUser}=userUserStore();

    useEffect(()=>{
        const verifyAuth=async ()=>{
            try{
                const result=await checkUserAuth();
                if(result?.isAuthenticated){
                    setUser(result.user);
                }
                else{
                    clearUser();
                }
            }
            catch(error){
                console.error(error);
                clearUser();
            }
            finally{
                setIsChecking(false);
            }
        }
        verifyAuth();
    },[setUser,clearUser])

    if(isChecking){
        return React.createElement(Loader)
    }

    if(!isAuthenticated){
        return React.createElement(Navigate, { to: "/user-login", state: { from: location }, replace: true })
    }

    //if user is authenticated

    return React.createElement(Outlet)

}

export const publicRoute = () => {
   const isAuthenticated = userUserStore(state=>state.isAuthenticated);
   if(isAuthenticated){
    return React.createElement(Navigate, { to: "/", replace: true })
   }

   return React.createElement(Outlet)
}
