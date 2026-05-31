import Layout from "./layout";
import {motion} from "framer-motion"
import ChatList from "../Pages/ChatSection/chatList"
import { useEffect, useState } from "react";
import { getAllUsers } from "../services/user.service";
import useLayoutStore from "../Store/layoutStore";

const HomePage=()=>{
    const setSelectedContact =useLayoutStore(state=>state.setSelectedContacts);
    const [allUsers,setAllUsers]=useState([]);
    const getUser = async()=>{
        try{
            const result = await getAllUsers();
            setAllUsers(result.users || result.data?.users || []);
        }
        catch(error){
            console.log(error);
        }

    }

    useEffect(()=>{
        getUser();
    },[]);

    console.log(allUsers);
    return(
        <>
        <Layout>
            <motion.div
            initial={{opacity:0}}
            animate={{opacity:1}}
            transition={{duration:0.5}}
            className="h-full"
            >
                <ChatList contacts={allUsers} setSelectedContact={setSelectedContact}/>

            </motion.div>
        </Layout>
        </>
    )
}

export default HomePage;
