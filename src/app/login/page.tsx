"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Hexagon, Sparkles, LogIn, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (res?.error) {
        toast.error(res.error);
        setIsLoading(false);
      } else {
        toast.success("เข้าสู่ระบบสำเร็จ!");
        router.push("/");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] flex flex-col justify-center items-center p-4 selection:bg-primary/30 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white dark:bg-[#1e293b] rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700/50 p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-md mb-4">
            <Hexagon size={28} className="absolute" />
            <Sparkles size={12} className="absolute mb-4 ml-4 text-yellow-200" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">ยินดีต้อนรับกลับมา</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">เข้าสู่ระบบเพื่อจัดการประเมินผลของคุณ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">อีเมลสถาบัน</label>
            {/* 🚨 แก้ไข Placeholder ตรงนี้ */}
            <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-[#0f172a] focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="email@eval.ac.th" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">รหัสผ่าน</label>
            <div className="relative">
              <input required type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-[#0f172a] focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-95 flex justify-center items-center gap-2 mt-2">
            {isLoading ? "กำลังตรวจสอบข้อมูล..." : <><LogIn size={18} /> เข้าสู่ระบบ</>}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-slate-500">
          ยังไม่มีบัญชีใช่หรือไม่? <Link href="/register" className="text-primary font-bold hover:underline">ลงทะเบียนที่นี่</Link>
        </p>
      </div>
    </div>
  );
}