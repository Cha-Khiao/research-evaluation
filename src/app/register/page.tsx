"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Hexagon, Sparkles, UserPlus, Info, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      toast.success(data.message);
      router.push("/login");
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] flex flex-col justify-center items-center p-4 selection:bg-primary/30 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white dark:bg-[#1e293b] rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700/50 p-8 relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-md mb-4">
            <Hexagon size={28} className="absolute" />
            <Sparkles size={12} className="absolute mb-4 ml-4 text-yellow-200" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">สร้างบัญชีผู้ใช้ใหม่</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">สมัครสมาชิกเพื่อเข้าใช้งานระบบ</p>
        </div>

        {/* 🚨 กล่องข้อความอธิบายกฎใหม่ */}
        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 mb-6 flex gap-3">
          <Info size={24} className="text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed space-y-1">
            <p><strong>เงื่อนไขการใช้อีเมล:</strong></p>
            <ul className="list-disc pl-4 space-y-1">
              <li>บังคับใช้อีเมล <span className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 rounded">@eval.ac.th</span> เท่านั้น</li>
              <li><strong>นักศึกษา:</strong> หน้า @ ต้องเป็นตัวเลข (รหัสนักศึกษา) ล้วน ห้ามมีอักษร</li>
              <li><strong>อาจารย์:</strong> หน้า @ ต้องมีตัวอักษรภาษาอังกฤษ</li>
            </ul>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">ชื่อ - นามสกุล</label>
            <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-[#0f172a] focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="นาย สมชาย ใจดี" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">อีเมลสถาบัน (@eval.ac.th)</label>
            <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-[#0f172a] focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="64011234@eval.ac.th หรือ somchai@eval.ac.th" />
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
            {isLoading ? "กำลังตรวจสอบข้อมูล..." : <><UserPlus size={18} /> สมัครสมาชิก</>}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-slate-500">
          มีบัญชีอยู่แล้ว? <Link href="/login" className="text-primary font-bold hover:underline">เข้าสู่ระบบที่นี่</Link>
        </p>
      </div>
    </div>
  );
}