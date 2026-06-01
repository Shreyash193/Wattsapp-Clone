import { useState, useRef } from "react";
import { FaCamera, FaCheck, FaTimes, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import userThemeStore from "../Store/themeStore";
import userUserStore from "../Store/useUserStore";
import { updateUserProfile } from "../services/user.service";
import SideBar from "./sideBar";

const ABOUT_OPTIONS = [
  "Hey there! I am using WhatsApp.",
  "Available",
  "Busy",
  "At school",
  "At the gym",
  "Sleeping",
  "Can't talk, WhatsApp only",
];

const EditableField = ({ label, value, onSave, theme, multiline }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const isDark = theme === "dark";
  const inputClass = `flex-1 bg-transparent border-b-2 border-emerald-500 outline-none text-sm py-1 ${isDark ? "text-white" : "text-gray-800"}`;

  const save = () => { if (draft.trim()) { onSave(draft.trim()); setEditing(false); } };
  const cancel = () => { setDraft(value); setEditing(false); };

  return (
    <div className="py-3">
      <p className={`text-xs font-medium mb-1 text-emerald-500`}>{label}</p>
      {editing ? (
        <div className="flex items-center gap-2">
          {multiline ? (
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} className={`${inputClass} resize-none`} autoFocus />
          ) : (
            <input value={draft} onChange={(e) => setDraft(e.target.value)} className={inputClass} autoFocus onKeyDown={(e) => e.key === "Enter" && save()} />
          )}
          <button onClick={save} className="text-emerald-500 hover:text-emerald-400"><FaCheck size={14} /></button>
          <button onClick={cancel} className={`${isDark ? "text-gray-400 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}><FaTimes size={14} /></button>
        </div>
      ) : (
        <button onClick={() => { setDraft(value); setEditing(true); }} className={`text-sm w-full text-left ${isDark ? "text-white hover:text-gray-200" : "text-gray-800 hover:text-gray-600"} transition-colors`}>
          {value || <span className={`${isDark ? "text-gray-500" : "text-gray-400"}`}>Tap to add</span>}
        </button>
      )}
    </div>
  );
};

const UserDetails = () => {
  const { theme } = userThemeStore();
  const { user, setUser } = userUserStore();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [showAboutOptions, setShowAboutOptions] = useState(false);

  const isDark = theme === "dark";
  const base = isDark ? "bg-[#111b21] text-white" : "bg-gray-100 text-black";
  const card = isDark ? "bg-[#202c33]" : "bg-white";
  const sub = isDark ? "text-gray-400" : "text-gray-500";
  const border = isDark ? "border-gray-700" : "border-gray-200";

  const handleSaveField = async (field, value) => {
    setSaving(true);
    try {
      const updated = await updateUserProfile({ [field]: value });
      setUser({ ...user, ...updated?.data });
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);
      const updated = await updateUserProfile(formData);
      setUser({ ...user, ...updated?.data });
      toast.success("Profile picture updated");
    } catch {
      toast.error("Failed to update picture");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`flex min-h-screen ${base}`}>
      <SideBar />
      <div className="flex-1 max-w-xl mx-auto px-4 py-6 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className={`p-2 rounded-full ${isDark ? "hover:bg-white/10" : "hover:bg-gray-200"} transition-colors`}>
            <FaArrowLeft size={16} />
          </button>
          <h1 className="text-lg font-semibold">Profile</h1>
          {saving && <span className={`ml-auto text-xs ${sub}`}>Saving...</span>}
        </div>

        {/* Avatar */}
        <div className={`${card} rounded-2xl p-6 flex flex-col items-center gap-3 shadow-sm`}>
          <div className="relative">
            <img
              src={user?.profilePicture || `https://i.pravatar.cc/150?u=${user?._id}`}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-emerald-500/40"
              alt="profile"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-full shadow-lg transition-colors"
            >
              <FaCamera size={14} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <p className={`text-xs ${sub}`}>Tap camera to change photo</p>
        </div>

        {/* Editable fields */}
        <div className={`${card} rounded-2xl px-4 shadow-sm divide-y ${border}`}>
          <EditableField
            label="Your Name"
            value={user?.userName || ""}
            onSave={(v) => handleSaveField("userName", v)}
            theme={theme}
          />
          <EditableField
            label="About"
            value={user?.about || "Hey there! I am using WhatsApp."}
            onSave={(v) => handleSaveField("about", v)}
            theme={theme}
            multiline
          />
        </div>

        {/* About quick picks */}
        <div className={`${card} rounded-2xl shadow-sm overflow-hidden`}>
          <p className={`text-xs font-semibold uppercase tracking-wider px-4 pt-4 pb-2 ${sub}`}>Quick About Options</p>
          {ABOUT_OPTIONS.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleSaveField("about", opt)}
              className={`flex items-center w-full px-4 py-3 text-sm text-left transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50"} ${i < ABOUT_OPTIONS.length - 1 ? `border-b ${border}` : ""}`}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Account info (read-only) */}
        <div className={`${card} rounded-2xl px-4 shadow-sm`}>
          <p className={`text-xs font-semibold uppercase tracking-wider pt-4 pb-2 ${sub}`}>Account Info</p>
          <div className={`border-b ${border} py-3`}>
            <p className="text-xs text-emerald-500 font-medium mb-1">Phone</p>
            <p className="text-sm">{user?.phone || "Not set"}</p>
          </div>
          <div className="py-3">
            <p className="text-xs text-emerald-500 font-medium mb-1">Email</p>
            <p className="text-sm">{user?.email || "Not set"}</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserDetails;
