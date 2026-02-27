"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { MessageSquare, Download, ChevronDown, ChevronUp, Users, Trophy, Star } from "lucide-react";
import { toast } from "sonner";

interface Question { id: string; question: string; maxScore: number; }
interface GroupResult {
  groupId: string; groupName: string; evaluationCount: number;
  averages: Record<string, number>; minScores: Record<string, number>; maxScores: Record<string, number>;
  totalAverageScore: number; comments: string[];
}

export default function RoomResultsPage() {
  const params = useParams();
  const roomId = params?.roomId as string;

  const [evaluationForm, setEvaluationForm] = useState<Question[]>([]);
  const [groupResults, setGroupResults] = useState<GroupResult[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const totalMaxScore = evaluationForm.reduce((sum, q) => sum + q.maxScore, 0);

  useEffect(() => {
    if (roomId) {
      fetch(`/api/teacher/results?roomId=${roomId}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setEvaluationForm(data.evaluationForm || []);
            setGroupResults(data.groupResults || []);
            setTotalStudents(data.totalStudents || 0); 
          }
          setIsLoading(false);
        }).catch(() => setIsLoading(false));
    }
  }, [roomId]);

  const exportToCSV = () => {
    if (groupResults.length === 0) return toast.error("ไม่มีข้อมูลให้ดาวน์โหลด");
    const headers = ["อันดับ", "ชื่อกลุ่มวิจัย", "จำนวนผู้ประเมิน (คน)", `คะแนนเฉลี่ยรวม (เต็ม ${totalMaxScore})`, ...evaluationForm.map(q => `[เฉลี่ย] ${q.question} (เต็ม ${q.maxScore})`), "ข้อเสนอแนะทั้งหมด"];
    const rows = groupResults.map((group, index) => {
      const rowData = [
        index + 1, `"${group.groupName}"`, group.evaluationCount, group.totalAverageScore,
        ...evaluationForm.map(q => group.averages[q.id] || 0), `"${group.comments.join(" | ")}"`
      ];
      return rowData.join(",");
    });
    const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `room_${roomId}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("ดาวน์โหลดไฟล์ Excel สำเร็จ!");
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return <div className="bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border border-yellow-200/50 dark:border-yellow-500/20"><Trophy size={24} /></div>;
    if (index === 1) return <div className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border border-slate-300/50 dark:border-slate-700/50"><Trophy size={24} /></div>;
    if (index === 2) return <div className="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border border-orange-200/50 dark:border-orange-500/20"><Trophy size={24} /></div>;
    return <div className="w-12 h-12 flex items-center justify-center font-black text-xl text-slate-400 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-slate-200/60 dark:border-slate-800">{index + 1}</div>;
  };

  if (isLoading) return <div className="text-center py-20 text-slate-500">กำลังประมวลผลคะแนน...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/50">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            ผลคะแนนเฉลี่ยเพื่อตัดเกรด
          </h2>
          <p className="text-slate-500 mt-1 text-sm">เรียงลำดับจากคะแนนรวมสูงสุด (รองรับจำนวนข้อประเมินไม่จำกัด)</p>
        </div>
        <button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95 text-sm">
          <Download size={18} /> Export Excel
        </button>
      </div>

      {groupResults.length === 0 ? (
        <div className="text-center py-20 text-slate-500 bg-white dark:bg-[#1e293b] rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center">
          <Trophy size={56} className="text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-xl font-bold text-slate-700 dark:text-slate-300">ยังไม่มีข้อมูลการประเมิน</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupResults.map((group, index) => {
            const isExpanded = expandedGroup === group.groupId;
            const evaluatedPercentage = totalStudents > 0 ? (group.evaluationCount / totalStudents) * 100 : 0;

            return (
              <div key={group.groupId} className={`bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border transition-all duration-300 ${isExpanded ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200/60 dark:border-slate-700/50 hover:border-primary/50 dark:hover:border-primary/50'}`}>
                
                <div onClick={() => setExpandedGroup(isExpanded ? null : group.groupId)} className="flex flex-col sm:flex-row items-center gap-4 p-5 sm:p-6 cursor-pointer select-none">
                  <div className="flex items-center gap-5 w-full sm:w-auto flex-1">
                    <div className="shrink-0">{getRankBadge(index)}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-slate-800 dark:text-white line-clamp-1">{group.groupName}</h3>
                      <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                        <Users size={14} className="text-blue-500" /> 
                        <span>ประเมินโดย <strong className="text-slate-800 dark:text-slate-200">{group.evaluationCount} / {totalStudents}</strong> คน</span>
                        <div className="w-20 h-1.5 bg-slate-100 dark:bg-[#0f172a] rounded-full ml-1 overflow-hidden hidden sm:block">
                           <div className="h-full bg-blue-500 rounded-full" style={{ width: `${evaluatedPercentage}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:gap-8 border-t border-slate-100 dark:border-slate-800 sm:border-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
                    <div className="text-left sm:text-right">
                      <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">คะแนนเฉลี่ย</p>
                      <p className="text-3xl font-black text-primary leading-none">
                        {group.totalAverageScore} <span className="text-base font-bold text-slate-300 dark:text-slate-600">/ {totalMaxScore}</span>
                      </p>
                    </div>
                    <div className={`p-2.5 rounded-xl transition-all duration-300 ${isExpanded ? 'bg-orange-50 dark:bg-orange-500/10 text-primary rotate-180' : 'bg-slate-50 dark:bg-[#0f172a] text-slate-400'}`}>
                      <ChevronDown size={20} />
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#0f172a]/50 rounded-b-3xl">
                    <div className="p-6 md:p-8">
                      <h4 className="font-bold flex items-center gap-2 mb-5 text-slate-800 dark:text-slate-200">
                        <Star size={18} className="text-yellow-500" /> รายละเอียดคะแนนเฉลี่ยแต่ละหัวข้อ
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2 pb-2 custom-scrollbar">
                        {evaluationForm.map((q, i) => {
                          const avgScore = group.averages[q.id] || 0;
                          const percentage = (avgScore / q.maxScore) * 100;
                          return (
                            <div key={q.id} className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform">
                              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-4 line-clamp-2" title={q.question}>
                                <span className="font-black text-primary mr-1">{i + 1}.</span> {q.question}
                              </p>
                              <div>
                                <div className="flex justify-between items-end mb-2">
                                  <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">{avgScore.toFixed(2)}</span>
                                  <span className="text-xs font-bold text-slate-400">เต็ม {q.maxScore}</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                  <div className={`h-full rounded-full ${percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${percentage}%` }}></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-6 md:p-8 border-t border-slate-200/60 dark:border-slate-800">
                      <h4 className="font-bold flex items-center gap-2 mb-5 text-slate-800 dark:text-slate-200">
                        <MessageSquare size={18} className="text-blue-500" /> ข้อเสนอแนะจากผู้ประเมิน
                      </h4>
                      {group.comments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {group.comments.map((comment, idx) => (
                            <div key={idx} className="bg-white dark:bg-[#1e293b] px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm shadow-sm relative">
                              <span className="absolute top-2 left-3 text-3xl text-slate-200 dark:text-slate-700 font-serif">"</span>
                              <p className="relative z-10 pl-4 leading-relaxed text-slate-600 dark:text-slate-300 font-medium">{comment}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic bg-white dark:bg-[#1e293b] px-5 py-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 inline-block">
                          ไม่มีข้อเสนอแนะแบบพิมพ์ข้อความ
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}