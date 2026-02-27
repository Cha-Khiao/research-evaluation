"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import { Users, CheckCircle, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { toast } from "sonner";

export default function RoomOverviewPage() {
  const params = useParams();
  const { theme } = useTheme();
  const roomId = params?.roomId as string;
  
  const [stats, setStats] = useState<any>(null);
  const [evaluationForm, setEvaluationForm] = useState<any[]>([]);
  const [groupResults, setGroupResults] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedChartGroup, setSelectedChartGroup] = useState<string>("overall");

  useEffect(() => {
    if (roomId) {
      // ✅ สังเกตตรงนี้ครับ เราใช้ roomId=${roomId} ทั้งสองตัวเลย!
      Promise.all([
        fetch(`/api/teacher/dashboard?roomId=${roomId}`).then(async res => {
          if (!res.ok) throw new Error("ดึงข้อมูล Dashboard ไม่สำเร็จ");
          return res.json();
        }),
        fetch(`/api/teacher/results?roomId=${roomId}`).then(async res => {
          if (!res.ok) throw new Error("ดึงข้อมูล Results ไม่สำเร็จ");
          return res.json();
        })
      ])
      .then(([dashboardData, resultsData]) => {
        if (dashboardData.error) throw new Error(dashboardData.error);
        if (resultsData.error) throw new Error(resultsData.error);
        
        setStats(dashboardData);
        setEvaluationForm(resultsData.evaluationForm || []);
        setGroupResults(resultsData.groupResults || []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Fetch Error:", err);
        setErrorMsg(err.message);
        setIsLoading(false);
      });
    }
  }, [roomId]);

  const getRadarChartData = () => {
    if (selectedChartGroup === "overall") {
      return evaluationForm.map(q => {
        let totalScore = 0;
        let groupCount = 0;
        groupResults.forEach(g => {
          if (g.averages[q.id] !== undefined) {
            totalScore += g.averages[q.id];
            groupCount++;
          }
        });
        const avgScore = groupCount > 0 ? (totalScore / groupCount) : 0;
        return { subject: q.question.substring(0, 15) + "...", score: Number(avgScore.toFixed(2)), fullMark: q.maxScore };
      });
    } else {
      const group = groupResults.find(g => g.groupId === selectedChartGroup);
      if (!group) return [];
      return evaluationForm.map(q => ({ subject: q.question.substring(0, 15) + "...", score: group.averages[q.id] || 0, fullMark: q.maxScore }));
    }
  };

  if (isLoading) return <div className="text-center py-20 text-gray-500">กำลังโหลดข้อมูลภาพรวม...</div>;

  if (errorMsg || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-900/50">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-red-600 dark:text-red-400">พบปัญหาในการโหลดข้อมูล</h3>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">ห้อง: {stats.roomName}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">รหัสเข้าห้อง: <span className="font-mono text-primary font-bold bg-orange-50 dark:bg-orange-950/30 px-2 py-1 rounded-md">{stats.joinCode}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl"><Users size={24} /></div>
          <div><p className="text-sm text-gray-500">กลุ่มทั้งหมด</p><p className="text-2xl font-bold">{stats.totalGroups}</p></div>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 flex items-center gap-4">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-xl"><CheckCircle size={24} /></div>
          <div><p className="text-sm text-gray-500">ประเมินแล้ว</p><p className="text-2xl font-bold">{stats.totalCompleted}</p></div>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 flex items-center gap-4">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-primary rounded-xl"><Clock size={24} /></div>
          <div><p className="text-sm text-gray-500">รอประเมิน</p><p className="text-2xl font-bold">{stats.totalPending}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800">
          <h3 className="text-lg font-bold mb-6">ความคืบหน้ารายกลุ่ม</h3>
          {stats.chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-100 dark:border-neutral-800 rounded-xl">
              ยังไม่มีข้อมูลให้แสดงผล
            </div>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#404040' : '#e5e7eb'} />
                  <XAxis dataKey="name" tick={{ fill: theme === 'dark' ? '#a3a3a3' : '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: theme === 'dark' ? '#a3a3a3' : '#6b7280', fontSize: 12 }} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff', borderRadius: '8px' }} />
                  <Bar dataKey="ประเมินแล้ว" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="ยังไม่ประเมิน" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2"><TrendingUp size={20} className="text-orange-500"/> มิติการประเมิน</h3>
            <select
              value={selectedChartGroup}
              onChange={(e) => setSelectedChartGroup(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:border-primary max-w-[150px] truncate"
            >
              <option value="overall">ภาพรวมทั้งห้อง</option>
              {groupResults.map(g => (
                <option key={g.groupId} value={g.groupId}>{g.groupName}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={getRadarChartData()}>
                <PolarGrid stroke={theme === 'dark' ? '#404040' : '#e5e7eb'} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: theme === 'dark' ? '#a3a3a3' : '#6b7280', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                <Radar name="คะแนนเฉลี่ย" dataKey="score" stroke="#f97316" fill="#f97316" fillOpacity={0.5} />
                <RechartsTooltip contentStyle={{ fontSize: '12px', backgroundColor: theme === 'dark' ? '#171717' : '#ffffff', borderRadius: '8px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}