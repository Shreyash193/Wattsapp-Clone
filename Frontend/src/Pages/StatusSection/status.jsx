import { useState, useRef } from "react";
import { FaPlus, FaEye, FaTimes, FaCamera } from "react-icons/fa";
import { format } from "date-fns";
import userThemeStore from "../../Store/themeStore";
import userUserStore from "../../Store/useUserStore";
import SideBar from "../../components/sideBar";

const MOCK_STATUSES = [
  {
    id: 1,
    user: { name: "Alice", avatar: "https://i.pravatar.cc/150?img=1" },
    items: [
      { id: 1, type: "image", url: "https://picsum.photos/seed/s1/400/700", time: new Date(Date.now() - 1000 * 60 * 30), views: 5 },
      { id: 2, type: "text", content: "Good morning! ☀️", bg: "bg-gradient-to-br from-yellow-400 to-orange-500", time: new Date(Date.now() - 1000 * 60 * 20), views: 3 },
    ],
  },
  {
    id: 2,
    user: { name: "Bob", avatar: "https://i.pravatar.cc/150?img=2" },
    items: [
      { id: 3, type: "image", url: "https://picsum.photos/seed/s2/400/700", time: new Date(Date.now() - 1000 * 60 * 60 * 2), views: 12 },
    ],
  },
  {
    id: 3,
    user: { name: "Carol", avatar: "https://i.pravatar.cc/150?img=3" },
    items: [
      { id: 4, type: "text", content: "Living my best life 🌊", bg: "bg-gradient-to-br from-blue-500 to-purple-600", time: new Date(Date.now() - 1000 * 60 * 60 * 5), views: 8 },
    ],
  },
];

const StatusViewer = ({ status, onClose, theme }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const item = status.items[currentIndex];

  const goNext = () => {
    if (currentIndex < status.items.length - 1) setCurrentIndex((p) => p + 1);
    else onClose();
  };
  const goPrev = () => { if (currentIndex > 0) setCurrentIndex((p) => p - 1); };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Progress bars */}
      <div className="flex gap-1 p-3 pt-4">
        {status.items.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div className={`h-full bg-white rounded-full ${i < currentIndex ? "w-full" : i === currentIndex ? "w-1/2" : "w-0"}`} />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2">
        <img src={status.user.avatar} className="w-9 h-9 rounded-full object-cover" alt="" />
        <div>
          <p className="text-white font-medium text-sm">{status.user.name}</p>
          <p className="text-white/60 text-xs">{format(item.time, "HH:mm")}</p>
        </div>
        <button onClick={onClose} className="ml-auto text-white/80 hover:text-white">
          <FaTimes size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 relative" onClick={goNext}>
        {item.type === "image" ? (
          <img src={item.url} className="w-full h-full object-cover" alt="" />
        ) : (
          <div className={`w-full h-full ${item.bg} flex items-center justify-center`}>
            <p className="text-white text-2xl font-semibold px-8 text-center">{item.content}</p>
          </div>
        )}
        {/* tap left to go back */}
        <div className="absolute inset-y-0 left-0 w-1/3" onClick={(e) => { e.stopPropagation(); goPrev(); }} />
      </div>

      {/* Views */}
      <div className="flex items-center gap-2 px-4 py-3 bg-black/60">
        <FaEye className="text-white/60" size={14} />
        <span className="text-white/60 text-xs">{item.views} views</span>
      </div>
    </div>
  );
};

const Status = () => {
  const { theme } = userThemeStore();
  const { user } = userUserStore();
  const [viewing, setViewing] = useState(null);
  const [myStatusText, setMyStatusText] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [selectedBg, setSelectedBg] = useState("bg-gradient-to-br from-emerald-400 to-teal-600");
  const fileRef = useRef(null);

  const bg = ["bg-gradient-to-br from-emerald-400 to-teal-600", "bg-gradient-to-br from-purple-500 to-pink-500", "bg-gradient-to-br from-yellow-400 to-orange-500", "bg-gradient-to-br from-blue-500 to-indigo-600"];

  const base = theme === "dark" ? "bg-[#111b21] text-white" : "bg-gray-100 text-black";
  const card = theme === "dark" ? "bg-[#202c33]" : "bg-white";
  const sub = theme === "dark" ? "text-gray-400" : "text-gray-500";
  const border = theme === "dark" ? "border-gray-700" : "border-gray-200";

  return (
    <div className={`flex min-h-screen ${base}`}>
      <SideBar />
      <div className="flex-1 max-w-xl mx-auto px-4 py-6 space-y-6">

        {/* My Status */}
        <div className={`${card} rounded-2xl p-4 shadow-sm`}>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${sub}`}>My Status</p>
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={user?.profilePicture || `https://i.pravatar.cc/150?u=${user?._id}`}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-500"
                alt=""
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 shadow"
              >
                <FaCamera size={10} className="text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{user?.userName || "My Status"}</p>
              <p className={`text-sm ${sub}`}>Tap to add a status update</p>
            </div>
            <button
              onClick={() => setShowTextInput((p) => !p)}
              className="p-2 bg-emerald-500 hover:bg-emerald-600 rounded-full text-white shadow"
            >
              <FaPlus size={14} />
            </button>
          </div>

          {showTextInput && (
            <div className="mt-4 space-y-3">
              <div className="flex gap-2">
                {bg.map((b) => (
                  <button key={b} onClick={() => setSelectedBg(b)} className={`w-7 h-7 rounded-full ${b} ${selectedBg === b ? "ring-2 ring-offset-2 ring-emerald-500" : ""}`} />
                ))}
              </div>
              <div className={`${selectedBg} rounded-xl p-4 min-h-[80px] flex items-center justify-center`}>
                <input
                  value={myStatusText}
                  onChange={(e) => setMyStatusText(e.target.value)}
                  placeholder="Type your status..."
                  className="bg-transparent text-white placeholder-white/70 text-center text-lg font-medium outline-none w-full"
                />
              </div>
              <button
                disabled={!myStatusText.trim()}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl font-medium transition-colors"
              >
                Share Status
              </button>
            </div>
          )}
        </div>

        {/* Recent Updates */}
        <div className={`${card} rounded-2xl shadow-sm overflow-hidden`}>
          <p className={`text-xs font-semibold uppercase tracking-wider px-4 pt-4 pb-2 ${sub}`}>Recent Updates</p>
          {MOCK_STATUSES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setViewing(s)}
              className={`flex items-center gap-4 w-full px-4 py-3 hover:${theme === "dark" ? "bg-white/5" : "bg-gray-50"} transition-colors ${i < MOCK_STATUSES.length - 1 ? `border-b ${border}` : ""}`}
            >
              <div className="relative flex-shrink-0">
                <img src={s.user.avatar} className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500 ring-offset-2 ring-offset-transparent" alt="" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">{s.user.name}</p>
                <p className={`text-sm ${sub}`}>{format(s.items[s.items.length - 1].time, "HH:mm")} · {s.items.length} update{s.items.length > 1 ? "s" : ""}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {viewing && <StatusViewer status={viewing} onClose={() => setViewing(null)} theme={theme} />}
    </div>
  );
};

export default Status;
