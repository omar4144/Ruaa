import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Link } from "react-router-dom";
import { Users, TrendingUp } from "lucide-react";

export default function Explore() {
    const [creators, setCreators] = useState([]);

    useEffect(() => {
        api.get("/explore/creators").then((r) => setCreators(r.data));
    }, []);

    return (
        <div className="p-6 pt-8 font-body" data-testid="explore-page">
            <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-6 h-6 text-[#E3FF00]" />
                <h1 className="text-3xl font-heading font-black">اكتشف صناع المحتوى</h1>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {creators.length === 0 && <div className="col-span-2 py-16 text-center text-neutral-500">لا يوجد صناع محتوى بعد</div>}
                {creators.map((c) => (
                    <Link
                        key={c.id}
                        to={`/u/${c.username}`}
                        data-testid={`creator-${c.username}`}
                        className="bg-[#141414] border border-[#262626] hover:border-[#E3FF00] rounded-2xl p-4 transition-all group"
                    >
                        <div className="w-16 h-16 rounded-full bg-[#E3FF00] mb-3 flex items-center justify-center text-black text-2xl font-heading font-black group-hover:scale-105 transition">
                            {c.name?.[0] || "?"}
                        </div>
                        <div className="font-heading font-bold text-sm truncate">{c.name}</div>
                        <div className="text-xs text-neutral-500 truncate">@{c.username}</div>
                        <div className="flex items-center gap-1 text-xs text-neutral-400 mt-2">
                            <Users className="w-3 h-3" />
                            {c.followers || 0} متابع
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
