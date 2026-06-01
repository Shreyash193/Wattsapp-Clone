import { Fragment, useEffect, useRef, useState } from "react";
import userUserStore from "../../Store/useUserStore";
import userThemeStore from "../../Store/themeStore";
import { useChatStore } from "../../Store/chatStore";
import { isToday, isYesterday, format } from "date-fns";
import whattsaapImage from "../../Image/whatsapp_image.png";
import {
  FaLock,
  FaArrowLeft,
  FaVideo,
  FaEllipsisV,
  FaTimes,
  FaSmile,
  FaPaperclip,
  FaImage,
  FaFile,
  FaPaperPlane,
} from "react-icons/fa";
import MessageBubble from "./MessageBubble";
import EmojiPicker from "emoji-picker-react";

const isValidate = (date) => {
  return date instanceof Date && !isNaN(date);
};

const ChatWindow = ({ selectedContact, setSelectedContact }) => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const typingTimeoutRef = useRef(null);
  const messageEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);

  const { theme } = userThemeStore();
  const { user } = userUserStore();

  const {
    messages,
    currentConversation,
    loading,
    sendMessage,
    receiveMessage,
    fetchMessages,
    fetchConversations,
    conversations,
    isUserTyping,
    startTyping,
    stopTyping,
    getUserLastSeen,
    isUserOnline,
    addReaction,
    deleteMessage,
    cleanUp,
  } = useChatStore();

  //get online status and lastseen

  const online = isUserOnline(selectedContact?._id);
  const lastSeen = getUserLastSeen(selectedContact?._id);
  const isTyping = isUserTyping(selectedContact?._id);

  const renderEmptyChatImage = () => (
    <div className="flex-1 flex flex-col items-center justify-center mx-auto h-screen text-center">
      <div className="max-w-md">
        <img
          src={whattsaapImage}
          alt="WhatsApp chat illustration"
          className="w-full h-auto object-contain"
        />
        <h2
          className={`text-3xl font-semibold md-4 ${theme === "dark" ? "text-white" : "text-black"}`}
        >
          select a conversation to start chatting
        </h2>
        <p
          className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-6`}
        >
          choose a contact from the list on the left to begin messaging
        </p>

        <p
          className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} text-sm mt-8 flex items-center justify-center gap-2`}
        >
          <FaLock className="h-4 w-4"></FaLock>
          Your personal messages are encrypted end-to-end
        </p>
      </div>
    </div>
  );

  useEffect(() => {
    if (selectedContact?._id && conversations?.data?.length > 0) {
      const conversation = conversations?.data?.find((conv) =>
        conv.participants.some(
          (participant) =>
            String(participant?._id || participant) ===
            String(selectedContact?._id),
        ),
      );
      if (conversation?._id) {
        fetchMessages(conversation._id);
      }
    }
  }, [selectedContact, conversations]);

  useEffect(() => {
    fetchConversations();
  }, []);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behaviour: "auto" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (message && selectedContact) {
      startTyping(selectedContact?._id);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(selectedContact?._id);
      }, 2000);
    }
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, selectedContact, startTyping, stopTyping]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setShowFileMenu(false);
      if (file.type.startsWith("image/")) {
        setFilePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSendMessage = async () => {
    if (!selectedContact) {
      return;
    }
    try {
      const formData = new FormData();
      formData.append("senderId", user._id);
      formData.append("receiverId", selectedContact?._id);

      const status = online ? "delivered" : "sent";
      formData.append("messageStatus", status);
      if (message.trim()) {
        formData.append("content", message.trim());
      }

      //if there is file include thet too

      if (selectedFile) {
        formData.append("media", selectedFile, selectedFile.name);
      }

      if (!message.trim() && !selectedFile) {
        return;
      }
      await sendMessage(formData);

      //clear state

      setMessage("");
      setFilePreview(null);
      setSelectedFile(null);
      setShowFileMenu(false);
    } catch (error) {
      console.error("failed to send message", error);
    }
  };

  if (!selectedContact) {
    return renderEmptyChatImage();
  }

  const groupedMessages = Array.isArray(messages)
    ? messages.reduce((acc, msg) => {
        const createdAt = msg.createdAt || msg.createAt;
        if (!createdAt) {
          return acc;
        }

        const messageDate = new Date(createdAt);
        if (!isValidate(messageDate)) {
          console.error("invalid date for message", msg);
          return acc;
        }

        const dateString = format(messageDate, "yyyy-MM-dd");
        if (!acc[dateString]) {
          acc[dateString] = [];
        }
        acc[dateString].push(msg);
        return acc;
      }, {})
    : {};

  const handleReaction = (messageId, emoji) => {
    addReaction(messageId, emoji);
  };

  const renderDateSeparator = (date) => {
    if (!isValidate(date)) {
      return null;
    }

    let dateString;
    if (isToday(date)) {
      dateString = "Today";
    } else if (isYesterday(date)) {
      dateString = "Yesterday";
    } else {
      dateString = format(date, "EEEE,MMMM d");
    }

    return (
      <div className="flex justify-center my-4">
        <span
          className={`px-4 py-2 rounded-full text-sm ${theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"}`}
        >
          {dateString}
        </span>
      </div>
    );
  };

  return (
    <div className="flex-1 h-screen w-full flex flex-col">
      <div
        className={`p-4 ${theme === "dark" ? "bg-[#303430] text-white" : "bg-[rgb(239,242,245)] text-gray-600"} flex items-center flex-shrink-0`}
      >
        <button
          className="mr-2 focus:outline-none"
          onClick={() => setSelectedContact(null)}
        >
          <FaArrowLeft className="h-6 w-6"></FaArrowLeft>
        </button>
        <img
          src={selectedContact?.profilePicture}
          alt={selectedContact?.userName}
          className="w-10 h-10 rounded-full"
        />
        <div className="ml-3 flex-grow">
          <h2 className="font-semibold text-start">
            {selectedContact?.userName}
          </h2>
          {isTyping ? (
            <div>Typing...</div>
          ) : (
            <p
              className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
            >
              {online
                ? "Online"
                : lastSeen
                  ? `Last Seen ${format(new Date(lastSeen), "HH:MM")}`
                  : "offline"}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <button className="focus:outline-none">
            <FaVideo className="h-5 w-5"></FaVideo>
          </button>
          <button className="focus:outline-none">
            <FaEllipsisV className="h-5 w-5"></FaEllipsisV>
          </button>
        </div>
      </div>

      <div
        className={`flex-1 p-4 overflow-y-auto ${theme === "dark" ? "bg-[#191a1a]" : "bg-[rgb(241,236,229)]"}`}
      >
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <Fragment key={date}>
            {renderDateSeparator(new Date(date))}
            {msgs
              .filter(
                (msg) =>
                  String(msg.conversation?._id || msg.conversation) ===
                  String(currentConversation),
              )
              .map((msg) => (
                <MessageBubble
                  key={msg._id || msg.tempId}
                  message={msg}
                  theme={theme}
                  currentUser={user}
                  onReact={handleReaction}
                  deleteMessage={deleteMessage}
                />
              ))}
          </Fragment>
        ))}
        <div ref={messageEndRef} />
      </div>

      {filePreview && (
        <div className="relative p-2">
          <img
            src={filePreview}
            alt="file-preview"
            className="w-80 object-cover rounded shadow-lg mx-auto"
          />
          <button
            onClick={() => {
              setSelectedFile(null);
              setFilePreview(null);
            }}
            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
          >
            <FaTimes className="h-4 w-4"></FaTimes>
          </button>
        </div>
      )}
      <div
        className={`p-4 ${theme === "dark" ? "bg-[#303430]" : "bg-white"} flex items-center space-x-2 relative`}
      >
        <button
          className="focus:outline-none"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <FaSmile
            className={`h-6 w-6 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
          ></FaSmile>
        </button>

        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute left-0 bottom-16 z-50">
            <EmojiPicker
              onEmojiClick={(emojiObject) => {
                setMessage((prev) => prev + emojiObject.emoji);
                setShowEmojiPicker(false);
              }}
              theme={theme}
            />
          </div>
        )}
        <div className="relative">
          <button
            className="focus:outline-none"
            onClick={() => setShowFileMenu(!showFileMenu)}
          >
            <FaPaperclip
              className={`h-6 w-6 ${theme === "dark" ? "text-gray-400" : "text-gray-500"} mt-2`}
            ></FaPaperclip>
          </button>

          {showFileMenu && (
            <div
              className={`absolute bottom-full left-0 md-2 ${theme === "dark" ? "bg-gray-700" : "bg-white"}rounded-lg shadow-lg`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current.click()}
                className={`flex items-center px-4 py-2 w-full transition-colors ${theme === "dark" ? "hover:bg-gray-500" : "hover:bg-gray-100"}`}
              >
                <FaImage className="mr-2"></FaImage>Image/Video
              </button>
              <button
                onClick={() => fileInputRef.current.click()}
                className={`flex items-center px-4 py-2 w-full transition-colors ${theme === "dark" ? "hover:bg-gray-500" : "hover:bg-gray-100"}`}
              >
                <FaFile className="mr-2"></FaFile>Document
              </button>
            </div>
          )}
        </div>
        <input
        type="text"
        value={message}
        onChange={(e)=>setMessage(e.target.value)}
        placeholder="Type a message"
        className={`flex-grow px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 ${theme==="dark" ? "bg-gry-700 text-white border-gray-600":"bg-white text-black border-gray-300"}`}
        />
        <button  onClick={handleSendMessage} className="focus:outline-none">
            <FaPaperPlane className="h-6 w-6 text-green-500"></FaPaperPlane>
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
