"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Hexagon, Sparkles, ArrowRight, BookOpen, Users, BarChart3, Sun, Moon } from "lucide-react";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  
  const [mounted, setMounted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (status === "authenticated") {
      const role = (session?.user as any)?.role;
      if (role === "TEACHER") router.push("/dashboard");
      else if (role === "STUDENT") router.push("/student");
    } else if (status === "unauthenticated") {
      setIsRedirecting(false); 
    }
  }, [status, session, router]);

  if (status === "loading" || isRedirecting) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg animate-pulse">
          <Hexagon size={40} className="absolute" />
          <Sparkles size={16} className="absolute mb-5 ml-5 text-yellow-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 font-sans selection:bg-primary/30 relative overflow-hidden flex flex-col">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 dark:bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <header className="relative z-10 py-6 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto w-full flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-md">
            <Hexagon size={24} className="absolute" />
            <Sparkles size={12} className="absolute mb-4 ml-4 text-yellow-200" />
          </div>
          <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">
            Eval<span className="text-primary">Sys</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          {/* ✨ ปุ่มเปลี่ยนธีมบน Landing Page */}
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/50 dark:bg-[#1e293b]/50 backdrop-blur-md text-slate-600 dark:text-slate-300 hover:text-primary transition-all shadow-sm">
            {mounted ? (theme === "dark" ? <Sun size={18} /> : <Moon size={18} />) : null}
          </button>

          <Link href="/login" className="hidden sm:flex items-center font-bold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors px-4 py-2">
            เข้าสู่ระบบ
          </Link>
          <Link href="/register" className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 text-sm sm:text-base">
            ลงทะเบียน
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 mt-10 mb-20 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs sm:text-sm mb-8 tracking-wide">
          <Sparkles size={14} /> แพลตฟอร์มประเมินผลการเรียนรู้ V 1.0
        </div>
        <h2 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.1] text-slate-900 dark:text-white mb-6">
          จัดการการประเมินโปรเจกต์ <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
            ให้เป็นเรื่องง่ายในคลิกเดียว
          </span>
        </h2>
        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          ระบบที่ช่วยอาจารย์ลดภาระการตัดเกรด และให้นักศึกษามีส่วนร่วมในการประเมินเพื่อนแบบ 360 องศา พร้อมกราฟวิเคราะห์ผลแบบ Real-time
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/register" className="bg-primary hover:bg-primary-hover text-white font-bold text-lg px-8 py-4 rounded-2xl transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 flex justify-center items-center gap-2 active:scale-95">
            เริ่มต้นใช้งาน <ArrowRight size={20} />
          </Link>
          <Link href="/login" className="bg-white dark:bg-[#1e293b] hover:bg-slate-50 dark:hover:bg-[#0f172a] text-slate-800 dark:text-white font-bold text-lg px-8 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 transition-all shadow-sm flex justify-center items-center active:scale-95">
            เข้าสู่ระบบ
          </Link>
        </div>
      </main>

      {/* ลบเส้นกั้น border-t ออกแล้วครับ */}
      <div className="relative z-10 bg-white/30 dark:bg-[#0f172a]/30 backdrop-blur-sm py-16 px-6 sm:px-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6 rounded-3xl hover:bg-white/80 dark:hover:bg-[#1e293b]/80 transition-colors shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-800">
            <div className="w-14 h-14 bg-orange-100 dark:bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mb-4"><BookOpen size={28} /></div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">จัดการห้องเรียนง่าย</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">สร้างห้องเรียนและสร้างรหัสเข้าห้องให้นักศึกษาเข้าร่วมได้ภายใน 1 นาที</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 rounded-3xl hover:bg-white/80 dark:hover:bg-[#1e293b]/80 transition-colors shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-800">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-4"><Users size={28} /></div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">ประเมินผล 360 องศา</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">นักศึกษาสามารถฟอร์มทีม และประเมินผลงานของกลุ่มเพื่อนได้อย่างอิสระ</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 rounded-3xl hover:bg-white/80 dark:hover:bg-[#1e293b]/80 transition-colors shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-800">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center mb-4"><BarChart3 size={28} /></div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">สรุปผลด้วยกราฟ</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">ระบบคำนวณค่าเฉลี่ยและสร้างกราฟใยแมงมุมให้อัตโนมัติ พร้อมส่งออก Excel</p>
          </div>
        </div>
      </div>
    </div>
  );
}