import { useEffect, useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { Settings as SettingsIcon, UserPlus, X, Trash2, Crown, Shield } from "lucide-react";
import { toast } from "sonner";

const ROLE_LABELS = {
    owner: { label: "مالك", color: "bg-[#E3FF00] text-black", icon: Crown },
    admin: { label: "مدير", color: "bg-purple-600 text-white", icon: Shield },
    manager: { label: "مسؤول", color: "bg-blue-600 text-white", icon: null },
    member: { label: "عضو", color: "bg-neutral-700 text-white", icon: null },
    client: { label: "عميل", color: "bg-emerald-700 text-white", icon: null },
    guest: { label: "ضيف", color: "bg-neutral-800 text-neutral-400", icon: null },
};

const AddMemberModal = ({ wsId, onClose, onAdded }) => {
    const { bapi } = useWorkspace();
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("member");
    const [saving, setSaving] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!username.trim()) return;
        setSaving(true);
        try {
            const { data } = await bapi.post(`/business/workspaces/${wsId}/members`, {
                username: username.trim(),
                role,
            });
            toast.success("تمت الإضافة");
            onAdded(data);
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.detail || "خطأ");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
            onClick={onClose}
            data-testid="member-modal"
        >
            <form
                onSubmit={submit}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0F0F0F] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4"
            >
                <div className="flex items-center justify-between">
                    <h3 className="font-heading font-black text-xl">إضافة عضو</h3>
                    <button type="button" onClick={onClose}>
                        <X className="w-5 h-5 text-neutral-400" />
                    </button>
                </div>

                <div>
                    <label className="text-xs text-neutral-400 mb-1 block">اسم المستخدم</label>
                    <input
                        data-testid="member-username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="username"
                        className="w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-[#E3FF00] focus:outline-none"
                    />
                </div>

                <div>
                    <label className="text-xs text-neutral-400 mb-1 block">الدور</label>
                    <select
                        data-testid="member-role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-[#E3FF00] focus:outline-none"
                    >
                        <option value="admin">مدير</option>
                        <option value="manager">مسؤول</option>
                        <option value="member">عضو</option>
                        <option value="client">عميل</option>
                        <option value="guest">ضيف</option>
                    </select>
                </div>

                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={saving}
                        data-testid="member-submit"
                        className="flex-1 bg-[#E3FF00] text-black font-heading font-bold rounded-lg py-2.5 disabled:opacity-50"
                    >
                        {saving ? "..." : "إضافة"}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 bg-white/5 text-white rounded-lg py-2.5"
                    >
                        إلغاء
                    </button>
                </div>
            </form>
        </div>
    );
};

export default function WorkspaceSettings() {
    const { current, bapi, refresh } = useWorkspace();
    const [members, setMembers] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [wsName, setWsName] = useState("");

    useEffect(() => {
        if (!current) return;
        setWsName(current.name);
        bapi.get(`/business/workspaces/${current.id}/members`).then((r) => setMembers(r.data));
    }, [current?.id]);

    const saveName = async () => {
        if (wsName.trim() === current?.name) return;
        try {
            await bapi.put(`/business/workspaces/${current.id}`, { name: wsName.trim() });
            toast.success("تم الحفظ");
            refresh();
        } catch (err) {
            toast.error(err.response?.data?.detail || "خطأ");
        }
    };

    const removeMember = async (m) => {
        if (m.role === "owner") return toast.error("لا يمكن إزالة المالك");
        if (!confirm(`إزالة ${m.user?.name}؟`)) return;
        try {
            await bapi.delete(`/business/workspaces/${current.id}/members/${m.user_id}`);
            setMembers((ms) => ms.filter((x) => x.id !== m.id));
            toast.success("تمت الإزالة");
        } catch (err) {
            toast.error(err.response?.data?.detail || "خطأ");
        }
    };

    const canManageMembers = current?.role === "owner" || current?.role === "admin";

    return (
        <div className="p-8 max-w-4xl" data-testid="settings-page">
            <header className="mb-8">
                <h1 className="font-heading font-black text-3xl flex items-center gap-3">
                    <SettingsIcon className="w-8 h-8 text-[#E3FF00]" />
                    إعدادات المساحة
                </h1>
            </header>

            <section className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-6 mb-6">
                <h2 className="font-heading font-bold text-lg mb-4">المعلومات العامة</h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-neutral-400 mb-1 block font-body">اسم المساحة</label>
                        <div className="flex gap-2">
                            <input
                                data-testid="ws-name"
                                value={wsName}
                                onChange={(e) => setWsName(e.target.value)}
                                disabled={!canManageMembers}
                                className="flex-1 bg-[#141414] border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-[#E3FF00] focus:outline-none disabled:opacity-50"
                            />
                            {canManageMembers && wsName !== current?.name && (
                                <button
                                    onClick={saveName}
                                    data-testid="save-ws-name"
                                    className="bg-[#E3FF00] text-black font-bold rounded-lg px-4"
                                >
                                    حفظ
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-2">
                        <div>
                            <div className="text-[10px] text-neutral-500 font-body">النوع</div>
                            <div className="text-sm text-white capitalize font-body">{current?.kind}</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-neutral-500 font-body">الخطة</div>
                            <div className="text-sm text-white font-body">{current?.plan}</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-neutral-500 font-body">دورك</div>
                            <div className="text-sm text-[#E3FF00] font-heading font-bold">
                                {ROLE_LABELS[current?.role]?.label || current?.role}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-heading font-bold text-lg">الأعضاء ({members.length})</h2>
                    {canManageMembers && (
                        <button
                            onClick={() => setShowAdd(true)}
                            data-testid="add-member-btn"
                            className="bg-[#E3FF00] text-black font-heading font-bold rounded-lg px-4 py-2 text-sm flex items-center gap-2 active:scale-95"
                        >
                            <UserPlus className="w-4 h-4" strokeWidth={3} />
                            إضافة عضو
                        </button>
                    )}
                </div>
                <div className="space-y-2">
                    {members.map((m) => {
                        const meta = ROLE_LABELS[m.role] || ROLE_LABELS.member;
                        const RoleIcon = meta.icon;
                        return (
                            <div
                                key={m.id}
                                data-testid={`member-row-${m.user_id}`}
                                className="flex items-center gap-3 p-3 bg-[#141414] rounded-xl border border-white/5"
                            >
                                <div className="w-10 h-10 rounded-full bg-[#E3FF00] flex items-center justify-center text-black font-heading font-black">
                                    {m.user?.name?.[0]}
                                </div>
                                <div className="flex-1">
                                    <div className="font-heading font-bold text-white text-sm">
                                        {m.user?.name}
                                    </div>
                                    <div className="text-xs text-neutral-500">@{m.user?.username}</div>
                                </div>
                                <span
                                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${meta.color}`}
                                >
                                    {RoleIcon && <RoleIcon className="w-3 h-3" />}
                                    {meta.label}
                                </span>
                                {canManageMembers && m.role !== "owner" && (
                                    <button
                                        onClick={() => removeMember(m)}
                                        data-testid={`remove-member-${m.user_id}`}
                                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-red-400"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {showAdd && (
                <AddMemberModal
                    wsId={current.id}
                    onClose={() => setShowAdd(false)}
                    onAdded={(m) => setMembers((ms) => [...ms, m])}
                />
            )}
        </div>
    );
}
