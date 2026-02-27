"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogIn, Search, ArrowRight, BookOpen } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar"; // 👈 Import Navbar

export default function StudentDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  
  const [enrolledRooms, setEnrolledRooms] = useState<any[]>([]);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      const user = session?.user as any;
      if (user?.role === "TEACHER") return router.push("/dashboard");

      fetch(`/api/student/rooms?studentId=${user?.id}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setEnrolledRooms(data.rooms);
            setUserGroups(data.groups);
          }
          setIsLoading(false);
        }).catch(() => setIsLoading(false));
    }
  }, [status, session]);

  if (status === "unauthenticated") { router.push("/login"); return null; }

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return toast.error("กรุณากรอกรหัสเข้าห้อง 6 หลัก");

    setIsJoining(true);
    try {
      const studentId = (session?.user as any)?.id;
      const response = await fetch("/api/student/rooms", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode: joinCode.trim(), studentId }) 
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success("พบห้องเรียนแล้ว! กำลังพาท่านเข้าสู่ห้อง...");
      router.push(`/student/room/${data.roomId}`); 
    } catch (error: any) { toast.error(error.message || "รหัสห้องไม่ถูกต้อง"); } 
    finally { setIsJoining(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 pb-10 font-sans selection:bg-primary/30">
      
      {/* ✨ เรียกใช้ Navbar สำหรับนักศึกษา */}
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {isLoading ? (
          <div className="text-center py-20 text-slate-500">กำลังโหลดข้อมูล...</div>
        ) : enrolledRooms.length === 0 ? (
          <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] p-8 sm:p-14 text-center shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-200/60 dark:border-slate-700/50 relative overflow-hidden mt-10 max-w-3xl mx-auto">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-primary/10 dark:bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl"></div>

            <div className="relative z-10 max-w-lg mx-auto space-y-6">
              <div className="w-20 h-20 bg-primary/10 dark:bg-primary/20 text-primary rounded-3xl flex items-center justify-center mx-auto mb-8 transform -rotate-6 shadow-inner">
                <Search size={40} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">เริ่มต้นการประเมิน</h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg">กรุณากรอกรหัสเข้าห้อง 6 หลัก ที่ได้รับจากอาจารย์ประจำวิชา</p>
              
              <form onSubmit={handleJoinRoom} className="flex flex-col sm:flex-row gap-3 pt-6">
                <input
                  type="text" maxLength={6} value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="รหัส 6 หลัก (เช่น A1B2C3)"
                  className="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] focus:border-primary focus:ring-4 focus:ring-primary/20 text-center sm:text-left text-2xl font-mono font-bold tracking-widest transition-all uppercase"
                />
                <button type="submit" disabled={isJoining || joinCode.length < 6} className="bg-primary hover:bg-primary-hover text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg hover:shadow-primary/40 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95">
                  {isJoining ? "ตรวจสอบ..." : <><LogIn size={24} /> เข้าร่วม</>}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/50">
              <div>
                <h3 className="text-2xl font-black flex items-center gap-2 text-slate-900 dark:text-white tracking-tight">
                  <BookOpen className="text-primary" size={28} /> รายวิชาของคุณ
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 ml-9">คลิกที่การ์ดเพื่อจัดการโปรเจกต์และประเมินเพื่อน</p>
              </div>

              <form onSubmit={handleJoinRoom} className="flex gap-2 w-full md:w-auto">
                <input
                  type="text" maxLength={6} value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="รหัส 6 หลัก"
                  className="w-full md:w-48 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-[#0f172a] focus:ring-2 focus:ring-primary text-center font-mono font-bold tracking-widest uppercase transition-all"
                />
                <button type="submit" disabled={isJoining || joinCode.length < 6} className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap">
                  {isJoining ? "..." : <><LogIn size={18} /> เข้าร่วมเพิ่ม</>}
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {enrolledRooms.map(room => {
                const myGroup = userGroups.find(g => g.roomId === room._id);
                return (
                  <div 
                    key={room._id} 
                    onClick={() => router.push(`/student/room/${room._id}`)}
                    className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 border border-slate-200/60 dark:border-slate-700/50 shadow-sm hover:shadow-xl hover:border-primary/50 dark:hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between min-h-[180px] relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors"></div>
                    <div className="relative z-10">
                      <h4 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-2 text-slate-800 dark:text-slate-100">{room.name}</h4>
                      {myGroup ? (
                        <div className="mt-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">โปรเจกต์ที่ลงทะเบียน:</p>
                          <p className="text-sm font-bold text-primary dark:text-blue-400 line-clamp-1">{myGroup.name}</p>
                        </div>
                      ) : (
                        <div className="mt-3 bg-red-50 dark:bg-red-500/10 p-3 rounded-xl border border-red-100 dark:border-red-500/20">
                          <p className="text-xs text-red-500 font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> ยังไม่ได้ลงทะเบียนโปรเจกต์
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end mt-4 relative z-10">
                      <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-[#0f172a] flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">
                        <ArrowRight size={18} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}