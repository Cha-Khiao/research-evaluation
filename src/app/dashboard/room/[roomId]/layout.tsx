"use client";

import { useState, useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function TeacherRoomLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const roomId = params?.roomId as string;
  
  const [roomName, setRoomName] = useState("กำลังโหลด...");

  // ดึงชื่อห้องมาโชว์บน Navbar
  useEffect(() => {
    if (roomId) {
      fetch(`/api/teacher/dashboard?roomId=${roomId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.roomName) setRoomName(data.roomName);
        })
        .catch(() => {});
    }
  }, [roomId]);

  // เมนู Tabs ของฝั่งอาจารย์
  const tabs = [
    { name: "ภาพรวม", path: `/dashboard/room/${roomId}` },
    { name: "ตั้งค่าแบบฟอร์ม", path: `/dashboard/room/${roomId}/settings` },
    { name: "จัดการสมาชิก", path: `/dashboard/room/${roomId}/members` },
    { name: "ผลคะแนน", path: `/dashboard/room/${roomId}/results` }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 font-sans selection:bg-primary/30">
      
      {/* ✨ เรียกใช้ Navbar พร้อมส่งปุ่มย้อนกลับและชื่อห้องไป */}
      <Navbar backHref="/dashboard" title={`ห้องเรียน: ${roomName}`}>
        <div className="flex gap-6 overflow-x-auto custom-scrollbar">
          {tabs.map(tab => {
            const isActive = pathname === tab.path;
            return (
              <Link 
                key={tab.path} 
                href={tab.path}
                className={`pb-3 pt-3 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${
                  isActive 
                    ? 'text-primary border-primary' 
                    : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab.name}
              </Link>
            );
          })}
        </div>
      </Navbar>
      
      {/* เนื้อหาของแต่ละหน้า (ภาพรวม, สมาชิก, ผลคะแนน) จะมาโผล่ตรงนี้ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-10">
        {children}
      </main>
    </div>
  );
}