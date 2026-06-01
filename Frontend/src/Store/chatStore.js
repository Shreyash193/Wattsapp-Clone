import { create } from "zustand"
import { getSocket } from "../services/chat.service"
import axiosInstance from "../services/url.service";

export const useChatStore = create((set, get) => ({
    conversations: [],
    currentConversation: null,
    messages: [],
    loading: false,
    error: null,
    onlineUsers: new Map(),
    typingUsers: new Map(),


    //socket event listerners
    initSocketListners: () => {
        const socket = getSocket();
        if (!socket) return;

        //remove existing listeners to prevent duplicate handlers

        socket.off("receive_message");
        socket.off("user_typing");
        socket.off("user_status");
        socket.off("message_send"),
            socket.off("message_error");
        socket.off("message_deleted");

        //listen for incoming message
        socket.on("message_sent", (message) => {

        });

        //confirm messaege selivery

        socket.on("message_send", (message) => {
            set((state) => ({
                mesage: state.messages.map((msg) => msg._id === message._id ? { ...msg } : msg)
            }))
        });

        //update message status
        socket.on("message_status_update", ({ messageId, messageStatus }) => {
            set((state) => ({
                messages: state.messages.map((msg) => msg._id === messageId ? { ...msg, messageStatus } : msg)
            }))
        });

        //reaction update

        socket.on("reaction_update", ({ messageId, reactions }) => {
            set((state) => ({
                messages: state.messages.map((msg) => msg._id === messageId ? { ...msg, reactions } : msg)
            }))
        });

        //handle remove message from local state

        socket.on("message_deleted", ({ deletedMessageId }) => {
            set((state) => ({
                messages: state.messages.filter((msg) => msg._id === deletedMessageId)
            }))
        });

        //handle any message sending error
        socket.on("message_error", (error) => {
            console.error("message error", error);
        });

        //listner for typing user

        socket.on("user_typing", ({ userId, conversationId, isTyping }) => {
            set((state) => {
                const newTypingusers = new Map(state.typingUsers);
                if (!newTypingusers.has(conversationId)) {
                    newTypingusers.set(conversationId, new set());
                }
                const typingSet = newTypingusers.get(conversationId);
                if (isTyping) {
                    typing.add(userId);
                }
                else {
                    typingSet.delete(userId)
                }
                return { typingUsers: newTypingusers }
            })
        });


        //track user's online/offline status

        socket.on("user_status", ({ userId, isOnline, lastSeen }) => {
            set((state) => {
                const newonlineUsers = new Map(state.onlineUsers);
                newonlineUsers.set(userId, { isOnline, lastSeen });
                return { onlineUsers: newonlineUsers }
            })
        })

        //emit status check for all users in conversation 
        const { conversations } = get();
        if (conversations?.data?.length > 0) {
            conversations.data?.forEach((conv) => {
                const otherUser = conv.participants.find(
                    (p) => p._id !== get().currentUser._id
                );

                if (otherUser?._id) {
                    socket.emit("get_user_status", otherUser._id, (status) => {
                        set((state) => {
                            const newOnlineusers = new Map(state.onlineUsers);
                            newOnlineusers.set(State.userId, {
                                isOnline: state.isOnline,
                                lastSeen: state.lastSeen
                            });
                            return { onlineUsers: newOnlineusers }
                        })
                    })
                }
            })
        }

    },

    setCurrentUser: (user) => set({ currentUser: user }),

    fetchConversations: async () => {
        set({ loading: true, error: null });
        try {
            const { data } = await axiosInstance.get("/chat/conversations");
            const conversationArray =
                data?.data || data?.conversations || data?.["conversation get successfully"] || [];
            const conversationsPayload = { data: conversationArray };
            set({ conversations: conversationsPayload, loading: false }),

                get().initSocketListners();
            return conversationsPayload;
        }
        catch (error) {
            set: ({
                error: error?.response?.data?.message || error?.message,
                loading: true
            });
            return null;
        }
    },

    //fetch message for a conversations

    fetchMessages: async (conversationId) => {
        if (!conversationId) {
            return;
        }

        set({ loading: true, error: null });
        try {
            const { data } = await axiosInstance.get(`/chat/conversations/${conversationId}/messages`);

            const messageArray = data.data || data || [];

            set({
                messages: messageArray,
                currentConversation: conversationId,
                loading: false
            })

            //make unread message as read

            const { markMessagesAsRead } = get();
            markMessagesAsRead();

            return messageArray;
        }
        catch (error) {
            set: ({
                error: error?.response?.data?.message || error?.message,
                loading: true
            });
            return [];
        }
    },

    //send message in real time

    sendMessage: async (formData) => {
        const senderId = formData.get("senderId");
        const receiverId = formData.get("receiverId");
        const media = formData.get("media");
        const content = formData.get("content");
        const messageStatus = formData.get("messageStatus");


        const socket = getSocket();

        const { conversations } = get();
        let conversationId = null;
        if (conversations?.data?.length > 0) {
            const conversation = conversations.data.find((conv) =>
                conv.participants.some((p) => p._id === senderId) && conv.participants.some((p) => p._id === receiverId))

            if (conversation) {
                conversationId = conversation._id;
                set({ currentConversation: conversationId })

            }
        }
        //temp msg before actual response

        const tempId = `temp-${Date.now()}`
        const optimisticMessage = {
            _id: tempId,
            sender: { _id: senderId },
            receiver: { _id: receiverId },
            conversation: conversationId,
            imageOrVideoUrl: media && typeof media !== "string" ? URL.createObjectURL(media) : null,
            content: content,
            contentType: media ? media.type.startsWith("image") ? "image" : "video" : "text",
            createAt: new Date().toISOString(),
            messageStatus,
        };

        set((state) => ({
            messages: [...state.messages, optimisticMessage]
        }));

        try {
            const { data } = await axiosInstance.post("/chat/send-message", formData);
            const messageData = data?.data;

            //replace optimistic message with real one

            set((state) => ({
                messages: state.messages.map((msg) => msg._id === tempId ? messageData : msg)
            }));

            return messageData;

        }
        catch (error) {
            console.error("error sending message", error);
            set((state) => ({
                messages: state.messages.map((msg) => msg._id === tempId ? { ...msg, messageStatus: "failed" } : msg),
                error: error?.response?.data?.message || error?.message,

            }))
            throw error;
        }
    },


    //receive message

    receiveMessage: (message) => {
        if (!message) {
            return;
        }
        const { currentConversation, currentUser, messages } = get();

        const messageExits = message.some((msg) => msg._id === message._id);

        if (message.conversation === currentConversation) {
            set((state) => ({
                messages: [...state.messages, message]
            }));

            //automatically mark as read

            if (message.receiver?._id === currentUser?._id) {
                get().markMessagesAsRead();
            }
        }


        //update conversation preview and unread count
        set((state) => {
            const updateConversations = state.conversation?.data?.map((conv) => {
                if (conv._id === message.conversation) {
                    return {
                        ...conv,
                        lastMessage: message,
                        unreadCount: message?.receiver?._id === currentUser?._id ? (conv.unreadCount || 0) + 1 : conv.unreadCount || 0
                    }
                }
                return conv;
            });

            return {
                conversation: {
                    ...state.conversations,
                    data: updateConversations,
                },
            }

        })
    },


    //mark as read

    markMessagesAsRead: async () => {
        const { messages, currentUser } = get();

        if (!messages.length || !currentUser) {
            return;
        }
        const unreadIds = messages.filter((msg) => msg.messageStatus != "read" && msg.receiver?._id === currentUser?._id).map((msg) => msg._id).filter(Boolean);

        if (unreadIds.lenght === 0) {
            return;
        }

        try {
            const { data } = await axiosInstance.put("/chat/messages/read", {
                messageIds: unreadIds
            });
            console.log("message marked as read", data);
            set((state) => ({
                messages: state.messages.map((msg) => unreadIds.includes(msg._id) ? { ...msg, messageStatus: "read" } : msg)
            }));

            const socket = getSocket();
            if (socket) {
                socket.emit("message_read", {
                    messageIds: unreadIds,
                    senderId: message[0]?.sender?._id
                })
            }
        }
        catch (error) {
            console.error("failed to mark message as read", error);
        }

    },

    //delete message 

    deleteMessage: async (messageId) => {
        try {
            await axiosInstance.delete(`/chat/messages/${messageId}`);

            set((state) => ({
                messages: state.messages?.filter((msg) => msg?._id !== messageId)
            }))
            return true;
        }
        catch (error) {
            console.log("error deleting message", error)
            set({ error: error.response?.data?.message || error.message })
            return false;
        }
    },

    //add/change reactions event

    addReaction: async (messageId, emoji) => {
        const socket = getSocket();
        const { currentUser } = get();
        if (!socket || !currentUser) return;

        // optimistically update local state
        set((state) => ({
            messages: state.messages.map((msg) => {
                if (msg._id !== messageId) return msg;
                const existing = msg.reactions || [];
                const filtered = existing.filter((r) => r.userId !== currentUser._id);
                return { ...msg, reactions: [...filtered, { userId: currentUser._id, emoji }] };
            })
        }));

        socket.emit("add_reaction", { messageId, emoji, userId: currentUser._id });
    },

    //start typing

    startTyping: (receiverId) => {
        const { currentConversation } = get();
        const socket = getSocket();
        if (socket && currentConversation && receiverId) {
            socket.emit("typing_user", {
                conversationId: currentConversation,
                receiverId
            })
        }
    },

    //stop typing

    stopTyping: (receiverId) => {
        const { currentConversation } = get();
        const socket = getSocket();
        if (socket && currentConversation && receiverId) {
            socket.emit("typing_stop", {
                conversationId: currentConversation,
                receiverId
            })
        }
    },

    //is user typing
    isUserTyping: (userId) => {
        const { typingUsers, currentConversation } = get();
        if (!currentConversation || !typingUsers.has(currentConversation || !userId)) {
            return false;
        }
        return typingUsers.get(currentConversation).has(userId)
    },


    //is useronline

    isUserOnline: (userId) => {
        if (!userId) return null;
        const { onlineUsers } = get();
        return onlineUsers.get(userId)?.isOnline || false;
    },

    //lastseen

    getUserLastSeen: (userId) => {
        if (!userId) return null;
        const { onlineUsers } = get();
        return onlineUsers.get(userId)?.lastSeen || false;
    },


    //cleanup

    cleanUp: () => {
        set({
            conversations: [],
            currentConversation: null,
            messages: [],
            onlineUsers: new Map(),
            typingUsers: new Map(),
        })
    }



}))

