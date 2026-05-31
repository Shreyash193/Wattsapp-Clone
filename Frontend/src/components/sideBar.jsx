import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import userThemeStore from "../Store/themeStore";
import userUserStore from "../Store/useUserStore";
import useLayoutStore from "../Store/layoutStore";
import { FaWhatsapp, FaUserCircle, FaCog } from "react-icons/fa";
import { IoMdRadioButtonOn } from "react-icons/io";

const SideBar = () => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { theme } = userThemeStore();
  const { user } = userUserStore();
  const activeTab = useLayoutStore((state) => state.activeTab);
  const setActiveTab = useLayoutStore((state) => state.setActiveTab);
  const selectedContact = useLayoutStore((state) => state.selectedContacts);

  // Dynamic window resize listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Syncing paths with active tabs
  useEffect(() => {
    const pathMap = {
      "/": "chats",
      "/status": "status",
      "/user-profile": "profile",
      "/setting": "setting",
    };
    const currentTab = pathMap[location.pathname];
    if (currentTab) setActiveTab(currentTab);
  }, [location.pathname, setActiveTab]);

  // Hide mobile navigation if looking at a chat thread
  if (isMobile && selectedContact) {
    return null;
  }

  // A helper function to manage the background and icon colors neatly
  const getNavStyles = (tabName) => {
    const isActive = activeTab === tabName;
    
    // 1. Container Styles (The background bubble)
    const containerClass = isActive
      ? theme === "dark"
        ? "bg-slate-700 shadow-inner text-emerald-400 scale-105"
        : "bg-slate-200/80 shadow-sm text-emerald-600 scale-105"
      : theme === "dark"
        ? "text-slate-400 hover:text-slate-200 hover:bg-slate-700/40"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/40";

    return `p-3 rounded-xl transition-all duration-200 flex items-center justify-center focus:outline-none ${containerClass}`;
  };

  const sideBarContent = (
    <>
      <div className={`flex ${isMobile ? "flex-row justify-around w-full" : "flex-col gap-4 w-full px-2"}`}>
        <Link to="/" className={getNavStyles("chats")} title="Chats">
          <FaWhatsapp className="h-6 w-6" />
        </Link>

        <Link to="/status" className={getNavStyles("status")} title="Status">
          <IoMdRadioButtonOn className="h-6 w-6" />
        </Link>
      </div>

      {!isMobile && <div className="flex-grow"></div>}

      <div className={`flex ${isMobile ? "hidden" : "flex-col gap-4 w-full px-2"}`}>
        <Link to="/user-profile" className={getNavStyles("profile")} title="Profile">
          {user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt="user profile"
              className={`h-6 w-6 rounded-full object-cover ring-2 ${
                activeTab === "profile" ? "ring-emerald-500" : "ring-transparent"
              }`}
            />
          ) : (
            <FaUserCircle className="h-6 w-6" />
          )}
        </Link>

        <Link to="/setting" className={getNavStyles("setting")} title="Settings">
          <FaCog className="h-6 w-6" />
        </Link>
      </div>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: isMobile ? 20 : 0, x: isMobile ? 0 : -20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`
        z-40 backdrop-blur-md transition-colors duration-300
        ${isMobile 
          ? "fixed bottom-0 left-0 right-0 h-16 flex-row justify-around border-t" 
          : "w-18 h-screen flex-col justify-between py-6 border-r flex-shrink-0"
        }
        ${theme === "dark" 
          ? "bg-slate-900/95 border-slate-800" 
          : "bg-slate-50/95 border-slate-200 shadow-sm"
        }
        flex items-center
      `}
    >
      {sideBarContent}
    </motion.div>
  );
};

export default SideBar;