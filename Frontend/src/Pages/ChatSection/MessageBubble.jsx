import { format } from "date-fns";
import { useRef, useState } from "react";
import { FaCheck, FaCheckDouble, FaPlus, FaRegCopy, FaSmile, FaTrash } from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";
import useOutsideClick from "../../hooks/useOutsideClick";
import EmojiPicker from "emoji-picker-react";
import { RxCross2 } from "react-icons/rx";
import ReactDOM from "react-dom";

const MessageBubble = ({
  message,
  theme,
  onReact,
  currentUser,
  deleteMessage,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const [reactionsPos, setReactionsPos] = useState({ top: 0, left: 0 });
  const [optionsPos, setOptionsPos] = useState({ top: 0, left: 0 });

  const messageRef = useRef(null);
  const optionRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const reactionsMenuRef = useRef(null);
  const smileButtonRef = useRef(null);
  const dotsButtonRef = useRef(null);

  if (!message) return null;

  const isUserMessage = message.sender?._id === currentUser?._id;
  const bubbleClass = isUserMessage ? "chat-end" : "chat-start";

  const themeClasses = isUserMessage
    ? theme === "dark" ? "bg-[#144d38] text-white" : "bg-[#d9fdd3] text-black"
    : theme === "dark" ? "bg-[#202c33] text-white" : "bg-white text-black";

  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  const openReactions = () => {
    if (smileButtonRef.current) {
      const rect = smileButtonRef.current.getBoundingClientRect();
      const menuWidth = 280;
      let left = isUserMessage ? rect.right - menuWidth : rect.left;
      if (left < 8) left = 8;
      if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;
      setReactionsPos({ top: rect.top - 52, left });
    }
    setShowReactions((p) => !p);
  };

  const openOptions = () => {
    if (dotsButtonRef.current) {
      const rect = dotsButtonRef.current.getBoundingClientRect();
      const menuWidth = 144;
      let left = rect.right - menuWidth;
      if (left < 8) left = 8;
      setOptionsPos({ top: rect.bottom + 4, left });
    }
    setShowOptions((p) => !p);
  };

  const openEmojiPicker = () => {
    if (messageRef.current) {
      const rect = messageRef.current.getBoundingClientRect();
      const pickerWidth = 320;
      const pickerHeight = 370;
      const top = rect.top >= pickerHeight + 8 ? rect.top - pickerHeight - 8 : rect.bottom + 8;
      let left = isUserMessage ? rect.right - pickerWidth : rect.left;
      if (left < 8) left = 8;
      if (left + pickerWidth > window.innerWidth - 8) left = window.innerWidth - pickerWidth - 8;
      setPickerPos({ top, left });
    }
    setShowReactions(false);
    setShowEmojiPicker(true);
  };

  const handleReact = (emoji) => {
    onReact(message._id, emoji);
    setShowEmojiPicker(false);
    setShowReactions(false);
  };

  useOutsideClick(emojiPickerRef, () => { if (showEmojiPicker) setShowEmojiPicker(false); });
  useOutsideClick(reactionsMenuRef, () => { if (showReactions) setShowReactions(false); });
  useOutsideClick(optionRef, () => { if (showOptions) setShowOptions(false); });

  return (
    <>
    <div className={`chat ${bubbleClass} mb-6 w-full px-2`}>
      <div className="flex items-end gap-2 group max-w-[85vw] sm:max-w-[70%] md:max-w-[55%] flex-row">

        {/* Smile button */}
        <div className={`relative flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex items-center ${!isUserMessage ? "order-last" : "order-first"}`}>
          <button
            ref={smileButtonRef}
            className={`p-2 rounded-full shadow-md ${theme === "dark" ? "bg-[#202c33] hover:bg-[#2a3942]" : "bg-white hover:bg-gray-100"}`}
            onClick={openReactions}
          >
            <FaSmile className={theme === "dark" ? "text-gray-300" : "text-gray-600"} size={16} />
          </button>
        </div>

        {/* Bubble */}
        <div
          ref={messageRef}
          className={`chat-bubble w-full min-w-[150px] px-3.5 py-2 rounded-xl relative ${themeClasses} shadow-sm overflow-visible`}
        >
          {/* Dots button */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button
              ref={dotsButtonRef}
              className={`p-0.5 rounded ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
              onClick={openOptions}
            >
              <HiDotsVertical size={16} className="text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-col items-start gap-1 pr-4 pb-3 max-w-full">
            {message.contentType === "text" && (
              <p className="break-all sm:break-words text-[15px] leading-5 whitespace-pre-wrap max-w-full overflow-hidden">
                {message.content}
              </p>
            )}
            {message.contentType === "image" && (
              <div className="rounded-lg overflow-hidden max-w-full bg-black/5">
                <img src={message.imageOrVideoUrl} alt="Attachment" className="object-cover max-h-64 w-full" />
                {message.content && <p className="mt-1.5 text-[15px] px-1 break-all sm:break-words">{message.content}</p>}
              </div>
            )}
          </div>

          {/* Time + status */}
          <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[11px] opacity-60 select-none">
            <span>{format(new Date(message.createdAt), "HH:mm")}</span>
            {isUserMessage && (
              <span className="flex items-center">
                {message.messageStatus === "send" && <FaCheck size={10} />}
                {message.messageStatus === "delivered" && <FaCheckDouble size={10} />}
                {message.messageStatus === "read" && <FaCheckDouble size={10} className="text-sky-400" />}
              </span>
            )}
          </div>

          {/* Reactions display */}
          {message.reactions && message.reactions.length > 0 && (
            <div className={`absolute -bottom-2.5 ${isUserMessage ? "right-3" : "left-3"} flex items-center gap-0.5 z-20 ${
              theme === "dark" ? "bg-[#2a3942] border border-gray-800" : "bg-gray-100 border border-white"
            } rounded-full px-1.5 py-0.5 text-xs shadow-md select-none`}>
              {message.reactions.map((reaction, index) => (
                <span key={index}>{reaction.emoji}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Options menu portal */}
    {showOptions && ReactDOM.createPortal(
      <div
        ref={optionRef}
        style={{ position: "fixed", top: optionsPos.top, left: optionsPos.left, zIndex: 9999 }}
        className={`w-36 rounded-xl shadow-xl py-1 border text-sm ${theme === "dark" ? "bg-[#1f2c34] border-gray-700 text-white" : "bg-white border-gray-200 text-black"}`}
      >
        <button
          onClick={() => { if (message.contentType === "text") navigator.clipboard.writeText(message.content); setShowOptions(false); }}
          className={`flex items-center w-full px-3 py-2 gap-3 transition-colors ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
        >
          <FaRegCopy size={13} />
          <span>Copy</span>
        </button>
        {isUserMessage && (
          <button
            onClick={() => { deleteMessage(message?._id); setShowOptions(false); }}
            className={`flex items-center w-full px-3 py-2 gap-3 text-red-500 transition-colors ${theme === "dark" ? "hover:bg-red-950/30" : "hover:bg-red-50"}`}
          >
            <FaTrash size={13} />
            <span>Delete</span>
          </button>
        )}
      </div>,
      document.body
    )}

    {/* Reactions popup portal */}
    {showReactions && ReactDOM.createPortal(
      <div
        ref={reactionsMenuRef}
        style={{ position: "fixed", top: reactionsPos.top, left: reactionsPos.left, zIndex: 9999 }}
        className={`flex items-center rounded-full px-2 py-1.5 gap-1 shadow-xl border whitespace-nowrap ${
          theme === "dark" ? "bg-[#202c33] border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        {quickReactions.map((emoji, index) => (
          <button key={index} onClick={() => handleReact(emoji)} className="text-xl hover:scale-125 transition-transform p-1">
            {emoji}
          </button>
        ))}
        <div className={`w-[1px] h-5 mx-1 ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`} />
        <button className={`rounded-full p-1.5 ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"}`} onClick={openEmojiPicker}>
          <FaPlus className="h-3.5 w-3.5 text-gray-400" />
        </button>
      </div>,
      document.body
    )}

    {/* Emoji picker portal */}
    {showEmojiPicker && ReactDOM.createPortal(
      <div
        ref={emojiPickerRef}
        style={{ position: "fixed", top: pickerPos.top, left: pickerPos.left, zIndex: 9999 }}
      >
        <div className="relative">
          <EmojiPicker
            onEmojiClick={(emojiObject) => handleReact(emojiObject.emoji)}
            theme={theme === "dark" ? "dark" : "light"}
            width={320}
            height={370}
          />
          <button
            className={`absolute top-2.5 right-2.5 p-1 rounded-full z-10 shadow-sm ${theme === "dark" ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            onClick={() => setShowEmojiPicker(false)}
          >
            <RxCross2 size={14} />
          </button>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

export default MessageBubble;