"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  question: string;
  maxScore: number;
}

export default function RoomSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [roomId, setRoomId] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      const teacherId = (session?.user as any)?.id;
      fetch(`/api/teacher/room?teacherId=${teacherId}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          setRoomId(data._id);
          setJoinCode(data.joinCode);
          setQuestions(data.evaluationForm || []);
          setIsLoading(false);
        })
        .catch(err => {
          toast.error("ดึงข้อมูลห้องเรียนล้มเหลว");
          setIsLoading(false);
        });
    }
  }, [status, session]);

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const handleAddQuestion = () => {
    const newId = `q${Date.now()}`;
    setQuestions([...questions, { id: newId, question: "", maxScore: 5 }]);
  };

  const handleRemoveQuestion = (idToRemove: string) => {
    setQuestions(questions.filter(q => q.id !== idToRemove));
  };

  const handleQuestionChange = (id: string, field: keyof Question, value: string | number) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const handleSaveForm = async () => {
    const hasEmpty = questions.some(q => !q.question.trim());
    if (hasEmpty) {
      toast.error("กรุณากรอกคำถามให้ครบทุกข้อ");
      setShowConfirmModal(false);
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/teacher/room", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, evaluationForm: questions }),
      });

      if (!response.ok) throw new Error("เกิดข้อผิดพลาดในการบันทึก");

      toast.success("บันทึกแบบฟอร์มประเมินสำเร็จ!");
      setShowConfirmModal(false);
    } catch (error) {
      toast.error("ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center dark:bg-neutral-950 dark:text-white">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 text-gray-900 dark:text-white pb-10">
      
      <header className="bg-white dark:bg-neutral-900 shadow-sm border-b border-gray-200 dark:border-neutral-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/dashboard")} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">ตั้งค่าห้องเรียนและแบบฟอร์ม</h1>
          </div>
          <button
            onClick={() => setShowConfirmModal(true)}
            className="bg-primary hover:bg-primary-hover text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Save size={18} />
            <span className="hidden sm:inline">บันทึกการตั้งค่า</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold">รหัสเข้าห้องเรียน (Join Code)</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">ให้นักศึกษาใช้รหัสนี้ หากจำเป็นต้องค้นหาห้อง</p>
          </div>
          <div className="bg-orange-100 dark:bg-orange-950/30 text-primary px-6 py-3 rounded-xl font-mono text-xl font-bold tracking-widest border border-orange-200 dark:border-orange-900/50">
            {joinCode}
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800">
          <div className="mb-6 pb-4 border-b border-gray-100 dark:border-neutral-800">
            <h2 className="text-lg font-bold">จัดการคำถามการประเมิน</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">คุณสามารถเพิ่ม ลบ หรือกำหนดคะแนนเต็มของแต่ละข้อได้</p>
          </div>

          <div className="space-y-4">
            {questions.map((q, index) => (
              <div key={q.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 relative group">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-neutral-800 font-bold text-sm shrink-0">
                  {index + 1}
                </div>
                
                <div className="flex-1 space-y-4 sm:space-y-0 sm:flex sm:gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">หัวข้อการประเมิน</label>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => handleQuestionChange(q.id, "question", e.target.value)}
                      placeholder="เช่น ความคิดสร้างสรรค์"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="w-full sm:w-32">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">คะแนนเต็ม</label>
                    <input
                      type="number"
                      min="1"
                      value={q.maxScore}
                      onChange={(e) => handleQuestionChange(q.id, "maxScore", Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:border-primary transition-colors text-center"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveQuestion(q.id)}
                  className="absolute top-4 right-4 sm:relative sm:top-0 sm:right-0 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                  title="ลบคำถามนี้"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
            
            {questions.length === 0 && (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 dark:border-neutral-800 rounded-xl">
                ยังไม่มีคำถามในแบบฟอร์ม กรุณากดเพิ่มคำถามใหม่
              </div>
            )}
          </div>

          <button
            onClick={handleAddQuestion}
            className="w-full mt-6 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 font-medium py-3 rounded-xl transition-colors flex justify-center items-center gap-2"
          >
            <Plus size={20} />
            เพิ่มคำถามใหม่
          </button>
        </div>
      </main>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-200 dark:border-neutral-800">
            <h3 className="text-xl font-bold mb-2">ยืนยันการบันทึก?</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
              เมื่อบันทึกแล้ว แบบฟอร์มนี้จะถูกใช้เป็นเกณฑ์ในการประเมินของนักศึกษาทันที ต้องการบันทึกหรือไม่?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-neutral-700 font-medium">
                ยกเลิก
              </button>
              <button onClick={handleSaveForm} disabled={isSaving} className="flex-1 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium disabled:opacity-50">
                {isSaving ? "กำลังบันทึก..." : "ยืนยันบันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}