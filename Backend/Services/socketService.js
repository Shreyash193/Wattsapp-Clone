const { Server } = require("socket.io");
const User = require("../Models/user");
const Message = require("../Models/message");


//map to store online users

const onlineUsers = new Map();

//map to track typing users

const typingUsers = new Map();

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL,
            credentials: true,
            method: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        },
        pingTimeout: 60000, //dissconnect inactive users or sockets after 60 sec
    });

    //when a new socket connection establised
    io.on("connection", (socket) => {
        console.log(`User connected : ${socket.id}`);
        let userId = null;

        //handel user connection and mark them online db

        socket.on("user_connected", async (connectingUserId) => {
            try {
                userId = connectingUserId;
                onlineUsers.set(userId.socket.id);
                scoket.join(userId); //join personal room for direct user

                //update user 
                await User.findByIdAndUpdate(userId, {
                    isOnline: true,
                    lastSeen: new Date(),
                });

                //notify all users that this user is online
                io.emit("user_status", { userId, isOnline: true });
            }
            catch (err) {
                consloe.error(err);
                return res.status(500).json("Internal server error");
            }
        })

        //return online status of requested user

        socket.on("get_user_status", (requestUserId, callback) => {
            const isOnline = onlineUsers.has(requestUserId)
            callback({
                userId: requestUserId,
                isOnline,
                lastSeen: isOnline ? new Date() : null,
            })
        })


        //forward message to receiver of online

        socket.on("send_message", async (message) => {
            try {
                const receiverSocketId = onlineUsers.get(message.receiver._id);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("receive_message", message);
                }
            }
            catch (error) {
                console.log("Error sending message", error);
                socket.emit("message_error", { error: "Failed to send message" });

            }
        })

        //update message as read and notify sender

        socket.on("message_read", async ({ messageIds, senderId }) => {
            try {
                await Message.updateMany(
                    { _id: { $in: messageIds } },
                    { $set: { messageStatus: "read" } }
                )

                const senderSocketId = onlineUsers.get(senderId);
                if (senderSocketId) {
                    messageIds.forEach((messageId) => {
                        io.to(senderSocketId).emit("message_status_update", {
                            messageId,
                            messageStatus: "read"
                        })
                    })
                }

            }
            catch (error) {
                console.error("Error updating message read status", error);
            }
        })


        //handle typing start event and auto stop after 3 sec
        socket.on("typing_start", ({ conversationId, receiverId }) => {
            if (!userId || !conversationId || !receiverId) {
                return;
            }
            if (!typingUsers.has(userId)) {
                typingUsers.set(userId, {});
            }

            const userTyping = typingUsers.get(userId, {});

            userTyping[conversationId] = true;

            //clear any exting timeout
            if (userTyping[`${conversationId}_timeout`]) {
                clearTimeout(userTyping[`${conversationId}_timeout`])
            }

            //auto-stop after 3 sec

            userTyping[`${conversationId}_timeout`] = setTimeout(() => {
                userTyping[conversationId] = false;
                socket.io(receiverId).emit("user_typing", {
                    userId,
                    conversationId,
                    isTyping: false
                })
            }, 3000);

            //Notify receiver

            socket.to(receiverId).emit("user_typing", {
                userId,
                conversationId,
                isTyping: true
            })
        })


        //handle stop

        socket.on("typing_stop", ({ conversationId, receiverId }) => {
            if (!userId || !conversationId || !receiverId) {
                return;
            }
            if (typingUsers.has(userId)) {
                const userTyping = typingUsers.get(userId);
                userTyping[conversationId] = false;

                if (userTyping[`${conversationId}_timeout`]) {
                    clearTimeout(userTyping[`${conversationId}_timeout`])
                    delete userTyping[`${conversationId}_timeout`]
                }
            };

            socket.io(receiverId).emit("user_typing", {
                userId,
                conversationId,
                isTyping: false
            })
        })

        //Add or update reactions on message

        socket.on("add_reaction", async ({ messageId, emoji, userId, reactionUserId
        }) => {
            try {
                const message = await Message.findBy
                    (messageId);
                if (!message) {
                    return;
                }
                const existingIndex = message.reaction.findIndex((r) => r.user.toString() == reactionUserId);

                if (existingIndex > -1) {
                    const existing = message.reactions(existingIndex);
                    if (existing.emoji === emoji) {
                        //remove same reaction
                        message.reaction.splice(existingIndex, 1);
                    }
                    else {
                        //add new reaction
                        message.reaction.push({ uesr: reactionUserId, emoji });
                    }

                    const populateMessage = await Message.findOne(message?._id)
                        .populate("sender", "userName profilePicture")
                        .poipulate("receiver", "userName profilePicture")
                        .populate("reactions.user", "userName")


                    const reactionUpdate = {
                        messageId,
                        reactions: populateMessage.reaction
                    }

                    const senderSocket = onlineUsers.get(populateMessage.sender._id.toString());

                    const receiverSocket = onlineUsers.get(populateMessage.receiver?._id.toString)

                    if (senderSocket) {
                        io.to(senderSocket).emit("reaction_update", reactionUpdate);
                    }

                    if (receiverSocket) {
                        io.to(receiverSocket).emit("reaction_update", reactionUpdate);
                    }
                }

            }
            catch (error) {
                console.log("Error handling reaction", error);
            }
        });

        //handle disconnection and mark user offiline

        const handleDisconnected = async () => {
            if (!userId) {
                return;
            }
            try {
                onlineUsers.delete(userId);

                //clear all typing timeouts

                if (typingUsers.has(userId)) {
                    const userTyping = typingUsers.get(userId);
                    Object.keys(userTyping).forEach((key) => {
                        if (key.endsWith("_timeout"))
                            clearTimeout(userTyping(key))
                    })

                    typingUsers.delete(userId)
                }

                await User.findByIdAndUpdate(userId, {
                    isOnline: false,
                    lastSeen: new Date(),
                })

                io.emit("user_status", {
                    userId,
                    isOnline: false,
                    lastSeen: new Date()
                })

                socket.leave(userId),
                    console.log(`user ${userId} disconnected`)
            }
            catch (error) {
                console.log("error handling disconnection", error);
            }
        }

        //disconnect event 

        socket.on("disconnect", handleDisconnected);
    });

    //attach the online user map to the socket server for external user

    io.socketUserMap = onlineUsers;

    return io;


};

module.exports = initializeSocket;
