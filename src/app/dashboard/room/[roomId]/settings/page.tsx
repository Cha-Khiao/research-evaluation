"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  question: string;
  maxScore: number;
}

export default function RoomSettingsPage() {
  const params = useParams();
  const roomId = params?.roomId as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (roomId) {
      fetch(`/api/teacher/room?roomId=${roomId}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          setQuestions(data.evaluationForm || []);
          setIsLoading(false);
        })
        .catch(err => {
          toast.error("ดึงข้อมูลฟอร์มล้มเหลว");
          setIsLoading(false);
        });
    }
  }, [roomId]);

  const handleAddQuestion = () => {
    const newId = `q${Date.now()}`;
    setQuestions([...questions, { id: newId, question: "", maxScore: 5 }]);
  };

  const handleRemoveQuestion = (idToRemove: string) => {
    setQuestions(questions.filter(q => q.id !== idToRemove));
  };

  const handleQuestionChange = (id: string, field: keyof Question, value: string | number) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
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

  if (isLoading) return <div className="text-center py-20 text-gray-500">กำลังโหลดแบบฟอร์ม...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">จัดการคำถามการประเมิน</h2>
          <p className="text-sm text-gray-500 mt-1">ตั้งค่าหัวข้อและคะแนนเต็มสำหรับห้องนี้</p>
        </div>
        <button
          onClick={() => setShowConfirmModal(true)}
          className="bg-primary hover:bg-primary-hover text-white font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
        >
          <Save size={18} /> บันทึกการตั้งค่า
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800">
        <div className="space-y-4">
          {questions.map((q, index) => (
            <div key={q.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 relative group">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-neutral-800 font-bold text-sm shrink-0">
                {index + 1}
              </div>
              
              <div className="flex-1 space-y-4 sm:space-y-0 sm:flex sm:gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">หัวข้อการประเมิน</label>
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => handleQuestionChange(q.id, "question", e.target.value)}
                    placeholder="เช่น ความคิดสร้างสรรค์"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:border-primary transition-colors"
                  />
                </div>
                <div className="w-full sm:w-32">
                  <label className="block text-xs font-medium text-gray-500 mb-1">คะแนนเต็ม</label>
                  <input
                    type="number"
                    min="1"
                    value={q.maxScore}
                    onChange={(e) => handleQuestionChange(q.id, "maxScore", Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:border-primary transition-colors text-center"
                  />
                </div>
              </div>

              <button onClick={() => handleRemoveQuestion(q.id)} className="absolute top-4 right-4 sm:relative sm:top-0 sm:right-0 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors">
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

        <button onClick={handleAddQuestion} className="w-full mt-6 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 font-medium py-3 rounded-xl transition-colors flex justify-center items-center gap-2">
          <Plus size={20} /> เพิ่มคำถามใหม่
        </button>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-200 dark:border-neutral-800">
            <h3 className="text-xl font-bold mb-2">ยืนยันการบันทึก?</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">แบบฟอร์มนี้จะถูกใช้เป็นเกณฑ์ในการประเมินของนักศึกษาทันที ต้องการบันทึกหรือไม่?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-neutral-700 font-medium">ยกเลิก</button>
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