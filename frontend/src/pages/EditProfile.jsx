import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "@/lib/api";

export default function EditProfile() {
    const { user, setUser } = useAuth();
    const [name, setName] = useState(user?.name || "");
    const [bio, setBio] = useState(user?.bio || "");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const save = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append("name", name);
            fd.append("bio", bio);
            const res = await api.put("/users/me", fd);
            setUser(res.data);
            toast.success("تم الحفظ");
            navigate(`/u/${user.username}`);
        } catch {
            toast.error("خطأ في الحفظ");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 pt-8 font-body" data-testid="edit-profile-page">
            <h1 className="text-3xl font-heading font-black mb-6">تعديل الحساب</h1>
            <form onSubmit={save} className="flex flex-col gap-4">
                <div>
                    <label className="text-sm text-neutral-400 mb-2 block">الاسم الكامل</label>
                    <input data-testid="edit-name" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#141414] border border-[#262626] rounded-xl px-4 py-3 focus:border-[#E3FF00] focus:outline-none" />
                </div>
                <div>
                    <label className="text-sm text-neutral-400 mb-2 block">النبذة</label>
                    <textarea data-testid="edit-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="عرّف عن نفسك..." className="w-full bg-[#141414] border border-[#262626] rounded-xl px-4 py-3 focus:border-[#E3FF00] focus:outline-none resize-none" />
                </div>
                <button data-testid="save-profile-btn" type="submit" disabled={loading} className="bg-[#E3FF00] text-black font-heading font-bold rounded-full py-3.5 hover:bg-[#CCEA00] transition active:scale-95 disabled:opacity-50 mt-3">
                    {loading ? "..." : "حفظ"}
                </button>
            </form>
        </div>
    );
}
