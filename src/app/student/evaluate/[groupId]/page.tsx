"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  question: string;
  maxScore: number;
}

export default function EvaluationFormPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { theme } = useTheme();

  const [groupName, setGroupName] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // State สำหรับเก็บคะแนนและข้อเสนอแนะ
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ดึงข้อมูลฟอร์มเมื่อเข้ามาหน้านี้
  useEffect(() => {
    if (status === "authenticated" && params?.groupId) {
      fetch(`/api/evaluations/${params.groupId}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          setGroupName(data.groupName);
          setQuestions(data.evaluationForm);
          setIsLoading(false);
        })
        .catch(err => {
          toast.error("ดึงข้อมูลฟอร์มล้มเหลว");
          setIsLoading(false);
        });
    }
  }, [status, params]);

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  // อัปเดตคะแนนแต่ละข้อ
  const handleScoreChange = (qId: string, value: string, max: number) => {
    let numValue = Number(value);
    if (numValue < 0) numValue = 0;
    if (numValue > max) numValue = max; // ป้องกันกรอกเกินคะแนนเต็ม
    setScores(prev => ({ ...prev, [qId]: numValue }));
  };

  // ยืนยันการส่งผลประเมิน
  const handleSubmit = async () => {
    // เช็คว่ากรอกครบทุกข้อไหม
    if (Object.keys(scores).length < questions.length) {
      toast.error("กรุณาให้คะแนนให้ครบทุกหัวข้อ");
      setShowConfirmModal(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/evaluations/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluatorId: (session?.user as any)?.id,
          targetGroupId: params.groupId,
          scores: scores,
          comment: comment
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setShowConfirmModal(false);
      toast.success("ประเมินเสร็จสิ้น! ขอบคุณสำหรับความคิดเห็นครับ");
      
      // หน่วงเวลาให้ดูแจ้งเตือนก่อนกลับหน้าหลัก
      setTimeout(() => {
        router.push("/student");
      }, 1500);

    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center dark:bg-neutral-950 dark:text-white">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 text-gray-900 dark:text-white pb-10">
      
      {/* Header แบบมินิมอล มีปุ่มย้อนกลับ */}
      <header className="bg-white dark:bg-neutral-900 shadow-sm border-b border-gray-200 dark:border-neutral-800 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <button 
            onClick={() => router.push("/student")}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">แบบฟอร์มประเมินวิจัย</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-primary/20 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">กำลังประเมินผลงานของกลุ่ม:</p>
          <h2 className="text-2xl font-bold text-primary">{groupName}</h2>
          <p className="text-xs text-orange-500 mt-2 bg-orange-50 dark:bg-orange-950/30 inline-block px-3 py-1 rounded-full">
            *ระบบจะบันทึกผลการประเมินแบบไม่ระบุตัวตน (Anonymous)
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 space-y-8">
          
          {/* ลูปสร้างข้อคำถามจาก JSON */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold border-b border-gray-100 dark:border-neutral-800 pb-2">ส่วนที่ 1: การให้คะแนน</h3>
            {questions.map((q, index) => (
              <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-gray-50 dark:bg-neutral-950 border border-gray-100 dark:border-neutral-800">
                <div className="flex-1">
                  <label className="font-medium text-lg">{index + 1}. {q.question}</label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">เลือกระดับคะแนน (เต็ม {q.maxScore})</p>
                </div>
                
                {/* เปลี่ยนจากช่อง Input เป็นกลุ่มปุ่มตัวเลขให้กดเลือก */}
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  {/* สร้างปุ่มตั้งแต่ 1 ถึง maxScore อัตโนมัติ */}
                  {Array.from({ length: q.maxScore }, (_, i) => i + 1).map((score) => (
                    <button
                      key={score}
                      onClick={() => handleScoreChange(q.id, score.toString(), q.maxScore)}
                      className={`w-10 h-10 rounded-full font-medium transition-all duration-200 flex items-center justify-center border shadow-sm
                        ${scores[q.id] === score 
                          ? 'bg-primary border-primary text-white scale-110 shadow-primary/30' // สไตล์ตอนถูกเลือก (สีส้ม ขยายขนาดขึ้นนิดนึง)
                          : 'bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700 hover:border-primary/50 text-gray-700 dark:text-gray-300 hover:scale-105' // สไตล์ตอนยังไม่เลือก
                        }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold border-b border-gray-100 dark:border-neutral-800 pb-2">ส่วนที่ 2: ข้อเสนอแนะ</h3>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="พิมพ์ข้อเสนอแนะเพิ่มเติมที่นี่ (ทางเลือก)..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:border-primary transition-colors resize-none"
            ></textarea>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-primary/20"
          >
            ส่งผลการประเมิน
          </button>
        </div>
      </main>

      {/* Modal ยืนยันการส่ง */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-200 dark:border-neutral-800 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">ยืนยันการส่งผลประเมิน?</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
              เมื่อกดยืนยันแล้ว คุณจะไม่สามารถกลับมาแก้ไขคะแนนของกลุ่มนี้ได้อีก ข้อมูลของคุณจะถูกส่งไปแบบไม่ระบุตัวตน
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-neutral-700 font-medium"
              >
                กลับไปแก้ไข
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium disabled:opacity-50"
              >
                {isSubmitting ? "กำลังส่ง..." : "ยืนยันส่งผล"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}