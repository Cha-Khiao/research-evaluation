"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ArrowLeft, MessageSquare, Star, Users, Download, TrendingUp, TrendingDown } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

interface Question {
  id: string;
  question: string;
  maxScore: number;
}

interface GroupResult {
  groupId: string;
  groupName: string;
  evaluationCount: number;
  averages: Record<string, number>;
  minScores: Record<string, number>;
  maxScores: Record<string, number>;
  totalAverageScore: number;
  comments: string[];
}

export default function ResultsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme } = useTheme();

  const [evaluationForm, setEvaluationForm] = useState<Question[]>([]);
  const [groupResults, setGroupResults] = useState<GroupResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const totalMaxScore = evaluationForm.reduce((sum, q) => sum + q.maxScore, 0);

  useEffect(() => {
    if (status === "authenticated") {
      const teacherId = (session?.user as any)?.id;
      fetch(`/api/teacher/results?teacherId=${teacherId}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          setEvaluationForm(data.evaluationForm);
          setGroupResults(data.groupResults);
          setIsLoading(false);
        })
        .catch(err => {
          toast.error("ไม่สามารถดึงข้อมูลคะแนนได้");
          setIsLoading(false);
        });
    }
  }, [status, session]);

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  // ฟังก์ชันโหลดไฟล์ Excel (CSV)
  const exportToCSV = () => {
    if (groupResults.length === 0) return toast.error("ไม่มีข้อมูลให้ดาวน์โหลด");

    // 1. สร้างหัวตาราง
    const headers = [
      "อันดับ",
      "ชื่อกลุ่ม",
      "จำนวนผู้ประเมิน",
      "คะแนนรวม",
      ...evaluationForm.map(q => `[เฉลี่ย] ${q.question}`),
      "ข้อเสนอแนะทั้งหมด"
    ];

    // 2. สร้างข้อมูลแต่ละแถว
    const rows = groupResults.map((group, index) => {
      const rowData = [
        index + 1,
        `"${group.groupName}"`,
        group.evaluationCount,
        group.totalAverageScore,
        ...evaluationForm.map(q => group.averages[q.id] || 0),
        `"${group.comments.join(" | ")}"` // เอาคอมเมนต์มาต่อกันด้วย |
      ];
      return rowData.join(",");
    });

    // 3. รวมร่างข้อมูล (ใส่ \uFEFF เพื่อให้ Excel อ่านภาษาไทยออก)
    const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
    
    // 4. สั่งดาวน์โหลด
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `evaluation_results_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("ดาวน์โหลดไฟล์ผลการประเมินสำเร็จ!");
  };

  // ฟังก์ชันแปลงข้อมูลสำหรับกราฟใยแมงมุม
  const formatRadarData = (group: GroupResult) => {
    return evaluationForm.map(q => ({
      subject: q.question.substring(0, 15) + "...", // ตัดคำยาวๆ ไม่ให้ล้นจอ
      score: group.averages[q.id] || 0,
      fullMark: q.maxScore,
    }));
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center dark:bg-neutral-950 dark:text-white">กำลังคำนวณผลคะแนน...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 text-gray-900 dark:text-white pb-10">
      
      <header className="bg-white dark:bg-neutral-900 shadow-sm border-b border-gray-200 dark:border-neutral-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/dashboard")} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">ผลการประเมินวิจัยเชิงลึก</h1>
          </div>
          
          {/* ปุ่ม Export CSV */}
          <button 
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {groupResults.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800">
            ยังไม่มีกลุ่มนักศึกษาในระบบ หรือยังไม่มีการประเมิน
          </div>
        ) : (
          <div className="space-y-8">
            {groupResults.map((group, index) => (
              <div key={group.groupId} className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden flex flex-col">
                
                {/* Header ของแต่ละกลุ่ม */}
                <div className="p-6 border-b border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/50 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="bg-primary text-white text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full">
                        {index + 1}
                      </span>
                      <h2 className="text-2xl font-bold">{group.groupName}</h2>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-2 ml-11">
                      <span className="flex items-center gap-1"><Users size={16} /> ประเมินแล้ว {group.evaluationCount} ครั้ง</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">คะแนนเฉลี่ยรวม</p>
                    <p className="text-4xl font-bold text-primary">
                      {group.totalAverageScore} <span className="text-xl text-gray-400">/ {totalMaxScore}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-neutral-800">
                  
                  {/* ฝั่งซ้าย: กราฟ Radar */}
                  <div className="p-6 flex flex-col items-center justify-center min-h-[300px]">
                    <h3 className="font-bold flex items-center gap-2 mb-4 w-full text-left">
                      <TrendingUp size={18} className="text-orange-500"/> มิติการประเมิน
                    </h3>
                    {group.evaluationCount > 0 ? (
                      <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={formatRadarData(group)}>
                            <PolarGrid stroke={theme === 'dark' ? '#404040' : '#e5e7eb'} />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: theme === 'dark' ? '#a3a3a3' : '#6b7280', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                            <Radar name="คะแนนเฉลี่ย" dataKey="score" stroke="#f97316" fill="#f97316" fillOpacity={0.5} />
                            <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff', borderRadius: '8px' }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-gray-400 italic">รอรับการประเมินเพื่อแสดงกราฟ</p>
                    )}
                  </div>

                  {/* ฝั่งขวา: รายละเอียดคะแนน Min/Max/Avg */}
                  <div className="p-6">
                    <h3 className="font-bold flex items-center gap-2 mb-6"><Star size={18} className="text-yellow-500"/> รายละเอียดคะแนน</h3>
                    <div className="space-y-4">
                      {evaluationForm.map((q, i) => (
                        <div key={q.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm border-b border-gray-100 dark:border-neutral-800 pb-3 last:border-0 last:pb-0">
                          <span className="text-gray-700 dark:text-gray-300 font-medium">{i + 1}. {q.question}</span>
                          
                          {group.evaluationCount > 0 ? (
                            <div className="flex items-center gap-3 text-xs bg-gray-50 dark:bg-neutral-900 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-neutral-800">
                              <span className="text-red-500" title="คะแนนต่ำสุด">Min: {group.minScores[q.id]}</span>
                              <span className="text-green-500" title="คะแนนสูงสุด">Max: {group.maxScores[q.id]}</span>
                              <span className="font-bold text-base text-primary ml-2" title="คะแนนเฉลี่ย">{group.averages[q.id]}<span className="text-gray-400 font-normal text-xs">/{q.maxScore}</span></span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ส่วนล่าง: คอมเมนต์ */}
                <div className="p-6 bg-gray-50 dark:bg-neutral-950 border-t border-gray-100 dark:border-neutral-800">
                  <h3 className="font-bold flex items-center gap-2 mb-4"><MessageSquare size={18} className="text-blue-500"/> ข้อเสนอแนะ (ไม่ระบุตัวตน)</h3>
                  {group.comments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {group.comments.map((comment, idx) => (
                        <div key={idx} className="bg-white dark:bg-neutral-900 p-4 rounded-xl text-sm border border-gray-200 dark:border-neutral-800 shadow-sm relative">
                          <span className="absolute top-2 left-2 text-3xl text-gray-200 dark:text-neutral-800 font-serif leading-none">"</span>
                          <p className="text-gray-700 dark:text-gray-300 relative z-10 pl-4">{comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic bg-white dark:bg-neutral-900 p-4 rounded-xl border border-dashed border-gray-200 dark:border-neutral-800 text-center">ไม่มีข้อเสนอแนะเพิ่มเติม</p>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}