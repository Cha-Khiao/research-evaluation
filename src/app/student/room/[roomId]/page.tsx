"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Users, ShieldAlert, CheckCircle2, ClipboardEdit, Plus, Save, Send, UserMinus, UserPlus, User, Star, BookOpen } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar"; // 👈 Import Navbar

export default function StudentRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const roomId = params?.roomId as string;

  const [room, setRoom] = useState<any>(null);
  const [myGroup, setMyGroup] = useState<any>(null);
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [evaluatedGroupIds, setEvaluatedGroupIds] = useState<string[]>([]);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [viewTab, setViewTab] = useState("dashboard"); 

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const [memberToKick, setMemberToKick] = useState<{ id: string, name: string } | null>(null);

  const [evaluatingGroup, setEvaluatingGroup] = useState<any>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const studentId = (session?.user as any)?.id;

  const fetchData = () => {
    if (status === "authenticated" && roomId && studentId) {
      fetch(`/api/student/room?roomId=${roomId}&studentId=${studentId}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setRoom(data.room);
            setMyGroup(data.myGroup);
            setAllGroups(data.allGroups || []);
            setEvaluatedGroupIds(data.evaluatedGroupIds || []);
            setAvailableStudents(data.availableStudents || []);
            setAllStudents(data.allStudents || []);
          }
          setIsLoading(false);
        }).catch(() => setIsLoading(false));
    }
  };

  useEffect(() => { fetchData(); }, [status, roomId, studentId]);

  if (status === "unauthenticated") { router.push("/login"); return null; }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return toast.error("กรุณาตั้งชื่อโปรเจกต์");
    try {
      const response = await fetch("/api/student/room", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, name: newGroupName, leaderId: studentId, members: selectedMembers })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success("ลงทะเบียนโปรเจกต์สำเร็จ!");
      setShowCreateModal(false); setNewGroupName(""); setSelectedMembers([]); fetchData();
    } catch (error: any) { toast.error(error.message); }
  };

  const handleManageMember = async (action: "ADD" | "KICK", memberId: string) => {
    try {
      const response = await fetch("/api/student/room", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: myGroup._id, action, memberId, leaderId: studentId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success(data.message); setMemberToKick(null); fetchData();
    } catch (error: any) { toast.error(error.message); }
  };

  const handleScoreChange = (questionId: string, score: number) => setScores(prev => ({ ...prev, [questionId]: score }));

  const handleSubmitEvaluation = async () => {
    const unanswered = room.evaluationForm.filter((q: any) => !scores[q.id]);
    if (unanswered.length > 0) return toast.error("กรุณาให้คะแนนให้ครบทุกข้อ");

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/student/evaluate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, targetGroupId: evaluatingGroup._id, evaluatorId: studentId, scores, comment })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success("ส่งผลการประเมินเรียบร้อยแล้ว!");
      setEvaluatedGroupIds(prev => [...prev, evaluatingGroup._id]);
      setEvaluatingGroup(null); setScores({}); setComment("");
    } catch (error: any) { toast.error(error.message); }
    finally { setIsSubmitting(false); }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b1120] text-slate-500">กำลังโหลดข้อมูลห้องเรียน...</div>;
  if (!room) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b1120] text-red-500 font-bold text-xl">ไม่พบข้อมูลห้องเรียน</div>;

  const groupsToEvaluate = allGroups.filter(g => g._id !== myGroup?._id);
  const isLeader = myGroup?.leaderId === studentId;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 pb-10 font-sans selection:bg-primary/30">
      
      {/* ✨ ส่ง Props เข้า Navbar เพื่อทำปุ่มย้อนกลับและ Tab */}
      <Navbar backHref="/student" title={`ห้อง: ${room.name}`}>
        <div className="flex gap-6">
          <button onClick={() => setViewTab("dashboard")} className={`pb-3 pt-3 font-bold text-sm transition-all border-b-2 ${viewTab === "dashboard" ? "text-primary border-primary" : "text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300"}`}>
            แดชบอร์ดการประเมิน
          </button>
          <button onClick={() => setViewTab("members")} className={`pb-3 pt-3 font-bold text-sm transition-all border-b-2 ${viewTab === "members" ? "text-primary border-primary" : "text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300"}`}>
            รายชื่อเพื่อนทั้งหมด
          </button>
        </div>
      </Navbar>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {viewTab === "dashboard" && (
          <>
            {!myGroup ? (
              <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] p-10 sm:p-14 border border-slate-200/60 dark:border-slate-700/50 shadow-xl shadow-slate-200/40 dark:shadow-none text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <BookOpen size={64} className="mx-auto text-orange-400 mb-6 drop-shadow-md" />
                  <h2 className="text-2xl font-black mb-3 text-slate-800 dark:text-white">คุณยังไม่ได้ลงทะเบียนโปรเจกต์</h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-lg mx-auto">หากคุณทำงานคนเดียว สามารถกดสร้างโปรเจกต์เดี่ยวได้เลย หรือถ้าทำงานกลุ่มให้กดสร้างแล้วดึงเพื่อนเข้ากลุ่ม</p>
                  <button onClick={() => setShowCreateModal(true)} className="bg-primary hover:bg-primary-hover text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg hover:shadow-primary/30 inline-flex items-center gap-2 active:scale-95">
                    <Plus size={20} /> ลงทะเบียนโปรเจกต์ (กลุ่ม/งานเดี่ยว)
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gradient-to-br from-white to-slate-50 dark:from-[#1e293b] dark:to-[#0f172a] rounded-3xl p-6 md:p-8 border border-slate-200/80 dark:border-slate-700/50 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl"></div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 relative z-10">
                    <div>
                      <p className="text-sm text-primary dark:text-blue-400 font-bold mb-1.5 flex items-center gap-1.5"><BookOpen size={16}/> โปรเจกต์ของคุณ</p>
                      <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{myGroup.name}</h2>
                    </div>
                    {isLeader && <span className="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 text-xs font-bold px-4 py-2 rounded-xl border border-orange-200/50 dark:border-orange-500/20 shadow-sm">ผู้รับผิดชอบหลัก</span>}
                  </div>
                  
                  <div className="space-y-4 bg-slate-100/50 dark:bg-[#0b1120]/50 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 relative z-10">
                    <h4 className="font-bold text-sm text-slate-500 dark:text-slate-400 mb-3">รายชื่อผู้จัดทำ:</h4>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 bg-white dark:bg-[#1e293b] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <ShieldAlert size={16} className="text-orange-500"/> <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{myGroup.leader.name}</span>
                      </div>
                      {myGroup.members.map((member: any, index: number) => (
                        <div key={member._id || `m-${index}`} className="flex items-center gap-2 bg-white dark:bg-[#1e293b] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm group relative pr-10">
                          <User size={16} className="text-slate-400"/> <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{member.name}</span>
                          {isLeader && (
                            <button 
                              onClick={() => setMemberToKick({ id: member._id, name: member.name })} 
                              className="absolute right-1.5 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" 
                              title="ลบออกจากโปรเจกต์"
                            >
                              <UserMinus size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                      {myGroup.members.length === 0 && (
                        <span className="text-xs text-slate-500 flex items-center ml-2 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-lg bg-slate-50 dark:bg-[#0f172a]">
                          (โปรเจกต์เดี่ยว)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isLeader && (
                  <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 border border-slate-200/60 dark:border-slate-700/50 shadow-sm flex flex-col">
                    <h3 className="font-black text-lg mb-1 flex items-center gap-2 text-slate-800 dark:text-white"><UserPlus size={18} className="text-primary"/> เพิ่มเพื่อนร่วมงาน</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">ถ้าคุณทำงานคนเดียว ให้ข้ามส่วนนี้ไปได้เลย</p>
                    <div className="flex-1 overflow-y-auto max-h-48 pr-2 space-y-2 custom-scrollbar">
                      {availableStudents.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-sm text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">ไม่มีเพื่อนว่างให้ดึงแล้ว</div>
                      ) : (
                        availableStudents.map(student => (
                          <div key={student._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-colors">
                            <div className="truncate max-w-[150px]">
                              <p className="text-sm font-bold truncate text-slate-700 dark:text-slate-300">{student.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{student.email}</p>
                            </div>
                            <button onClick={() => handleManageMember("ADD", student._id)} className="text-primary hover:text-white hover:bg-primary bg-primary/10 dark:bg-primary/20 dark:text-blue-400 dark:hover:bg-primary px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                              เพิ่ม
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {myGroup && (
              <div className="pt-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
                  <div>
                    <h3 className="text-2xl font-black flex items-center gap-2 tracking-tight text-slate-800 dark:text-white"><ClipboardEdit className="text-primary" size={24} /> ประเมินผลโปรเจกต์เพื่อน</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">คลิกที่การ์ดเพื่อทำแบบประเมิน (ไม่สามารถประเมินโปรเจกต์ตัวเองได้)</p>
                  </div>
                  <div className="bg-white dark:bg-[#1e293b] px-5 py-2.5 rounded-xl font-bold text-sm border border-slate-200/60 dark:border-slate-700/50 shadow-sm flex items-center gap-2">
                    ความคืบหน้า: <span className="text-primary text-lg">{evaluatedGroupIds.length}</span> / {groupsToEvaluate.length}
                  </div>
                </div>
                
                {groupsToEvaluate.length === 0 ? (
                  <div className="text-center py-20 bg-white dark:bg-[#1e293b] rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 shadow-sm">
                    <Users size={56} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">ยังไม่มีโปรเจกต์เพื่อน</h3>
                    <p className="text-slate-500 dark:text-slate-400">รอให้เพื่อนๆ ในห้องสร้างโปรเจกต์ก่อน จึงจะสามารถประเมินได้</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {groupsToEvaluate.map(group => {
                      const isEvaluated = evaluatedGroupIds.includes(group._id);
                      
                      return (
                        <div key={group._id} className={`rounded-3xl border shadow-sm flex flex-col justify-between transition-all duration-300 overflow-hidden ${isEvaluated ? 'bg-slate-50/50 dark:bg-[#0f172a]/50 border-slate-200 dark:border-slate-800 opacity-70 grayscale-[20%]' : 'bg-white dark:bg-[#1e293b] border-slate-200/60 dark:border-slate-700/50 hover:border-primary/50 hover:shadow-xl hover:-translate-y-1'}`}>
                          <div className="p-6 flex-1">
                            <div className="flex justify-between items-start mb-5">
                              <h4 className={`font-black text-lg line-clamp-2 pr-2 ${isEvaluated ? 'text-slate-600 dark:text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>{group.name}</h4>
                              {isEvaluated && <span className="bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 shrink-0 border border-green-200/50 dark:border-green-500/20"><CheckCircle2 size={12}/> เสร็จสิ้น</span>}
                            </div>
                            
                            <div className="space-y-2">
                              <p className="text-xs font-bold text-slate-400 mb-2">ผู้จัดทำ:</p>
                              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><ShieldAlert size={14} className="text-orange-400"/> {group.leader.name}</div>
                              {group.members.slice(0, 3).map((m:any, i:number) => (
                                <div key={m._id || `m-${i}`} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 ml-0.5"><User size={14}/> {m.name}</div>
                              ))}
                              {group.members.length > 3 && <p className="text-xs text-slate-400 italic mt-1 ml-5">และอีก {group.members.length - 3} คน...</p>}
                            </div>
                          </div>
                          
                          <div className={`p-4 border-t ${isEvaluated ? 'border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-[#0b1120]/50' : 'border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-[#0f172a]'}`}>
                            {!isEvaluated ? (
                              <button onClick={() => setEvaluatingGroup(group)} className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl transition-all text-sm flex justify-center items-center gap-2 shadow-md active:scale-95">
                                <Star size={16} /> ประเมินโปรเจกต์นี้
                              </button>
                            ) : (
                              <button disabled className="w-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold py-3 rounded-xl text-sm flex justify-center items-center gap-2 cursor-not-allowed border border-slate-300 dark:border-slate-700">
                                <CheckCircle2 size={16} /> ประเมินเรียบร้อยแล้ว
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {viewTab === "members" && (
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 bg-slate-50/50 dark:bg-[#0f172a]/50 border-b border-slate-200/60 dark:border-slate-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-black text-xl text-slate-800 dark:text-white">รายชื่อเพื่อนทั้งหมดในระบบ</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">นักศึกษาทั้งหมดที่กรอกรหัสเข้าร่วมห้องเรียนนี้</p>
              </div>
              <div className="bg-white dark:bg-[#1e293b] px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 shadow-sm text-primary">
                รวมทั้งหมด {allStudents.length} คน
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-[#0f172a] text-slate-500 dark:text-slate-400 border-b border-slate-200/60 dark:border-slate-700/50">
                  <tr>
                    <th className="px-8 py-5 font-bold w-20 text-center">ลำดับ</th>
                    <th className="px-8 py-5 font-bold">ชื่อ-นามสกุล</th>
                    <th className="px-8 py-5 font-bold">อีเมล (Email)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {allStudents.map((user: any, index: number) => (
                    <tr key={user._id} className="hover:bg-slate-50 dark:hover:bg-[#0f172a]/50 transition-colors">
                      <td className="px-8 py-5 text-center text-slate-500 font-medium">{index + 1}</td>
                      <td className="px-8 py-5 font-bold flex items-center gap-3 text-slate-700 dark:text-slate-200">
                        <div className="w-9 h-9 rounded-full bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center"><User size={16}/></div>
                        {user.name}
                        {user._id === studentId && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-md font-bold ml-2 shadow-sm">ฉันเอง</span>}
                      </td>
                      <td className="px-8 py-5 text-slate-500 dark:text-slate-400">{user.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modals ยืนยันเตะเพื่อน */}
      {memberToKick && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="text-red-500" /> ยืนยันการนำออก?
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
              คุณต้องการนำ <span className="font-bold text-red-500">{memberToKick.name}</span> ออกจากโปรเจกต์ใช่หรือไม่?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setMemberToKick(null)} className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">ยกเลิก</button>
              <button onClick={() => handleManageMember("KICK", memberToKick.id)} className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors shadow-md">ยืนยันนำออก</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: สร้างกลุ่ม */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 my-8 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-[#0f172a]/50">
              <h3 className="text-xl font-black flex items-center gap-2 text-slate-800 dark:text-white"><Plus className="text-primary"/> ลงทะเบียนโปรเจกต์</h3>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">ชื่อโปรเจกต์ <span className="text-red-500">*</span></label>
                <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="ระบุชื่อโปรเจกต์ของคุณ" className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0f172a] focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
                  เชิญเพื่อนร่วมทีม <br/>
                  <span className="text-slate-400 font-normal text-xs">(หากทำงานคนเดียว ให้เว้นว่างไว้แล้วกดข้ามได้เลย)</span>
                </label>
                <div className="h-48 overflow-y-auto bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-2 space-y-1 custom-scrollbar">
                  {availableStudents.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-slate-400">ยังไม่มีเพื่อนว่างในห้องนี้</div>
                  ) : availableStudents.map(student => (
                    <label key={student._id} className="flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-[#1e293b] rounded-lg cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all">
                      <input 
                        type="checkbox" checked={selectedMembers.includes(student._id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedMembers([...selectedMembers, student._id]);
                          else setSelectedMembers(selectedMembers.filter(id => id !== student._id));
                        }}
                        className="w-5 h-5 text-primary rounded border-slate-300 dark:border-slate-600 focus:ring-primary bg-white dark:bg-[#0f172a]"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{student.name}</p>
                        <p className="text-[10px] text-slate-500">{student.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3 bg-slate-50/50 dark:bg-[#0f172a]/50">
              <button onClick={() => {setShowCreateModal(false); setSelectedMembers([]); setNewGroupName("")}} className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300">ยกเลิก</button>
              <button onClick={handleCreateGroup} className="flex-1 px-4 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold transition-colors flex justify-center items-center gap-2 shadow-md"><Save size={18}/> ยืนยันข้อมูล</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ประเมินเพื่อน */}
      {evaluatingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 my-8 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0f172a]/50 sticky top-0 z-20 backdrop-blur-md">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">ประเมินผล: <span className="text-primary">{evaluatingGroup.name}</span></h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">ข้อมูลของคุณจะถูกเก็บเป็นความลับ อาจารย์เท่านั้นที่สามารถตรวจสอบได้</p>
            </div>

            <div className="p-6 md:p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {room.evaluationForm.map((q: any, index: number) => (
                <div key={q.id} className="space-y-4">
                  <label className="block text-base font-bold text-slate-800 dark:text-slate-200">
                    <span className="text-primary mr-2">{index + 1}.</span> 
                    {q.question} <span className="text-xs text-slate-400 font-normal ml-2">(เต็ม {q.maxScore})</span>
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {Array.from({ length: q.maxScore }, (_, i) => i + 1).map(score => (
                      <button
                        key={score}
                        onClick={() => handleScoreChange(q.id, score)}
                        className={`w-12 h-12 rounded-xl font-black text-base transition-all duration-200 ${
                          scores[q.id] === score 
                            ? 'bg-primary text-white ring-4 ring-primary/20 scale-110 shadow-lg' 
                            : 'bg-slate-100 dark:bg-[#0f172a] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <label className="block font-bold text-slate-800 dark:text-slate-200">ข้อเสนอแนะเพิ่มเติม (ถ้ามี)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="พิมพ์คำชมเชย หรือข้อเสนอแนะเพื่อการพัฒนา..."
                  className="w-full px-5 py-4 rounded-2xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-[#0f172a] focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none h-28 transition-all"
                ></textarea>
              </div>
            </div>

            <div className="p-6 md:p-8 border-t border-slate-100 dark:border-slate-800 flex gap-4 bg-slate-50/50 dark:bg-[#0f172a]/50">
              <button onClick={() => setEvaluatingGroup(null)} className="flex-1 px-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">ยกเลิก</button>
              <button onClick={handleSubmitEvaluation} disabled={isSubmitting} className="flex-1 px-4 py-3.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition-all flex justify-center items-center gap-2 disabled:opacity-50 shadow-md active:scale-95">
                {isSubmitting ? "กำลังส่งข้อมูล..." : <><Send size={18} /> ยืนยันส่งผลการประเมิน</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}