import { useState } from "react";
import useLayoutStore from "../../Store/layoutStore";
import userThemeStore from "../../Store/themeStore";
import userUserStore from "../../Store/useUserStore";
import { FaPlus, FaSearch } from "react-icons/fa";
import { motion } from "framer-motion";
import formatTimestamp from "../../Utils/formatTime";

const ChatList = ({ contacts }) => {
  const setSelectedContact = useLayoutStore((state) => state.setSelectedContacts);
  const selectedContact = useLayoutStore((state) => state.selectedContacts);
  const { theme } = userThemeStore();
  const { user } = userUserStore();
  const [searchTerms, setSearchTerms] = useState("");

  const getContactName = (contact) =>
    contact?.userName || contact?.username || contact?.phone || contact?.email || "Unknown user";

  const getId = (value) => String(value?._id || value || "");

  const filteredContacts = (contacts || [])
    .filter((contact) => String(contact?._id) !== String(user?._id))
    .filter((contact) =>
      getContactName(contact).toLowerCase().includes(searchTerms.toLowerCase())
    );
 
  console.log(filteredContacts)
  return (
    <div className={`w-full border-r h-screen ${theme === "dark" ? "bg-[#111b21] border-slate-700" : "bg-white border-slate-200"}`}>
      
      {/* Header */}
      <div className={`p-4 flex justify-between items-center ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
        <h2 className="text-xl font-semibold">Chats</h2>
        <button className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors">
          <FaPlus size={14} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-2">
        <div className="relative flex items-center">
          <FaSearch
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
          />
          <input
            type="text"
            placeholder="Search or start new chat"
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 ${
              theme === "dark"
                ? "bg-[#202c33] text-white border-transparent placeholder-gray-500"
                : "bg-gray-100 text-black border-transparent placeholder-gray-400"
            }`}
            value={searchTerms}
            onChange={(e) => setSearchTerms(e.target.value)}
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="overflow-y-auto h-[calc(100vh-120px)]">
        {filteredContacts?.map((contact) => {
          const isSelected = selectedContact?._id === contact?._id;
          
          // CRITICAL FIX: Added explicit 'return' statement here
          return (
            <motion.div
              key={contact._id}
              onClick={() => setSelectedContact(contact)}
              className={`p-3 flex items-center cursor-pointer transition-colors ${
                theme === "dark"
                  ? isSelected ? "bg-slate-700" : "hover:bg-[#202c33]"
                  : isSelected ? "bg-gray-200" : "hover:bg-gray-50"
              }`}
            >
              <img
                src={contact?.profilePicture || "https://via.placeholder.com/150"} 
                alt={getContactName(contact)}
                className="w-12 h-12 rounded-full object-cover"
              />
              
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  {/* CRITICAL FIX: Text is now properly placed inside the heading element */}
                  <h3 className={`font-medium truncate ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>
                    {getContactName(contact)}
                  </h3>
                  {contact?.conversation?.lastMessage?.createdAt && (
                    <span className={`text-sm ${theme ==="dark"? "text-gray-400":"text-gray-500"}`}>
                        {formatTimestamp(contact.conversation.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-baseline">
                    <p className={`text-sm ${theme==="dark"?"text-gray-400":"text-gray-500"}truncate`}>
           {contact?.conversation?.lastMessage?.content}
                    </p>
                    
                        {contact?.conversation?.unreadCount > 0 &&
                          getId(contact?.conversation?.lastMessage?.receiver) === getId(user?._id) && (
                            <p className={`text-sm font-semibold w-6 h-6 flex items-center justify-center bg-yellow-500 ${theme==="dark"? "text-gray-800":"text-gray-500"} rounded-full`}>
                                {contact.conversation.unreadCount}
                            </p>
                        )}
                    
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredContacts?.length === 0 && (
          <p className="text-center text-sm mt-8 text-gray-500">No chats found</p>
        )}
      </div>
     
    </div>
  );
};

export default ChatList;
