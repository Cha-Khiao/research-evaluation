"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Users, ShieldAlert, User, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function TeacherMembersPage() {
  const params = useParams();
  const roomId = params?.roomId as string;

  const [members, setMembers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 🚨 เพิ่ม State สำหรับควบคุม Tab
  const [viewTab, setViewTab] = useState<"groups" | "all">("groups");

  const fetchData = () => {
    fetch(`/api/teacher/room/members?roomId=${roomId}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setMembers(data.allMembers || []);
          setGroups(data.groupMembers || []);
        }
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
  };

  useEffect(() => { if (roomId) fetchData(); }, [roomId]);

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("ยืนยันการลบกลุ่มนี้ใช่หรือไม่? (การประเมินที่เกี่ยวข้องทั้งหมดจะถูกลบด้วย)")) return;
    
    try {
      const response = await fetch(`/api/teacher/room/members?groupId=${groupId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("ลบไม่สำเร็จ");
      toast.success("ลบกลุ่มเรียบร้อยแล้ว");
      fetchData();
    } catch (error) { toast.error("เกิดข้อผิดพลาด"); }
  };

  if (isLoading) return <div className="text-center py-20 text-slate-500">กำลังโหลดข้อมูล...</div>;

  const groupedStudentIds = new Set<string>();
  groups.forEach(g => {
    groupedStudentIds.add(g.leader._id);
    g.members.forEach((m: any) => groupedStudentIds.add(m._id));
  });

  return (
    <div className="space-y-6">
      
      {/* 🚨 ส่วนหัวพร้อมเมนู Tabs */}
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 bg-slate-50/50 dark:bg-[#0f172a]/50">
          <h3 className="font-black text-2xl text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="text-primary" /> จัดการสมาชิก
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            ดูรายชื่อนักศึกษาที่ลงทะเบียนในรายวิชา และจัดการกลุ่มโปรเจกต์
          </p>
        </div>
        
        {/* เมนูย่อย (Tabs) */}
        <div className="px-6 md:px-8 flex gap-6 border-t border-slate-200/60 dark:border-slate-700/50 bg-white dark:bg-[#1e293b]">
          <button 
            onClick={() => setViewTab("groups")} 
            className={`pb-4 pt-4 font-bold text-sm transition-all border-b-2 ${viewTab === "groups" ? "text-primary border-primary" : "text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300"}`}
          >
            รายชื่อกลุ่ม / โปรเจกต์
          </button>
          <button 
            onClick={() => setViewTab("all")} 
            className={`pb-4 pt-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${viewTab === "all" ? "text-primary border-primary" : "text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300"}`}
          >
            นักศึกษาทั้งหมด <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md text-xs">{members.length}</span>
          </button>
        </div>
      </div>

      {/* 🚨 Tab 1: แสดงรายชื่อกลุ่ม */}
      {viewTab === "groups" && (
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm p-6 md:p-8">
          <div className="mb-6 flex justify-between items-center">
            <h3 className="font-black text-xl text-slate-800 dark:text-white flex items-center gap-2">
              <BookOpen className="text-blue-500" /> โปรเจกต์ของนักศึกษา
            </h3>
          </div>

          {groups.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              <BookOpen size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 font-bold">ยังไม่มีการสร้างกลุ่มหรือโปรเจกต์</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {groups.map(group => (
                <div key={group.groupId} className="bg-slate-50 dark:bg-[#0f172a] rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-black text-lg text-slate-800 dark:text-slate-100 line-clamp-1">{group.groupName}</h4>
                      <button onClick={() => handleDeleteGroup(group.groupId)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-1.5 rounded-lg transition-colors ml-2" title="ลบกลุ่ม">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400">สมาชิก:</p>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-2 bg-white dark:bg-[#1e293b] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                          <ShieldAlert size={14} className="text-orange-500"/> <span className="font-bold text-xs text-slate-700 dark:text-slate-200">{group.leader.name}</span>
                        </div>
                        {group.members.map((member: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 bg-white dark:bg-[#1e293b] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                            <User size={14} className="text-slate-400"/> <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{member.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {group.members.length === 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-bold text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-md">งานเดี่ยว</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 🚨 Tab 2: แสดงรายชื่อนักศึกษาทั้งหมด */}
      {viewTab === "all" && (
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 bg-slate-50/50 dark:bg-[#0f172a]/50 border-b border-slate-200/60 dark:border-slate-700/50">
            <h3 className="font-black text-xl text-slate-800 dark:text-white flex items-center gap-2">
              <Users className="text-blue-500" /> รายชื่อนักศึกษาที่ลงทะเบียน ({members.length} คน)
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">นักศึกษาทั้งหมดที่กรอกรหัสเข้าห้องนี้เรียบร้อยแล้ว</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-[#0f172a] text-slate-500 dark:text-slate-400 border-b border-slate-200/60 dark:border-slate-700/50">
                <tr>
                  <th className="px-8 py-5 font-bold w-20 text-center">ลำดับ</th>
                  <th className="px-8 py-5 font-bold">ชื่อ-นามสกุล</th>
                  <th className="px-8 py-5 font-bold">อีเมลสถาบัน</th>
                  <th className="px-8 py-5 font-bold text-center">สถานะโปรเจกต์</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {members.map((user: any, index: number) => {
                  const hasGroup = groupedStudentIds.has(user._id);
                  return (
                    <tr key={user._id} className="hover:bg-slate-50 dark:hover:bg-[#0f172a]/50 transition-colors">
                      <td className="px-8 py-5 text-center text-slate-500 font-medium">{index + 1}</td>
                      <td className="px-8 py-5 font-bold flex items-center gap-3 text-slate-700 dark:text-slate-200">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${hasGroup ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400 border border-green-200/50 dark:border-green-800/50' : 'bg-red-50 text-red-500 dark:bg-red-500/10 border border-red-200/50 dark:border-red-800/50'}`}>
                          <User size={16}/>
                        </div>
                        {user.name}
                      </td>
                      <td className="px-8 py-5 text-slate-500 dark:text-slate-400">{user.email}</td>
                      <td className="px-8 py-5 text-center">
                        {hasGroup ? (
                          <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 rounded-md text-xs font-bold border border-green-200 dark:border-green-800/50">มีกลุ่มแล้ว</span>
                        ) : (
                          <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-3 py-1 rounded-md text-xs font-bold border border-red-200 dark:border-red-800/50 animate-pulse">ยังไม่มีกลุ่ม</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {members.length === 0 && (
              <div className="text-center py-10 text-slate-500">
                ยังไม่มีนักศึกษาเข้าร่วมห้องเรียนนี้
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}