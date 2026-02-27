"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, FolderOpen, Key } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar"; // 👈 Import Navbar เข้ามา

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [newRoomName, setNewRoomName] = useState("");
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);

  const fetchRooms = () => {
    if (status === "authenticated") {
      const user = session?.user as any;
      if (user?.role === "STUDENT") return router.push("/student");

      fetch(`/api/teacher/rooms?teacherId=${user?.id}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) setRooms(data);
          setIsLoading(false);
        }).catch(() => setIsLoading(false));
    }
  };

  useEffect(() => { fetchRooms(); }, [status, session]);

  if (status === "unauthenticated") { router.push("/login"); return null; }

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return toast.error("กรุณาตั้งชื่อห้องเรียน");
    try {
      const response = await fetch("/api/teacher/rooms", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoomName, teacherId: (session?.user as any)?.id })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success("สร้างห้องเรียนสำเร็จ รหัสเข้าห้องคือ: " + data.room.joinCode);
      setShowCreateModal(false); setNewRoomName(""); fetchRooms();
    } catch (error: any) { toast.error(error.message); }
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    try {
      const response = await fetch(`/api/teacher/rooms?roomId=${roomToDelete}`, { method: "DELETE" });
      if (!response.ok) throw new Error("ลบไม่สำเร็จ");
      toast.success("ลบห้องเรียนเรียบร้อยแล้ว");
      setShowDeleteModal(false); setRoomToDelete(null); fetchRooms();
    } catch (error) { toast.error("เกิดข้อผิดพลาด"); }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 pb-10 font-sans selection:bg-primary/30">
      
      {/* ✨ เรียกใช้ Navbar ที่เราสร้างไว้ แค่บรรทัดเดียวจบ! */}
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight">ห้องเรียนของคุณ</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">จัดการห้องเรียน แบบฟอร์มประเมิน และดูผลคะแนนได้ที่นี่</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="bg-primary hover:bg-primary-hover text-white px-5 py-3 rounded-xl flex items-center gap-2 font-bold transition-all shadow-md hover:shadow-primary/30 active:scale-95">
            <Plus size={20} /> สร้างห้องเรียนใหม่
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-slate-500">กำลังโหลดข้อมูลห้องเรียน...</div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#1e293b] rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 shadow-sm">
            <FolderOpen size={56} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">ยังไม่มีห้องเรียน</h3>
            <p className="text-slate-500 dark:text-slate-400">กดปุ่ม "สร้างห้องเรียนใหม่" ด้านบนเพื่อเริ่มต้นใช้งาน</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div key={room._id} onClick={() => router.push(`/dashboard/room/${room._id}`)} className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/50 flex flex-col overflow-hidden hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                <div className="p-6 flex-1 relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-primary/5 dark:bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
                  <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-white group-hover:text-primary transition-colors relative z-10">{room.name}</h3>
                  <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-lg text-sm font-mono font-bold tracking-widest border border-orange-100 dark:border-orange-500/20 relative z-10">
                    <Key size={14} /> {room.joinCode}
                  </div>
                </div>
                <div className="px-6 py-4 bg-slate-50/50 dark:bg-[#0f172a]/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center relative z-10">
                  <span className="text-xs font-medium text-slate-400">เปิดเมื่อ: {new Date(room.createdAt).toLocaleDateString("th-TH")}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setRoomToDelete(room._id); setShowDeleteModal(true); }}
                    className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modals ยืนยันต่างๆ (คงเดิม) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold mb-4">สร้างห้องเรียนใหม่</h3>
            <input type="text" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} placeholder="เช่น วิศวกรรมซอฟต์แวร์ เซค 1" className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0f172a] focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all mb-6" autoFocus />
            <div className="flex gap-3">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">ยกเลิก</button>
              <button onClick={handleCreateRoom} className="flex-1 px-4 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold transition-colors shadow-md">ยืนยันสร้าง</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold mb-2">ยืนยันการลบห้องเรียน?</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">การลบห้องจะทำให้ข้อมูลกลุ่มและผลการประเมินสูญหายอย่างถาวร</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">ยกเลิก</button>
              <button onClick={handleDeleteRoom} className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors shadow-md">ยืนยันลบข้อมูล</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}