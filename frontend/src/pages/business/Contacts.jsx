import { useEffect, useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useSearchParams, Link } from "react-router-dom";
import {
    Users,
    Plus,
    Search,
    X,
    Building2,
    Mail,
    Phone,
    Trash2,
    ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";

const KIND_LABELS = {
    lead: { label: "Lead", color: "bg-[#E3FF00] text-black" },
    customer: { label: "عميل", color: "bg-blue-500 text-white" },
    partner: { label: "شريك", color: "bg-purple-500 text-white" },
};

const ContactModal = ({ onClose, onCreated }) => {
    const { bapi } = useWorkspace();
    const [form, setForm] = useState({
        name: "",
        kind: "lead",
        email: "",
        phone: "",
        company: "",
        source: "",
        notes: "",
    });
    const [saving, setSaving] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return toast.error("الاسم مطلوب");
        setSaving(true);
        try {
            const { data } = await bapi.post("/business/crm/contacts", {
                ...form,
                email: form.email || null,
            });
            toast.success("تمت الإضافة");
            onCreated(data);
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
            data-testid="contact-modal"
        >
            <form
                onSubmit={submit}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0F0F0F] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-4"
            >
                <div className="flex items-center justify-between">
                    <h3 className="font-heading font-black text-xl">جهة اتصال جديدة</h3>
                    <button type="button" onClick={onClose} data-testid="modal-close">
                        <X className="w-5 h-5 text-neutral-400" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                        <label className="text-xs text-neutral-400 font-body mb-1 block">الاسم *</label>
                        <input
                            data-testid="contact-name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-[#E3FF00] focus:outline-none"
                            placeholder="اسم الشخص أو الجهة"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-neutral-400 font-body mb-1 block">النوع</label>
                        <select
                            data-testid="contact-kind"
                            value={form.kind}
                            onChange={(e) => setForm({ ...form, kind: e.target.value })}
                            className="w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-[#E3FF00] focus:outline-none"
                        >
                            <option value="lead">Lead</option>
                            <option value="customer">عميل</option>
                            <option value="partner">شريك</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-neutral-400 font-body mb-1 block">المصدر</label>
                        <input
                            data-testid="contact-source"
                            value={form.source}
                            onChange={(e) => setForm({ ...form, source: e.target.value })}
                            placeholder="LinkedIn, إحالة..."
                            className="w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-[#E3FF00] focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-neutral-400 font-body mb-1 block">البريد</label>
                        <input
                            type="email"
                            data-testid="contact-email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-[#E3FF00] focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-neutral-400 font-body mb-1 block">الهاتف</label>
                        <input
                            data-testid="contact-phone"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-[#E3FF00] focus:outline-none"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs text-neutral-400 font-body mb-1 block">الشركة</label>
                        <input
                            data-testid="contact-company"
                            value={form.company}
                            onChange={(e) => setForm({ ...form, company: e.target.value })}
                            className="w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-[#E3FF00] focus:outline-none"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs text-neutral-400 font-body mb-1 block">ملاحظات</label>
                        <textarea
                            data-testid="contact-notes"
                            rows={2}
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            className="w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-[#E3FF00] focus:outline-none resize-none"
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={saving}
                        data-testid="contact-submit"
                        className="flex-1 bg-[#E3FF00] text-black font-heading font-bold rounded-lg py-2.5 active:scale-95 disabled:opacity-50"
                    >
                        {saving ? "جارٍ الحفظ..." : "حفظ"}
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

export default function Contacts() {
    const { current, bapi } = useWorkspace();
    const [params, setParams] = useSearchParams();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [showModal, setShowModal] = useState(false);
    const kind = params.get("kind") || "";

    const load = async () => {
        if (!current) return;
        setLoading(true);
        try {
            const qs = new URLSearchParams();
            if (kind) qs.set("kind", kind);
            if (query) qs.set("q", query);
            const r = await bapi.get(`/business/crm/contacts?${qs}`);
            setContacts(r.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current?.id, kind]);

    const del = async (c) => {
        if (!confirm(`حذف "${c.name}"؟`)) return;
        try {
            await bapi.delete(`/business/crm/contacts/${c.id}`);
            setContacts((cs) => cs.filter((x) => x.id !== c.id));
            toast.success("تم الحذف");
        } catch (err) {
            toast.error(err.response?.data?.detail || "خطأ");
        }
    };

    return (
        <div className="p-8" data-testid="contacts-page">
            <header className="mb-6 flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="font-heading font-black text-3xl flex items-center gap-3">
                        <Users className="w-8 h-8 text-[#E3FF00]" />
                        العملاء والـ Leads
                    </h1>
                    <p className="text-neutral-400 text-sm mt-1 font-body">
                        {contacts.length} جهة اتصال
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    data-testid="add-contact-btn"
                    className="bg-[#E3FF00] text-black font-heading font-bold rounded-xl px-5 py-2.5 flex items-center gap-2 active:scale-95 hover:bg-[#CCEA00] transition"
                >
                    <Plus className="w-4 h-4" strokeWidth={3} />
                    إضافة جهة اتصال
                </button>
            </header>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
                <button
                    onClick={() => setParams({})}
                    data-testid="filter-all"
                    className={`px-4 py-2 rounded-full text-sm font-body transition ${
                        !kind ? "bg-[#E3FF00] text-black" : "bg-white/5 text-neutral-400 hover:bg-white/10"
                    }`}
                >
                    الكل
                </button>
                <button
                    onClick={() => setParams({ kind: "lead" })}
                    data-testid="filter-lead"
                    className={`px-4 py-2 rounded-full text-sm font-body transition ${
                        kind === "lead"
                            ? "bg-[#E3FF00] text-black"
                            : "bg-white/5 text-neutral-400 hover:bg-white/10"
                    }`}
                >
                    Leads
                </button>
                <button
                    onClick={() => setParams({ kind: "customer" })}
                    data-testid="filter-customer"
                    className={`px-4 py-2 rounded-full text-sm font-body transition ${
                        kind === "customer"
                            ? "bg-[#E3FF00] text-black"
                            : "bg-white/5 text-neutral-400 hover:bg-white/10"
                    }`}
                >
                    عملاء
                </button>
                <button
                    onClick={() => setParams({ kind: "partner" })}
                    data-testid="filter-partner"
                    className={`px-4 py-2 rounded-full text-sm font-body transition ${
                        kind === "partner"
                            ? "bg-[#E3FF00] text-black"
                            : "bg-white/5 text-neutral-400 hover:bg-white/10"
                    }`}
                >
                    شركاء
                </button>
                <div className="flex-1 min-w-[240px]">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <input
                            data-testid="contacts-search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && load()}
                            placeholder="ابحث..."
                            className="w-full bg-white/5 border border-white/5 rounded-full pr-9 pl-4 py-2 text-sm text-white focus:border-[#E3FF00] focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#0C0C0C] border border-white/5 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-neutral-500">جارٍ التحميل...</div>
                ) : contacts.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                        <p className="text-neutral-500 font-body">لا توجد جهات اتصال بعد</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="mt-4 bg-[#E3FF00] text-black font-bold rounded-lg px-4 py-2 text-sm"
                        >
                            إضافة أول جهة
                        </button>
                    </div>
                ) : (
                    <table className="w-full" data-testid="contacts-table">
                        <thead className="bg-white/[0.02] border-b border-white/5">
                            <tr className="text-right text-xs text-neutral-500 font-body">
                                <th className="p-4 font-normal">الاسم</th>
                                <th className="p-4 font-normal">النوع</th>
                                <th className="p-4 font-normal">الشركة</th>
                                <th className="p-4 font-normal">التواصل</th>
                                <th className="p-4 font-normal">المصدر</th>
                                <th className="p-4 font-normal"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {contacts.map((c) => {
                                const kd = KIND_LABELS[c.kind] || KIND_LABELS.lead;
                                return (
                                    <tr
                                        key={c.id}
                                        data-testid={`contact-row-${c.id}`}
                                        className="border-b border-white/5 hover:bg-white/[0.02] transition group"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E3FF00] to-[#8FA000] flex items-center justify-center text-black font-heading font-black text-sm shrink-0">
                                                    {c.name?.[0]}
                                                </div>
                                                <div>
                                                    <div className="font-heading font-bold text-white">
                                                        {c.name}
                                                    </div>
                                                    {c.notes && (
                                                        <div className="text-xs text-neutral-500 truncate max-w-xs">
                                                            {c.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${kd.color}`}>
                                                {kd.label}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {c.company ? (
                                                <div className="flex items-center gap-2 text-sm text-neutral-300">
                                                    <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                                                    {c.company}
                                                </div>
                                            ) : (
                                                <span className="text-neutral-600">—</span>
                                            )}
                                        </td>
                                        <td className="p-4 space-y-1">
                                            {c.email && (
                                                <div className="flex items-center gap-2 text-xs text-neutral-400">
                                                    <Mail className="w-3 h-3" />
                                                    {c.email}
                                                </div>
                                            )}
                                            {c.phone && (
                                                <div className="flex items-center gap-2 text-xs text-neutral-400">
                                                    <Phone className="w-3 h-3" />
                                                    {c.phone}
                                                </div>
                                            )}
                                            {!c.email && !c.phone && <span className="text-neutral-600">—</span>}
                                        </td>
                                        <td className="p-4 text-sm text-neutral-400">
                                            {c.source || <span className="text-neutral-600">—</span>}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                                                <Link
                                                    to={`/business/pipeline?contact=${c.id}`}
                                                    data-testid={`open-contact-${c.id}`}
                                                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white"
                                                >
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => del(c)}
                                                    data-testid={`delete-contact-${c.id}`}
                                                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-neutral-400 hover:text-red-400"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <ContactModal
                    onClose={() => setShowModal(false)}
                    onCreated={(c) => setContacts((cs) => [c, ...cs])}
                />
            )}
        </div>
    );
}
