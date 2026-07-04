import { useEffect, useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useSearchParams } from "react-router-dom";
import { FileText, Plus, X, Trash2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const STATUS_META = {
    draft: { label: "مسودة", icon: Clock, className: "bg-neutral-700 text-white" },
    sent: { label: "مُرسلة", icon: FileText, className: "bg-blue-600 text-white" },
    paid: { label: "مدفوعة", icon: CheckCircle2, className: "bg-emerald-600 text-white" },
    overdue: { label: "متأخرة", icon: AlertCircle, className: "bg-red-600 text-white" },
    cancelled: { label: "ملغاة", icon: X, className: "bg-neutral-800 text-neutral-400" },
};

const NewInvoiceModal = ({ onClose, onCreated }) => {
    const { bapi } = useWorkspace();
    const [contacts, setContacts] = useState([]);
    const [form, setForm] = useState({
        contact_id: "",
        tax_percent: 15,
        currency: "USD",
        due_at: "",
        notes: "",
    });
    const [items, setItems] = useState([{ description: "", quantity: 1, unit_price: 0 }]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        bapi.get("/business/crm/contacts").then((r) => setContacts(r.data));
    }, []);

    const addItem = () => setItems([...items, { description: "", quantity: 1, unit_price: 0 }]);
    const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
    const updateItem = (i, field, value) => {
        setItems(items.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
    };

    const subtotal = items.reduce(
        (s, it) => s + (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0),
        0
    );
    const tax = subtotal * (parseFloat(form.tax_percent) || 0) / 100;
    const total = subtotal + tax;

    const submit = async (e) => {
        e.preventDefault();
        if (!form.contact_id) return toast.error("جهة الاتصال مطلوبة");
        const cleanItems = items
            .filter((it) => it.description.trim())
            .map((it) => ({
                description: it.description,
                quantity: parseFloat(it.quantity) || 0,
                unit_price: parseFloat(it.unit_price) || 0,
            }));
        if (cleanItems.length === 0) return toast.error("أضف بنداً واحداً على الأقل");

        setSaving(true);
        try {
            const { data } = await bapi.post("/business/crm/invoices", {
                ...form,
                items: cleanItems,
                tax_percent: parseFloat(form.tax_percent) || 0,
                due_at: form.due_at || null,
            });
            toast.success(`تم إنشاء ${data.number}`);
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
            data-testid="invoice-modal"
        >
            <form
                onSubmit={submit}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0F0F0F] border border-white/10 rounded-2xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between">
                    <h3 className="font-heading font-black text-xl">فاتورة جديدة</h3>
                    <button type="button" onClick={onClose}>
                        <X className="w-5 h-5 text-neutral-400" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-neutral-400 mb-1 block">جهة الاتصال *</label>
                        <select
                            data-testid="invoice-contact"
                            value={form.contact_id}
                            onChange={(e) => setForm({ ...form, contact_id: e.target.value })}
                            className="w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-[#E3FF00] focus:outline-none"
                        >
                            <option value="">اختر...</option>
                            {contacts.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} {c.company ? `— ${c.company}` : ""}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-neutral-400 mb-1 block">تاريخ الاستحقاق</label>
                        <input
                            type="date"
                            data-testid="invoice-due"
                            value={form.due_at}
                            onChange={(e) => setForm({ ...form, due_at: e.target.value })}
                            className="w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-[#E3FF00] focus:outline-none"
                        />
                    </div>
                </div>

                {/* Items */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-neutral-400 font-body">البنود</label>
                        <button
                            type="button"
                            onClick={addItem}
                            data-testid="add-item-btn"
                            className="text-xs text-[#E3FF00] hover:underline flex items-center gap-1"
                        >
                            <Plus className="w-3 h-3" />
                            بند
                        </button>
                    </div>
                    <div className="space-y-2">
                        {items.map((it, i) => (
                            <div key={i} className="flex gap-2 items-start" data-testid={`item-row-${i}`}>
                                <input
                                    placeholder="الوصف"
                                    value={it.description}
                                    onChange={(e) => updateItem(i, "description", e.target.value)}
                                    className="flex-1 bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#E3FF00] focus:outline-none"
                                    data-testid={`item-desc-${i}`}
                                />
                                <input
                                    type="number"
                                    step="0.5"
                                    placeholder="الكمية"
                                    value={it.quantity}
                                    onChange={(e) => updateItem(i, "quantity", e.target.value)}
                                    className="w-20 bg-[#141414] border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:border-[#E3FF00] focus:outline-none"
                                    data-testid={`item-qty-${i}`}
                                />
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="السعر"
                                    value={it.unit_price}
                                    onChange={(e) => updateItem(i, "unit_price", e.target.value)}
                                    className="w-24 bg-[#141414] border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:border-[#E3FF00] focus:outline-none"
                                    data-testid={`item-price-${i}`}
                                />
                                {items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeItem(i)}
                                        className="w-9 h-9 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-red-400 shrink-0"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-neutral-400 mb-1 block">الضريبة %</label>
                        <input
                            type="number"
                            data-testid="invoice-tax"
                            value={form.tax_percent}
                            onChange={(e) => setForm({ ...form, tax_percent: e.target.value })}
                            className="w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#E3FF00] focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-neutral-400 mb-1 block">العملة</label>
                        <select
                            value={form.currency}
                            onChange={(e) => setForm({ ...form, currency: e.target.value })}
                            className="w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#E3FF00] focus:outline-none"
                        >
                            <option value="USD">USD</option>
                            <option value="SAR">SAR</option>
                            <option value="AED">AED</option>
                            <option value="EGP">EGP</option>
                        </select>
                    </div>
                </div>

                <div className="bg-[#141414] rounded-lg p-4 space-y-1 text-sm">
                    <div className="flex justify-between text-neutral-400">
                        <span>المجموع الفرعي</span>
                        <span>{subtotal.toFixed(2)} {form.currency}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                        <span>ضريبة ({form.tax_percent}%)</span>
                        <span>{tax.toFixed(2)} {form.currency}</span>
                    </div>
                    <div className="flex justify-between font-heading font-black text-white pt-2 border-t border-white/10 text-lg">
                        <span>الإجمالي</span>
                        <span data-testid="invoice-total">{total.toFixed(2)} {form.currency}</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={saving}
                        data-testid="invoice-submit"
                        className="flex-1 bg-[#E3FF00] text-black font-heading font-bold rounded-lg py-2.5 disabled:opacity-50"
                    >
                        {saving ? "..." : "إنشاء الفاتورة"}
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

export default function Invoices() {
    const { current, bapi } = useWorkspace();
    const [params, setParams] = useSearchParams();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const status = params.get("status") || "";

    const load = async () => {
        if (!current) return;
        setLoading(true);
        const qs = new URLSearchParams();
        if (status) qs.set("status", status);
        const r = await bapi.get(`/business/crm/invoices?${qs}`);
        setInvoices(r.data);
        setLoading(false);
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current?.id, status]);

    const markPaid = async (inv) => {
        try {
            const { data } = await bapi.post(`/business/crm/invoices/${inv.id}/mark-paid`);
            setInvoices((is) => is.map((x) => (x.id === inv.id ? { ...x, ...data } : x)));
            toast.success("تم تحصيل الفاتورة");
        } catch (err) {
            toast.error(err.response?.data?.detail || "خطأ");
        }
    };

    const del = async (inv) => {
        if (!confirm(`حذف ${inv.number}؟`)) return;
        try {
            await bapi.delete(`/business/crm/invoices/${inv.id}`);
            setInvoices((is) => is.filter((x) => x.id !== inv.id));
            toast.success("تم الحذف");
        } catch (err) {
            toast.error(err.response?.data?.detail || "خطأ");
        }
    };

    return (
        <div className="p-8" data-testid="invoices-page">
            <header className="mb-6 flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="font-heading font-black text-3xl flex items-center gap-3">
                        <FileText className="w-8 h-8 text-[#E3FF00]" />
                        الفواتير
                    </h1>
                    <p className="text-neutral-400 text-sm mt-1 font-body">
                        {invoices.length} فاتورة
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    data-testid="add-invoice-btn"
                    className="bg-[#E3FF00] text-black font-heading font-bold rounded-xl px-5 py-2.5 flex items-center gap-2 active:scale-95 hover:bg-[#CCEA00] transition"
                >
                    <Plus className="w-4 h-4" strokeWidth={3} />
                    فاتورة جديدة
                </button>
            </header>

            <div className="flex gap-2 mb-6 flex-wrap">
                {[
                    ["", "الكل"],
                    ["draft", "مسودات"],
                    ["sent", "مُرسلة"],
                    ["paid", "مدفوعة"],
                ].map(([val, label]) => (
                    <button
                        key={val || "all"}
                        onClick={() => (val ? setParams({ status: val }) : setParams({}))}
                        data-testid={`invoice-filter-${val || "all"}`}
                        className={`px-4 py-2 rounded-full text-sm font-body transition ${
                            status === val
                                ? "bg-[#E3FF00] text-black"
                                : "bg-white/5 text-neutral-400 hover:bg-white/10"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="bg-[#0C0C0C] border border-white/5 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-neutral-500">جارٍ التحميل...</div>
                ) : invoices.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                        <p className="text-neutral-500 font-body">لا توجد فواتير بعد</p>
                    </div>
                ) : (
                    <table className="w-full" data-testid="invoices-table">
                        <thead className="bg-white/[0.02] border-b border-white/5">
                            <tr className="text-right text-xs text-neutral-500 font-body">
                                <th className="p-4 font-normal">رقم الفاتورة</th>
                                <th className="p-4 font-normal">العميل</th>
                                <th className="p-4 font-normal">الإجمالي</th>
                                <th className="p-4 font-normal">الحالة</th>
                                <th className="p-4 font-normal">التاريخ</th>
                                <th className="p-4 font-normal"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((inv) => {
                                const meta = STATUS_META[inv.status] || STATUS_META.draft;
                                const Icon = meta.icon;
                                return (
                                    <tr
                                        key={inv.id}
                                        data-testid={`invoice-row-${inv.id}`}
                                        className="border-b border-white/5 hover:bg-white/[0.02] group"
                                    >
                                        <td className="p-4 font-heading font-bold text-white">
                                            {inv.number}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-white">{inv.contact?.name || "—"}</div>
                                            {inv.contact?.company && (
                                                <div className="text-xs text-neutral-500">
                                                    {inv.contact.company}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 font-heading font-black text-[#E3FF00]">
                                            ${inv.total.toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <span
                                                className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full ${meta.className}`}
                                            >
                                                <Icon className="w-3 h-3" />
                                                {meta.label}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs text-neutral-400 font-body">
                                            {new Date(inv.created_at).toLocaleDateString("ar-SA")}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                                                {inv.status !== "paid" && (
                                                    <button
                                                        onClick={() => markPaid(inv)}
                                                        data-testid={`mark-paid-${inv.id}`}
                                                        title="تم الدفع"
                                                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-emerald-500/20 flex items-center justify-center text-emerald-400"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {inv.status !== "paid" && (
                                                    <button
                                                        onClick={() => del(inv)}
                                                        data-testid={`delete-invoice-${inv.id}`}
                                                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-red-400"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
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
                <NewInvoiceModal
                    onClose={() => setShowModal(false)}
                    onCreated={(inv) => setInvoices((is) => [inv, ...is])}
                />
            )}
        </div>
    );
}
