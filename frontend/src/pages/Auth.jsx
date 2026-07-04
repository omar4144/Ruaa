import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export default function Auth() {
    const [mode, setMode] = useState("login"); // login | signup
    const [form, setForm] = useState({ email: "", password: "", name: "", username: "" });
    const [loading, setLoading] = useState(false);
    const { login, signup } = useAuth();
    const navigate = useNavigate();

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === "login") {
                await login(form.email, form.password);
            } else {
                await signup(form);
            }
            toast.success("مرحباً بك في المنصة");
            navigate("/");
        } catch (err) {
            toast.error(err?.response?.data?.detail || "حدث خطأ ما");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-black text-white flex flex-col justify-center p-6 font-body relative overflow-hidden">
            <div className="absolute -top-20 -start-20 w-64 h-64 rounded-full bg-[#E3FF00]/10 blur-3xl" />
            <div className="absolute -bottom-20 -end-20 w-64 h-64 rounded-full bg-[#E3FF00]/5 blur-3xl" />

            <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-8 h-8 text-[#E3FF00]" />
                    <h1 className="text-3xl font-heading font-black">Creator Hub</h1>
                </div>
                <p className="text-neutral-400 mb-10 font-body">
                    المنصة العربية اللي تجمع صناع المحتوى والعملاء
                </p>

                <div className="flex gap-2 bg-neutral-900 p-1 rounded-full mb-8">
                    <button
                        data-testid="tab-login"
                        onClick={() => setMode("login")}
                        className={`flex-1 py-2 rounded-full font-heading font-bold text-sm transition-all ${
                            mode === "login" ? "bg-[#E3FF00] text-black" : "text-neutral-400"
                        }`}
                    >
                        تسجيل الدخول
                    </button>
                    <button
                        data-testid="tab-signup"
                        onClick={() => setMode("signup")}
                        className={`flex-1 py-2 rounded-full font-heading font-bold text-sm transition-all ${
                            mode === "signup" ? "bg-[#E3FF00] text-black" : "text-neutral-400"
                        }`}
                    >
                        إنشاء حساب
                    </button>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-4">
                    {mode === "signup" && (
                        <>
                            <input
                                data-testid="input-name"
                                placeholder="الاسم الكامل"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                                className="bg-[#141414] border border-[#262626] rounded-xl px-4 py-3.5 text-white placeholder-neutral-500 focus:border-[#E3FF00] focus:outline-none transition"
                            />
                            <input
                                data-testid="input-username"
                                placeholder="اسم المستخدم (بالإنجليزية)"
                                value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, "") })}
                                required
                                pattern="[a-z0-9_]{3,20}"
                                className="bg-[#141414] border border-[#262626] rounded-xl px-4 py-3.5 text-white placeholder-neutral-500 focus:border-[#E3FF00] focus:outline-none transition"
                            />
                        </>
                    )}
                    <input
                        data-testid="input-email"
                        type="email"
                        placeholder="البريد الإلكتروني"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                        className="bg-[#141414] border border-[#262626] rounded-xl px-4 py-3.5 text-white placeholder-neutral-500 focus:border-[#E3FF00] focus:outline-none transition"
                    />
                    <input
                        data-testid="input-password"
                        type="password"
                        placeholder="كلمة المرور"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                        minLength={6}
                        className="bg-[#141414] border border-[#262626] rounded-xl px-4 py-3.5 text-white placeholder-neutral-500 focus:border-[#E3FF00] focus:outline-none transition"
                    />

                    <button
                        data-testid="submit-auth"
                        type="submit"
                        disabled={loading}
                        className="bg-[#E3FF00] text-black font-heading font-bold rounded-full py-3.5 hover:bg-[#CCEA00] transition-all active:scale-95 disabled:opacity-60 mt-2"
                    >
                        {loading ? "..." : mode === "login" ? "دخول" : "إنشاء حساب"}
                    </button>
                </form>

                <Link to="/" className="block text-center mt-6 text-neutral-500 text-sm hover:text-white transition" data-testid="skip-auth">
                    تصفح بدون تسجيل →
                </Link>
            </div>
        </div>
    );
}
