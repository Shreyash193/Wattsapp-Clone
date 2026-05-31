import {create} from "zustand"
import { getSocket } from "../services/chat.service"
import axiosInstance from "../services/url.service";

export const useChatStore = create((set,get)=>({
    conversations:[],
    currentConversation:null,
    messages:[],
    loading:false,
    error:null,
    onlineUsers:new Map(),
    typingUsers:new Map(),


    //socket event listerners
    initSocketListners:()=>{
        const socket=getSocket();
        if(!socket)return;

        //remove existing listeners to prevent duplicate handlers

        socket.off("receive_message");
        socket.off("user_typing");
        socket.off("user_status");
        socket.off("message_send"),
        socket.off("message_error");
        socket.off("message_deleted");

        //listen for incoming message
        socket.on("message_sent",(message)=>{

        });

        //confirm messaege selivery

        socket.on("message_send",(message)=>{
            set((state)=>({
                mesage:state.messages.map((msg)=>msg._id===message._id ? {...msg}:msg)
            }))
        });

        //update message status
        socket.on("message_status_update",({messageId,messageStatus})=>{
            set((state)=>({
                messages:state.messages.map((msg)=>msg._id===messageId?{...msg,messageStatus}:msg)
            }))
        });

        //reaction update

        socket.on("reaction_update",({messageId,reactions})=>{
            set((state)=>({
                messages:state.messages.map((msg)=>msg._id===messageId?{...msg,reactions}:msg)
            }))
        });

        //handle remove message from local state

         socket.on("message_deleted",({deletedMessageId})=>{
            set((state)=>({
                messages:state.messages.filter((msg)=>msg._id===deletedMessageId)
            }))
        });

        //handle any message sending error
        socket.on("message_error",(error)=>{
            console.error("message error",error);
        });

        //listner for typing user

        socket.on("user_typing",({userId,conversationId,isTyping})=>{
            set((state)=>{
                const newTypingusers = new Map(state.typingUsers);
                if(!newTypingusers.has(conversationId)){
                    newTypingusers.set(conversationId,new set());
                }
                const typingSet=newTypingusers.get(conversationId);
                if(isTyping){
                    typing.add(userId);
                }
                else{
                    typingSet.delete(userId)
                }
                return {typingUsers:newTypingusers}
            })
        });


        //track user's online/offline status

        socket.on("user_status",({userId,isOnline,lastSeen})=>{
            set((state)=>{
                const newonlineUsers=new Map(state.onlineUsers);
                newonlineUsers.set(userId,{isOnline,lastSeen});
                return {onlineUsers:newonlineUsers}
            })
        })

        //emit status check for all users in conversation 
        const {conversations}=get();
        if(conversations?.data?.length>0){
            conversations.data?.forEach((conv)=>{
                const otherUser=conv.participants.find(
                    (p)=>p._id!==get().currentUser._id
                );

                if(otherUser?._id){
                    socket.emit("get_user_status",otherUser._id,(status)=>{
                        set((state)=>{
                            const newOnlineusers=new Map(state.onlineUsers);
                            newOnlineusers.set(State.userId,{
                                isOnline:state.isOnline,
                                lastSeen:state.lastSeen
                            });
                            return {onlineUsers:newOnlineusers}
                        })
                    })
                }
            })
        }

    },

    setCurrentUser:(user)=>set({currentUser:user}),

    fetchConversations:async()=>{
        set({loading:true,error:null});
        try{
            const {data}=await axiosInstance.get("/chats/conversations");
            set({conversations:data,loading:false}),

            get().initSocketListners();
            return data;
        }
        catch(error){
            set:({
                error:error?.response?.data?.message || error?.message,
                loading:true
            });
            return null;
        }
    },

    //fetch message for a conversations

    fetchMessages:async(conversationId)=>{
      if(!conversationId){
        return;
      }

      set({loading:true,error:null});
      try{
        const {data}=await axiosInstance.get(`/chats/conversations/${conversationId}/messages`);

        const messageArray=data.data || data || [];

        set({
            messages:messageArray,
            currentConversation:conversationId,
            loading:false
        })

        //make unread message as read

        return messageArray;
      }
      catch(error){
          set:({
                error:error?.response?.data?.message || error?.message,
                loading:true
            });
            return [];
      }
    },

    //send message in real time

    sendMessage :async (formData)=>{

    },


    //receive message

    receiveMessage:(message)=>{
        if(!message){
            return;
        }
        const {currentConversation,currentUser,messages}=get();

        const messageExits = message.some((msg)=>msg._id===message._id);

        if(message.conversation === currentConversation){
            set((state)=>({
                messages:[...state.messages,message]
            }));
        }


        //update conversation preview and unread count
        set((state)=>{
            const updateConversations=state.conversation?.data?.map((conv)=>{
                if(conv._id === message.conversation){
                    return{
                        ...conv,
                        lastMessage: message,
                        unreadCount:message?.receiver?._id===currentUser?._id ? (conv.unreadCount || 0) + 1 : conv.unreadCount || 0
                    }
                }
                return conv;
            });

            return {
                conversation:{
                    ...state.conversations,
                    data:updateConversations,
                },
            }

        })
    },


    //mark as read

    markMessagesAsRead:async()=>{
        const {messages,currentUser}=get();

        if(!messages.length || !currentUser){
            return;
        }
        const unreadIds = messages.filter((msg)=>msg.messageStatus != "read" && msg.receiver?._id === currentUser?._id).map((msg)=>msg._id).filter(Boolean);

        if(unreadIds.lenght ===0) {
            return;
        }

        try{
            const {data}=await axiosInstance.put("/chats/messages.read",{
                messageIds:unreadIds
            });
            console.log("message marked as read",data);
            set((state)=>({
                messages:state.messages.map((msg)=>unreadIds.includes(msg._id)?{...msg,messageStatus:"read"}:msg)
            }));

            const socket=getSocket();
            if(socket){
                socket.emit("message_read",{
                    messageIds:unreadIds,
                    senderId:message[0]?.sender?._id
                })
            }
        }
        catch(error){
            console.error("failed to mark message as read",error);
        }

    },

    //delete message 

}))

