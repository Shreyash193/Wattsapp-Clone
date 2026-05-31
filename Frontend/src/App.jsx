import { useEffect, useState } from 'react'
import { BrowserRouter as Router ,Routes , Route } from 'react-router-dom'
import './App.css'
import Login from "../src/Pages/User-Login/userLogin";
 import { ToastContainer, toast } from 'react-toastify';
 import "react-toastify/dist/ReactToastify.css";
import { publicRoute as PublicRoute, protectedRoute as ProtectedRoute } from './protected';
import HomePage from './components/homePage';
import Setting from "./Pages/SettingSection/setting"
import UserDetails from "./components/userDetails"
import Status from "./Pages/StatusSection/status"
import userUserStore from './Store/useUserStore';
import { dissconnectSocket, initializeSocket } from './services/chat.service';

function App() {

  const {user}=userUserStore();

  useEffect(()=>{
    if(user?._id){
      const socket=initializeSocket();
    }

    return ()=>{
      dissconnectSocket();
    }
  },[user])

  return (
    <>
    <ToastContainer position='top-right' autoClose={3000} />
      <Router>
        <Routes>
          <Route element={<PublicRoute />}>
          <Route path='/user-login' element={<Login/>}></Route>
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path='/' element={<HomePage/>}/>
            <Route path='/user-profile' element={<UserDetails/>}/>
            <Route path='/status' element={<Status/>}/>
            <Route path='/setting' element={<Setting/>}/>
          </Route>
        </Routes>
      </Router>
    </>
  )
}

export default App
