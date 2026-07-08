import { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
    Users,
    UserCheck,
    TrendingUp,
    DollarSign,
    Trophy,
    FileText,
    Activity,
    ArrowUpRight,
} from "lucide-react";

const StatCard = ({ icon: Icon, label, value, sub, tone = "yellow", testId, to }) => {
    const tones = {
        yellow: "border-[#E3FF00]/30 hover:border-[#E3FF00]",
        blue: "border-blue-500/30 hover:border-blue-500",
        green: "border-emerald-500/30 hover:border-emerald-500",
        purple: "border-purple-500/30 hover:border-purple-500",
    };
    const iconBg = {
        yellow: "bg-[#E3FF00] text-black",
        blue: "bg-blue-500 text-white",
        green: "bg-emerald-500 text-white",
        purple: "bg-purple-500 text-white",
    };
    const Wrapper = to ? Link : "div";
    return (
        <Wrapper
            to={to}
            data-testid={testId}
            className={`bg-[#0C0C0C] border ${tones[tone]} rounded-2xl p-5 transition-all group ${
                to ? "cursor-pointer hover:-translate-y-1" : ""
            }`}
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${iconBg[tone]} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" strokeWidth={2.4} />
                </div>
                {to && (
                    <ArrowUpRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition" />
                )}
            </div>
            <div className="text-3xl font-heading font-black text-white">{value}</div>
            <div className="text-xs text-neutral-400 mt-1 font-body">{label}</div>
            {sub && <div className="text-[10px] text-neutral-500 mt-2 font-body">{sub}</div>}
        </Wrapper>
    );
};

const EVENT_LABELS = {
    "workspace.created": "إنشاء مساحة العمل",
    "workspace.updated": "تحديث مساحة العمل",
    "workspace.member.added": "إضافة عضو جديد",
    "workspace.member.removed": "إزالة عضو",
    "crm.contact.created": "إضافة جهة اتصال",
    "crm.contact.updated": "تحديث جهة اتصال",
    "crm.contact.deleted": "حذف جهة اتصال",
    "crm.deal.created": "إنشاء صفقة جديدة",
    "crm.deal.updated": "تحديث صفقة",
    "crm.deal.stage_changed": "نقل صفقة إلى مرحلة جديدة",
    "crm.deal.deleted": "حذف صفقة",
    "crm.invoice.created": "إنشاء فاتورة",
    "crm.invoice.paid": "تحصيل فاتورة",
    "crm.invoice.deleted": "حذف فاتورة",
};

export default function Dashboard() {
    const { stats } = useOutletContext();
    const { current, bapi } = useWorkspace();
    const [events, setEvents] = useState([]);

    useEffect(() => {
        if (current) {
            bapi.get("/business/events/recent?limit=15")
                .then((r) => setEvents(r.data))
                .catch(() => setEvents([]));
        }
    }, [current?.id]);

    return (
        <div className="p-8" data-testid="business-dashboard">
            <header className="mb-8">
                <div className="flex items-center gap-2 text-xs text-neutral-500 font-body mb-2">
                    <span>لوحة التحكم</span>
                    <span>•</span>
                    <span>{current?.name}</span>
                </div>
                <h1 className="font-heading font-black text-4xl">
                    مرحباً <span className="text-[#E3FF00]">👋</span>
                </h1>
                <p className="text-neutral-400 font-body mt-2">
                    نظرة سريعة على ما يحدث في مساحتك اليوم
                </p>
            </header>

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                <StatCard
                    icon={Users}
                    label="Leads نشطة"
                    value={stats?.leads ?? 0}
                    tone="yellow"
                    testId="stat-leads"
                    to="/business/contacts?kind=lead"
                />
                <StatCard
                    icon={UserCheck}
                    label="عملاء"
                    value={stats?.customers ?? 0}
                    tone="blue"
                    testId="stat-customers"
                    to="/business/contacts?kind=customer"
                />
                <StatCard
                    icon={TrendingUp}
                    label="صفقات مفتوحة"
                    value={stats?.open_deals ?? 0}
                    sub={`قيمتها $${(stats?.open_value ?? 0).toLocaleString()}`}
                    tone="purple"
                    testId="stat-open-deals"
                    to="/business/pipeline"
                />
                <StatCard
                    icon={Trophy}
                    label="صفقات مربوحة"
                    value={stats?.won_deals ?? 0}
                    sub={`إجمالي $${(stats?.won_value ?? 0).toLocaleString()}`}
                    tone="green"
                    testId="stat-won-deals"
                />
                <StatCard
                    icon={FileText}
                    label="فواتير غير مدفوعة"
                    value={stats?.unpaid_invoices ?? 0}
                    tone="yellow"
                    testId="stat-unpaid"
                    to="/business/invoices?status=draft"
                />
                <StatCard
                    icon={DollarSign}
                    label="إجمالي المحصّل"
                    value={`$${(stats?.paid_total ?? 0).toLocaleString()}`}
                    tone="green"
                    testId="stat-paid-total"
                />
            </div>

            {/* Activity feed */}
            <section className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                    <Activity className="w-5 h-5 text-[#E3FF00]" />
                    <h2 className="font-heading font-bold text-lg">النشاط الأخير</h2>
                </div>
                {events.length === 0 ? (
                    <p className="text-neutral-500 text-sm font-body text-center py-8">
                        لا يوجد نشاط بعد. ابدأ بإضافة أول جهة اتصال أو صفقة.
                    </p>
                ) : (
                    <ul className="space-y-3" data-testid="activity-list">
                        {events.map((e) => (
                            <li
                                key={e.id}
                                className="flex items-start gap-3 py-2"
                                data-testid={`activity-${e.id}`}
                            >
                                <div className="w-2 h-2 rounded-full bg-[#E3FF00] mt-2 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-white">
                                        {EVENT_LABELS[e.type] || e.type}
                                        {e.actor && (
                                            <span className="text-neutral-500 mr-2">
                                                — @{e.actor.username}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-neutral-600 font-body mt-0.5">
                                        {new Date(e.created_at).toLocaleString("ar-SA")}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
