import { useEffect, useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { KanbanSquare, Plus, X, DollarSign, User } from "lucide-react";
import { toast } from "sonner";

const STAGE_COLORS = {
    lead: "border-neutral-500",
    qualified: "border-blue-500",
    proposal: "border-purple-500",
    negotiation: "border-orange-500",
    won: "border-emerald-500",
    lost: "border-red-500",
};

const DealCard = ({ deal, onDragStart, onClick }) => (
    <div
        draggable
        onDragStart={(e) => onDragStart(e, deal)}
        onClick={() => onClick(deal)}
        data-testid={`deal-card-${deal.id}`}
        className="bg-[#141414] border border-white/5 hover:border-[#E3FF00]/50 rounded-xl p-3 cursor-move active:opacity-60 transition group"
    >
        <div className="text-sm font-heading font-bold text-white line-clamp-1 mb-2">
            {deal.title}
        </div>
        {deal.contact && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-2">
                <User className="w-3 h-3" />
                <span className="truncate">{deal.contact.name}</span>
            </div>
        )}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[#E3FF00] font-heading font-black text-sm">
                <DollarSign className="w-3.5 h-3.5" />
                {deal.value.toLocaleString()}
            </div>
            <span className="text-[10px] text-neutral-500">{deal.currency}</span>
        </div>
    </div>
);

const NewDealModal = ({ pipeline, onClose, onCreated }) => {
    const { bapi } = useWorkspace();
    const [contacts, setContacts] = useState([]);
    const [form, setForm] = useState({
        title: "",
        contact_id: "",
        stage_id: pipeline?.stages?.[0]?.id || "lead",
        value: 0,
        currency: "USD",
        notes: "",
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        bapi.get("/business/crm/contacts").then((r) => setContacts(r.data));
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.contact_id) return toast.error("العنوان وجهة الاتصال مطلوبة");
        setSaving(true);
        try {
            const { data } = await bapi.post("/business/crm/deals", {
                ...form,
                pipeline_id: pipeline.id,
                value: parseFloat(form.value) || 0,
            });
            toast.success("تمت إضافة الصفقة");
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
            data-testid="deal-modal"
        >
            <form
                onSubmit={submit}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0F0F0F] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-4"
            >
                <div className="flex items-center justify-between">
                    <h3 className="font-heading font-black text-xl">صفقة جديدة</h3>
                    <button type="button" onClick={onClose}>
                        <X className="w-5 h-5 text-neutral-400" />
                    </button>
                </div>

                <div>
                    <label className="text-xs text-neutral-400 mb-1 block">عنوان الصفقة *</label>
                    <input
                        data-testid="deal-title"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-[#E3FF00] focus:outline-none"
                    />
                </div>

                <div>
                    <label className="text-xs text-neutral-400 mb-1 block">جهة الاتصال *</label>
                    <select
                        data-testid="deal-contact"
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

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-neutral-400 mb-1 block">المرحلة</label>
                        <select
                            data-testid="deal-stage"
                            value={form.stage_id}
                            onChange={(e) => setForm({ ...form, stage_id: e.target.value })}
                            className="w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-[#E3FF00] focus:outline-none"
                        >
                            {pipeline.stages.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-neutral-400 mb-1 block">القيمة</label>
                        <input
                            type="number"
                            data-testid="deal-value"
                            value={form.value}
                            onChange={(e) => setForm({ ...form, value: e.target.value })}
                            className="w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-[#E3FF00] focus:outline-none"
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={saving}
                        data-testid="deal-submit"
                        className="flex-1 bg-[#E3FF00] text-black font-heading font-bold rounded-lg py-2.5 disabled:opacity-50"
                    >
                        {saving ? "..." : "إنشاء"}
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

export default function Pipeline() {
    const { current, bapi } = useWorkspace();
    const [pipelines, setPipelines] = useState([]);
    const [pipeline, setPipeline] = useState(null);
    const [deals, setDeals] = useState([]);
    const [dragging, setDragging] = useState(null);
    const [dragOver, setDragOver] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        if (!current) return;
        setLoading(true);
        const ps = await bapi.get("/business/crm/pipelines");
        setPipelines(ps.data);
        const active = pipeline
            ? ps.data.find((p) => p.id === pipeline.id) || ps.data[0]
            : ps.data[0];
        setPipeline(active);
        if (active) {
            const ds = await bapi.get(`/business/crm/deals?pipeline_id=${active.id}`);
            setDeals(ds.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current?.id]);

    const onDragStart = (e, deal) => {
        setDragging(deal);
        e.dataTransfer.effectAllowed = "move";
    };

    const onDragOver = (e, stageId) => {
        e.preventDefault();
        setDragOver(stageId);
    };

    const onDrop = async (e, stageId) => {
        e.preventDefault();
        setDragOver(null);
        if (!dragging || dragging.stage_id === stageId) {
            setDragging(null);
            return;
        }
        // Optimistic update
        setDeals((ds) => ds.map((d) => (d.id === dragging.id ? { ...d, stage_id: stageId } : d)));
        try {
            await bapi.put(`/business/crm/deals/${dragging.id}`, { stage_id: stageId });
            toast.success("تم نقل الصفقة");
        } catch (err) {
            toast.error("فشل النقل");
            load();
        }
        setDragging(null);
    };

    if (!pipeline || loading) {
        return (
            <div className="p-8 text-neutral-500">
                <div className="animate-pulse font-body">جارٍ التحميل...</div>
            </div>
        );
    }

    return (
        <div className="p-8 h-screen overflow-hidden flex flex-col" data-testid="pipeline-page">
            <header className="mb-6 flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="font-heading font-black text-3xl flex items-center gap-3">
                        <KanbanSquare className="w-8 h-8 text-[#E3FF00]" />
                        مسار الصفقات
                    </h1>
                    <p className="text-neutral-400 text-sm mt-1 font-body">
                        {pipeline.name} • {deals.length} صفقة
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {pipelines.length > 1 && (
                        <select
                            data-testid="pipeline-selector"
                            value={pipeline.id}
                            onChange={(e) => {
                                const p = pipelines.find((x) => x.id === e.target.value);
                                setPipeline(p);
                                bapi.get(`/business/crm/deals?pipeline_id=${p.id}`).then((r) => setDeals(r.data));
                            }}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#E3FF00] focus:outline-none"
                        >
                            {pipelines.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    )}
                    <button
                        onClick={() => setShowModal(true)}
                        data-testid="add-deal-btn"
                        className="bg-[#E3FF00] text-black font-heading font-bold rounded-xl px-5 py-2.5 flex items-center gap-2 active:scale-95 hover:bg-[#CCEA00] transition"
                    >
                        <Plus className="w-4 h-4" strokeWidth={3} />
                        صفقة جديدة
                    </button>
                </div>
            </header>

            {/* Kanban board */}
            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-4 h-full min-w-max pb-4">
                    {pipeline.stages.map((stage) => {
                        const stageDeals = deals.filter((d) => d.stage_id === stage.id);
                        const total = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
                        return (
                            <div
                                key={stage.id}
                                data-testid={`stage-column-${stage.id}`}
                                onDragOver={(e) => onDragOver(e, stage.id)}
                                onDragLeave={() => setDragOver(null)}
                                onDrop={(e) => onDrop(e, stage.id)}
                                className={`w-72 shrink-0 bg-[#0A0A0A] border-t-2 ${
                                    STAGE_COLORS[stage.id] || "border-neutral-500"
                                } rounded-2xl p-4 flex flex-col ${
                                    dragOver === stage.id ? "ring-2 ring-[#E3FF00]" : ""
                                } transition-all`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-heading font-bold text-sm text-white">
                                            {stage.name}
                                        </h3>
                                        <div className="text-[10px] text-neutral-500 font-body">
                                            {stageDeals.length} صفقة • ${total.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-neutral-600 bg-white/5 rounded-full px-2 py-0.5 font-body">
                                        {stage.probability}%
                                    </div>
                                </div>
                                <div className="space-y-2 overflow-y-auto flex-1">
                                    {stageDeals.map((d) => (
                                        <DealCard
                                            key={d.id}
                                            deal={d}
                                            onDragStart={onDragStart}
                                            onClick={() => {}}
                                        />
                                    ))}
                                    {stageDeals.length === 0 && (
                                        <div className="text-center py-8 text-neutral-700 text-xs font-body">
                                            اسحب صفقة هنا
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {showModal && (
                <NewDealModal
                    pipeline={pipeline}
                    onClose={() => setShowModal(false)}
                    onCreated={(d) => setDeals((ds) => [d, ...ds])}
                />
            )}
        </div>
    );
}
