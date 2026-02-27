"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOut, Sun, Moon, Hexagon, Sparkles, ArrowLeft, UserCircle, GraduationCap } from "lucide-react";

interface NavbarProps {
  title?: string;
  backHref?: string;
  children?: React.ReactNode;
}

export default function Navbar({ title, backHref, children }: NavbarProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  
  const [mounted, setMounted] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => setMounted(true), []);

  const user = session?.user as any;
  const role = user?.role; 

  return (
    <>
      <div className="pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto sticky top-0 z-40">
        <nav className="bg-white/70 dark:bg-[#1e293b]/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-none rounded-2xl flex flex-col transition-all duration-300 overflow-hidden">
          
          <div className="px-5 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {backHref ? (
                <>
                  <button onClick={() => router.push(backHref)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white dark:hover:bg-primary transition-all duration-300 shadow-sm hover:shadow-md">
                    <ArrowLeft size={18} />
                  </button>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
                  <h1 className="text-lg font-black tracking-tight truncate max-w-[200px] sm:max-w-md bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">
                    {title}
                  </h1>
                </>
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-md">
                    <Hexagon size={22} className="absolute" />
                    <Sparkles size={10} className="absolute mb-3 ml-3 text-yellow-200" />
                  </div>
                  <h1 className="text-xl font-black tracking-tight hidden sm:block bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">
                    Eval<span className="text-primary">Sys</span> 
                  </h1>
                  
                  <div className="hidden sm:flex ml-1">
                    {role === "TEACHER" && (
                      <span className="px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200/50 dark:border-orange-500/20 text-[10px] font-black tracking-wider flex items-center gap-1">
                        <UserCircle size={12} /> TEACHER
                      </span>
                    )}
                    {role === "STUDENT" && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-primary dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/20 text-[10px] font-black tracking-wider flex items-center gap-1">
                        <GraduationCap size={12} /> STUDENT
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3 mr-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200/60 dark:border-slate-800 shadow-sm">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {role === "TEACHER" ? "อาจารย์ผู้สอน" : role === "STUDENT" ? "นักศึกษา" : "กำลังโหลด..."}
                  </span>
                  <span className={`text-sm font-black truncate max-w-[150px] ${role === "TEACHER" ? 'text-orange-600 dark:text-orange-400' : 'text-primary dark:text-blue-400'}`}>
                    {user?.name || "..."}
                  </span>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${role === "TEACHER" ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400' : 'bg-blue-100 text-primary dark:bg-blue-900/50 dark:text-blue-400'}`}>
                  {role === "TEACHER" ? <UserCircle size={18} /> : <GraduationCap size={18} />}
                </div>
              </div>

              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white transition-all duration-300 shadow-sm hover:shadow-md">
                {mounted ? (theme === "dark" ? <Sun size={18} /> : <Moon size={18} />) : null}
              </button>
              <button onClick={() => setShowLogoutModal(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md" title="ออกจากระบบ">
                <LogOut size={18} />
              </button>
            </div>
          </div>

          {children && (
            <div className="px-5 border-t border-slate-200/60 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#0f172a]/50">
              {children}
            </div>
          )}
        </nav>
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">ยืนยันการออกจากระบบ?</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบในขณะนี้</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300">ยกเลิก</button>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors shadow-md">ออกจากระบบ</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}