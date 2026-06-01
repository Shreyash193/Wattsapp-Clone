import { useState } from "react";
import { FaPalette, FaBell, FaLock, FaUserCircle, FaChevronRight, FaMoon, FaSun, FaSignOutAlt, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import userThemeStore from "../../Store/themeStore";
import userUserStore from "../../Store/useUserStore";
import useLayoutStore from "../../Store/layoutStore";
import userLoginStore from "../../Store/useLoginStore";
import { logoutUser } from "../../services/user.service";
import { dissconnectSocket } from "../../services/chat.service";
import { useChatStore } from "../../Store/chatStore";
import SideBar from "../../components/sideBar";

const Toggle = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${value ? "bg-emerald-500" : "bg-gray-400"}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${value ? "translate-x-5" : "translate-x-0"}`} />
  </button>
);

const Row = ({ icon: Icon, label, sublabel, right, onClick, danger, theme }) => {
  const base = theme === "dark" ? "hover:bg-white/5" : "hover:bg-gray-50";
  const text = danger ? "text-red-500" : theme === "dark" ? "text-white" : "text-gray-800";
  const sub = theme === "dark" ? "text-gray-400" : "text-gray-500";
  return (
    <button onClick={onClick} className={`flex items-center gap-4 w-full px-4 py-3.5 ${base} transition-colors`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${danger ? "bg-red-500/10" : theme === "dark" ? "bg-white/10" : "bg-gray-100"}`}>
        <Icon size={15} className={danger ? "text-red-500" : "text-emerald-500"} />
      </div>
      <div className="flex-1 text-left">
        <p className={`text-sm font-medium ${text}`}>{label}</p>
        {sublabel && <p className={`text-xs ${sub}`}>{sublabel}</p>}
      </div>
      {right ?? <FaChevronRight size={12} className={sub} />}
    </button>
  );
};

const Setting = () => {
  const { theme, setTheme } = userThemeStore();
  const { user, clearUser } = userUserStore();
  const { cleanUp } = useChatStore();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState({ messages: true, sounds: true, previews: false });
  const [privacy, setPrivacy] = useState({ readReceipts: true, lastSeen: true, onlineStatus: false });

  const isDark = theme === "dark";
  const base = isDark ? "bg-[#111b21] text-white" : "bg-gray-100 text-black";
  const card = isDark ? "bg-[#202c33]" : "bg-white";
  const sub = isDark ? "text-gray-400" : "text-gray-500";
  const border = isDark ? "divide-gray-700" : "divide-gray-100";

  const handleLogout = async () => {
    try { await logoutUser(); } catch (_) {}
    // disconnect socket
    dissconnectSocket();
    // clear all zustand persisted stores
    cleanUp();
    clearUser();
    useLayoutStore.getState().setSelectedContacts(null);
    userLoginStore.getState().resetLoginState();
    // wipe all localStorage keys used by the app
    ["user-storage", "theme-storage", "layout-storage", "login-storage"].forEach((k) => localStorage.removeItem(k));
    // clear all cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
    });
    navigate("/user-login", { replace: true });
  };

  return (
    <div className={`flex min-h-screen ${base}`}>
      <SideBar />
      <div className="flex-1 max-w-xl mx-auto px-4 py-6 space-y-4">

        {/* Profile preview */}
        <div className={`${card} rounded-2xl p-4 flex items-center gap-4 shadow-sm`}>
          <img
            src={user?.profilePicture || `https://i.pravatar.cc/150?u=${user?._id}`}
            className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-500"
            alt=""
          />
          <div className="flex-1">
            <p className="font-semibold text-base">{user?.userName || "Your Name"}</p>
            <p className={`text-sm ${sub}`}>{user?.phone || user?.email || "No contact info"}</p>
          </div>
          <button onClick={() => navigate("/user-profile")} className={`text-xs px-3 py-1.5 rounded-lg ${isDark ? "bg-white/10 hover:bg-white/20" : "bg-gray-100 hover:bg-gray-200"} transition-colors`}>
            Edit
          </button>
        </div>

        {/* Appearance */}
        <div className={`${card} rounded-2xl shadow-sm overflow-hidden`}>
          <p className={`text-xs font-semibold uppercase tracking-wider px-4 pt-4 pb-1 ${sub}`}>Appearance</p>
          <div className={`divide-y ${border}`}>
            <Row
              icon={isDark ? FaMoon : FaSun}
              label="Dark Mode"
              sublabel={isDark ? "Currently dark" : "Currently light"}
              theme={theme}
              right={<Toggle value={isDark} onChange={(v) => setTheme(v ? "dark" : "light")} />}
            />
          </div>
        </div>

        {/* Notifications */}
        <div className={`${card} rounded-2xl shadow-sm overflow-hidden`}>
          <p className={`text-xs font-semibold uppercase tracking-wider px-4 pt-4 pb-1 ${sub}`}>Notifications</p>
          <div className={`divide-y ${border}`}>
            <Row icon={FaBell} label="Message Notifications" theme={theme} right={<Toggle value={notifications.messages} onChange={(v) => setNotifications((p) => ({ ...p, messages: v }))} />} />
            <Row icon={FaBell} label="Notification Sounds" theme={theme} right={<Toggle value={notifications.sounds} onChange={(v) => setNotifications((p) => ({ ...p, sounds: v }))} />} />
            <Row icon={FaBell} label="Message Previews" sublabel="Show content in notifications" theme={theme} right={<Toggle value={notifications.previews} onChange={(v) => setNotifications((p) => ({ ...p, previews: v }))} />} />
          </div>
        </div>

        {/* Privacy */}
        <div className={`${card} rounded-2xl shadow-sm overflow-hidden`}>
          <p className={`text-xs font-semibold uppercase tracking-wider px-4 pt-4 pb-1 ${sub}`}>Privacy</p>
          <div className={`divide-y ${border}`}>
            <Row icon={FaLock} label="Read Receipts" sublabel="Show when you've read messages" theme={theme} right={<Toggle value={privacy.readReceipts} onChange={(v) => setPrivacy((p) => ({ ...p, readReceipts: v }))} />} />
            <Row icon={FaLock} label="Last Seen" sublabel="Show your last seen time" theme={theme} right={<Toggle value={privacy.lastSeen} onChange={(v) => setPrivacy((p) => ({ ...p, lastSeen: v }))} />} />
            <Row icon={FaLock} label="Online Status" sublabel="Show when you're online" theme={theme} right={<Toggle value={privacy.onlineStatus} onChange={(v) => setPrivacy((p) => ({ ...p, onlineStatus: v }))} />} />
          </div>
        </div>

        {/* Account */}
        <div className={`${card} rounded-2xl shadow-sm overflow-hidden`}>
          <p className={`text-xs font-semibold uppercase tracking-wider px-4 pt-4 pb-1 ${sub}`}>Account</p>
          <div className={`divide-y ${border}`}>
            <Row icon={FaUserCircle} label="Edit Profile" sublabel="Update your name, photo, about" theme={theme} onClick={() => navigate("/user-profile")} />
            <Row icon={FaSignOutAlt} label="Logout" sublabel="Sign out of your account" theme={theme} danger onClick={handleLogout} />
            <Row icon={FaTrash} label="Delete Account" sublabel="Permanently delete your account" theme={theme} danger onClick={() => {}} />
          </div>
        </div>

        <p className={`text-center text-xs ${sub} pb-4`}>WhatsApp Clone v1.0.0</p>
      </div>
    </div>
  );
};

export default Setting;
