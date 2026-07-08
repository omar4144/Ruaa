import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
    LayoutDashboard,
    Users,
    KanbanSquare,
    FileText,
    Settings,
    ChevronDown,
    LogOut,
    Sparkles,
    Home,
    Plus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const SidebarLink = ({ to, icon: Icon, label, testId, badge }) => (
    <NavLink
        to={to}
        end
        data-testid={testId}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                isActive
                    ? "bg-[#E3FF00] text-black font-heading font-bold"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`
        }
    >
        <Icon className="w-5 h-5" strokeWidth={2.2} />
        <span className="flex-1 text-sm">{label}</span>
        {badge != null && badge > 0 && (
            <span className="text-[10px] bg-black/20 rounded-full px-2 py-0.5 font-body">
                {badge}
            </span>
        )}
    </NavLink>
);

const WorkspaceSwitcher = () => {
    const { workspaces, current, selectWorkspace, refresh } = useWorkspace();
    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [newKind, setNewKind] = useState("agency");

    const createWorkspace = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;
        try {
            const { data } = await (
                await import("@/lib/api")
            ).default.post("/business/workspaces", { name: newName, kind: newKind });
            toast.success("تم إنشاء مساحة العمل");
            await refresh();
            selectWorkspace(data);
            setCreating(false);
            setNewName("");
            setOpen(false);
        } catch (err) {
            toast.error(err.response?.data?.detail || "خطأ");
        }
    };

    const kindLabels = { personal: "شخصي", agency: "وكالة", company: "شركة", community: "مجتمع" };
    const kindColors = {
        personal: "bg-neutral-700",
        agency: "bg-purple-600",
        company: "bg-blue-600",
        community: "bg-emerald-600",
    };

    return (
        <div className="relative" data-testid="workspace-switcher">
            <button
                onClick={() => setOpen(!open)}
                data-testid="ws-switcher-btn"
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#141414] hover:bg-[#1a1a1a] border border-white/10 transition"
            >
                <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-heading font-black text-white text-sm shrink-0 ${
                        kindColors[current?.kind] || "bg-neutral-700"
                    }`}
                >
                    {current?.name?.[0] || "?"}
                </div>
                <div className="flex-1 text-start min-w-0">
                    <div className="font-heading font-bold text-white text-sm truncate">
                        {current?.name || "بدون مساحة"}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                        {kindLabels[current?.kind] || ""} • {current?.role || ""}
                    </div>
                </div>
                <ChevronDown
                    className={`w-4 h-4 text-neutral-500 transition ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && (
                <div
                    className="absolute top-full mt-2 inset-x-0 bg-[#0F0F0F] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl"
                    data-testid="ws-dropdown"
                >
                    {workspaces.map((w) => (
                        <button
                            key={w.id}
                            onClick={() => {
                                selectWorkspace(w);
                                setOpen(false);
                            }}
                            data-testid={`ws-option-${w.id}`}
                            className={`w-full flex items-center gap-3 p-3 hover:bg-white/5 transition text-start ${
                                current?.id === w.id ? "bg-white/5" : ""
                            }`}
                        >
                            <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-heading font-black text-white text-xs shrink-0 ${
                                    kindColors[w.kind] || "bg-neutral-700"
                                }`}
                            >
                                {w.name?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-body text-white truncate">{w.name}</div>
                                <div className="text-[10px] text-neutral-500">
                                    {kindLabels[w.kind]} • {w.role}
                                </div>
                            </div>
                        </button>
                    ))}
                    {!creating ? (
                        <button
                            onClick={() => setCreating(true)}
                            data-testid="ws-create-btn"
                            className="w-full flex items-center gap-3 p-3 text-[#E3FF00] hover:bg-white/5 border-t border-white/10 transition"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm font-body">إنشاء مساحة جديدة</span>
                        </button>
                    ) : (
                        <form
                            onSubmit={createWorkspace}
                            className="p-3 border-t border-white/10 space-y-2"
                        >
                            <input
                                data-testid="ws-name-input"
                                placeholder="اسم المساحة"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                autoFocus
                                className="w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#E3FF00] focus:outline-none"
                            />
                            <select
                                data-testid="ws-kind-select"
                                value={newKind}
                                onChange={(e) => setNewKind(e.target.value)}
                                className="w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#E3FF00] focus:outline-none"
                            >
                                <option value="agency">وكالة</option>
                                <option value="company">شركة</option>
                                <option value="community">مجتمع</option>
                            </select>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    data-testid="ws-create-submit"
                                    className="flex-1 bg-[#E3FF00] text-black font-bold rounded-lg py-1.5 text-sm active:scale-95"
                                >
                                    إنشاء
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCreating(false)}
                                    className="flex-1 bg-white/10 text-white rounded-lg py-1.5 text-sm"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
};

export default function BusinessLayout() {
    const { user, logout } = useAuth();
    const { current, bapi } = useWorkspace();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate("/auth");
        }
    }, [user, navigate]);

    useEffect(() => {
        if (current) {
            bapi.get("/business/crm/stats")
                .then((r) => setStats(r.data))
                .catch(() => setStats(null));
        }
    }, [current?.id]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#050505] text-white flex" dir="rtl">
            {/* Sidebar */}
            <aside
                className="w-72 bg-[#0A0A0A] border-l border-white/5 flex flex-col p-5 gap-4 fixed inset-y-0 right-0"
                data-testid="business-sidebar"
            >
                <div className="flex items-center justify-between">
                    <div className="font-heading font-black text-xl">
                        <span className="text-[#E3FF00]">رؤى</span>
                        <span className="text-neutral-500 text-xs font-body block">
                            Business OS
                        </span>
                    </div>
                    <button
                        onClick={() => navigate("/")}
                        data-testid="back-to-feed-btn"
                        className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
                        title="العودة إلى الرئيسية"
                    >
                        <Home className="w-4 h-4 text-neutral-400" />
                    </button>
                </div>

                <WorkspaceSwitcher />

                <nav className="flex flex-col gap-1 mt-2">
                    <div className="text-[10px] text-neutral-600 font-body px-4 py-2 uppercase tracking-wider">
                        الرئيسية
                    </div>
                    <SidebarLink
                        to="/business"
                        icon={LayoutDashboard}
                        label="لوحة التحكم"
                        testId="side-dashboard"
                    />

                    <div className="text-[10px] text-neutral-600 font-body px-4 py-2 mt-4 uppercase tracking-wider">
                        CRM
                    </div>
                    <SidebarLink
                        to="/business/contacts"
                        icon={Users}
                        label="العملاء والـ Leads"
                        testId="side-contacts"
                        badge={(stats?.leads || 0) + (stats?.customers || 0)}
                    />
                    <SidebarLink
                        to="/business/pipeline"
                        icon={KanbanSquare}
                        label="مسار الصفقات"
                        testId="side-pipeline"
                        badge={stats?.open_deals}
                    />
                    <SidebarLink
                        to="/business/invoices"
                        icon={FileText}
                        label="الفواتير"
                        testId="side-invoices"
                        badge={stats?.unpaid_invoices}
                    />

                    <div className="text-[10px] text-neutral-600 font-body px-4 py-2 mt-4 uppercase tracking-wider">
                        الإعدادات
                    </div>
                    <SidebarLink
                        to="/business/settings"
                        icon={Settings}
                        label="إعدادات المساحة"
                        testId="side-settings"
                    />
                </nav>

                <div className="mt-auto pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3 p-2 rounded-xl">
                        <div className="w-9 h-9 rounded-full bg-[#E3FF00] flex items-center justify-center text-black font-heading font-black shrink-0">
                            {user.name?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-heading font-bold truncate">
                                {user.name}
                            </div>
                            <div className="text-[10px] text-neutral-500 truncate">
                                @{user.username}
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                logout();
                                navigate("/auth");
                            }}
                            data-testid="logout-btn"
                            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-neutral-500 hover:text-red-400 transition"
                            title="تسجيل خروج"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 mr-72 min-h-screen">
                {current ? (
                    <Outlet context={{ stats, refreshStats: () => bapi.get("/business/crm/stats").then((r) => setStats(r.data)) }} />
                ) : (
                    <div className="min-h-screen flex items-center justify-center p-10">
                        <div className="text-center max-w-md">
                            <Sparkles className="w-16 h-16 text-[#E3FF00] mx-auto mb-4" />
                            <h2 className="font-heading font-black text-2xl mb-2">
                                ابدأ رحلتك في Business OS
                            </h2>
                            <p className="text-neutral-400 mb-6 font-body">
                                اختر أو أنشئ مساحة عمل من القائمة للبدء بإدارة عملائك
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
