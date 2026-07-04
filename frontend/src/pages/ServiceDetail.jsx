import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { ChevronRight, Clock, DollarSign } from "lucide-react";

export default function ServiceDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [service, setService] = useState(null);
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get(`/services/${id}`).then((r) => setService(r.data));
    }, [id]);

    const order = async () => {
        if (!user) return navigate("/auth");
        setLoading(true);
        try {
            const res = await api.post("/orders", { service_id: id, notes });
            toast.success("تم إنشاء الطلب، انتقل لصفحة الطلبات للدفع");
            navigate("/orders");
        } catch (err) {
            toast.error(err?.response?.data?.detail || "خطأ");
        } finally {
            setLoading(false);
        }
    };

    if (!service) return <div className="p-8 text-center text-neutral-500">جارٍ التحميل...</div>;

    return (
        <div className="p-6 pt-8 font-body" data-testid="service-detail">
            <button onClick={() => navigate(-1)} className="text-neutral-400 mb-4 flex items-center gap-1 text-sm">
                <ChevronRight className="w-4 h-4" /> رجوع
            </button>

            <Link to={`/u/${service.creator?.username}`} className="flex items-center gap-3 mb-6 bg-[#141414] border border-[#262626] rounded-2xl p-3 hover:border-[#E3FF00] transition">
                <div className="w-12 h-12 rounded-full bg-[#E3FF00] flex items-center justify-center text-black font-heading font-black">
                    {service.creator?.name?.[0]}
                </div>
                <div>
                    <div className="font-heading font-bold">{service.creator?.name}</div>
                    <div className="text-xs text-neutral-500">@{service.creator?.username}</div>
                </div>
            </Link>

            <h1 className="text-2xl font-heading font-black mb-3">{service.title}</h1>
            <p className="text-neutral-300 leading-relaxed mb-6 whitespace-pre-line">{service.description}</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
                    <div className="text-xs text-neutral-500 mb-1 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> السعر
                    </div>
                    <div className="text-[#E3FF00] font-heading font-black text-2xl">${service.price}</div>
                </div>
                <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
                    <div className="text-xs text-neutral-500 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> التسليم
                    </div>
                    <div className="font-heading font-black text-xl">{service.delivery_days} أيام</div>
                </div>
            </div>

            <label className="text-sm text-neutral-400 mb-2 block">تفاصيل الطلب (اختياري)</label>
            <textarea
                data-testid="order-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="اكتب ما تحتاجه..."
                className="w-full bg-[#141414] border border-[#262626] rounded-xl px-4 py-3 focus:border-[#E3FF00] focus:outline-none mb-6 resize-none"
            />

            <button
                onClick={order}
                disabled={loading}
                data-testid="order-service-btn"
                className="w-full bg-[#E3FF00] text-black font-heading font-bold rounded-full py-4 hover:bg-[#CCEA00] transition active:scale-95 disabled:opacity-50"
            >
                {loading ? "..." : `اطلب الآن بـ $${service.price}`}
            </button>
        </div>
    );
}
