"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { smartReview } from "@/lib/api";
import type { WeakTopic } from "@/lib/types/api";
import {
  Brain,
  Sparkles,
  Settings2,
  Upload,
  FileJson,
  FileText,
  Clock,
  BookOpen,
  BookText,
  Landmark,
  Globe2,
  Scale,
  Monitor,
  Calculator,
  FlaskConical,
  Dna,
  Languages,
  Activity,
  FileCode,
  FileSearch,
  CheckCircle2,
  Check,
  Zap,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface TopicOption {
  id: string;
  name: string;
  subject: string;
  currentAccuracy: number;
  selected: boolean;
}

const subjects = [
  { id: "math", name: "Toán học", icon: Calculator, color: "text-blue-600", activeBg: "bg-blue-500", activeText: "text-white" },
  { id: "literature", name: "Ngữ văn", icon: BookText, color: "text-violet-600", activeBg: "bg-violet-500", activeText: "text-white" },
  { id: "physics", name: "Vật lý", icon: Activity, color: "text-amber-600", activeBg: "bg-amber-500", activeText: "text-foreground" },
  { id: "chemistry", name: "Hóa học", icon: FlaskConical, color: "text-emerald-600", activeBg: "bg-emerald-500", activeText: "text-white" },
  { id: "biology", name: "Sinh học", icon: Dna, color: "text-rose-600", activeBg: "bg-rose-500", activeText: "text-white" },
  { id: "history", name: "Lịch sử", icon: Landmark, color: "text-orange-600", activeBg: "bg-orange-500", activeText: "text-white" },
  { id: "geography", name: "Địa lý", icon: Globe2, color: "text-teal-600", activeBg: "bg-teal-500", activeText: "text-white" },
  { id: "civic", name: "GDCD", icon: Scale, color: "text-fuchsia-600", activeBg: "bg-fuchsia-500", activeText: "text-white" },
  { id: "informatics", name: "Tin học", icon: Monitor, color: "text-cyan-600", activeBg: "bg-cyan-500", activeText: "text-white" },
  { id: "english", name: "Tiếng Anh", icon: Languages, color: "text-indigo-600", activeBg: "bg-indigo-500", activeText: "text-white" },
] as const;


type CreationMode = "ai" | "file" | "json";
type Difficulty = "easy" | "medium" | "hard" | "mixed";

const getTopicBadgeClass = (selected: boolean) =>
  selected ? "bg-indigo-500 text-white" : "bg-background text-foreground";

const getWeakBadgeClass = (selected: boolean) =>
  selected ? "bg-rose-500 text-white" : "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300";

const getGenerateSourceLabel = (mode: CreationMode) => {
  if (mode === "ai") return "AI";
  if (mode === "file") return "File";
  return "JSON";
};

const getAccuracyColorClass = (value: number) => {
  if (value >= 60) return "bg-emerald-500";
  if (value >= 40) return "bg-amber-500";
  return "bg-rose-500";
};

const getAccuracyTextClass = (value: number) => {
  if (value >= 60) return "text-emerald-500";
  if (value >= 40) return "text-amber-500";
  return "text-rose-500";
};

export default function StudentSmartQuizPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [creationMode, setCreationMode] = useState<CreationMode>("ai");
  const [subject, setSubject] = useState("math");
  const [difficulty, setDifficulty] = useState<Difficulty>("mixed");
  const [questionCount, setQuestionCount] = useState(20);
  const [timeLimit, setTimeLimit] = useState(30);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [jsonContent, setJsonContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    smartReview
      .getWeakTopics()
      .then((weakTopics: WeakTopic[]) => {
        setTopics(
          weakTopics.map((t) => ({
            id: t.topicId,
            name: t.topicName,
            subject: t.subjectName,
            currentAccuracy: Math.round(t.accuracy * 100),
            selected: true, // pre-select tất cả chủ đề yếu
          }))
        );
      })
      .catch(() => setTopics([]))
      .finally(() => setTopicsLoading(false));
  }, []);

  const toggleTopic = (id: string) => {
    setTopics((prev) => prev.map((topic) => (topic.id === id ? { ...topic, selected: !topic.selected } : topic)));
  };

  const selectedTopics = topics.filter((topic) => topic.selected);

  const handleGenerate = useCallback(async () => {
    if (creationMode === "ai") {
      setIsGenerating(true);
      setGenerateError(null);
      try {
        const { quiz } = await smartReview.generate();
        if (quiz) {
          router.push(`/exam/${quiz.id}`);
        } else {
          setGenerateError("Không đủ dữ liệu để tạo đề. Hãy làm thêm bài thi trước.");
        }
      } catch {
        setGenerateError("Có lỗi xảy ra khi tạo đề. Vui lòng thử lại.");
      } finally {
        setIsGenerating(false);
      }
    } else {
      router.push("/exam/multiple-choice/demo");
    }
  }, [creationMode, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-40 md:pb-32">
      <div className="rounded-xl p-8 md:p-12 text-center relative border-2 border-foreground bg-purple-200 dark:bg-purple-900/30">
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center justify-center gap-2 mb-4 w-16 h-16 rounded-xl bg-purple-600 border-2 border-foreground">
            <Brain size={32} className="text-white" />
            <Sparkles size={24} className="text-amber-400 absolute -top-3 -right-3" strokeWidth={3} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-purple-950 dark:text-purple-50 mb-4 tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Tạo đề thông minh
          </h1>
          <p className="text-lg font-bold text-purple-900/80 dark:text-purple-200/80 max-w-2xl mx-auto">
            Hệ thống tự động phân tích và tạo đề phù hợp với bạn, hoặc tải lên tài liệu cá nhân để luyện tập.
          </p>
        </div>
      </div>

      <div className="space-y-4 mt-8">
        <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-3" style={{ fontFamily: "var(--font-display)" }}>
          <Settings2 size={28} className="text-foreground" strokeWidth={2.5} />
          1. Phương thức tạo đề
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button type="button" onClick={() => setCreationMode("ai")} className={`p-6 rounded-xl border-2 border-foreground flex flex-col items-center text-center gap-4 transition-colors ${creationMode === "ai" ? "bg-blue-600" : "bg-card hover:bg-muted"}`}>
            <div className={`w-14 h-14 rounded-xl border-2 border-foreground flex items-center justify-center ${creationMode === "ai" ? "bg-white" : "bg-blue-100 dark:bg-blue-900/40"}`}>
              <Brain size={28} className={creationMode === "ai" ? "text-blue-600" : "text-blue-600 dark:text-blue-400"} />
            </div>
            <div>
              <h3 className={`font-bold text-xl mb-1 ${creationMode === "ai" ? "text-white" : "text-foreground"}`}>AI Tự động tạo</h3>
              <p className={`text-sm font-bold ${creationMode === "ai" ? "text-blue-100" : "text-muted-foreground"}`}>Tạo đề dựa trên lịch sử học tập</p>
            </div>
            {creationMode === "ai" && <CheckCircle2 size={24} className="text-white absolute top-4 right-4" />}
          </button>

          <button type="button" onClick={() => setCreationMode("file")} className={`p-6 rounded-xl border-2 border-foreground flex flex-col items-center text-center gap-4 transition-colors ${creationMode === "file" ? "bg-emerald-600" : "bg-card hover:bg-muted"}`}>
            <div className={`w-14 h-14 rounded-xl border-2 border-foreground flex items-center justify-center ${creationMode === "file" ? "bg-white" : "bg-emerald-100 dark:bg-emerald-900/40"}`}>
              <FileText size={28} className={creationMode === "file" ? "text-emerald-600" : "text-emerald-600 dark:text-emerald-400"} />
            </div>
            <div>
              <h3 className={`font-bold text-xl mb-1 ${creationMode === "file" ? "text-white" : "text-foreground"}`}>Tải file tài liệu</h3>
              <p className={`text-sm font-bold ${creationMode === "file" ? "text-emerald-100" : "text-muted-foreground"}`}>Trích xuất từ Word, PDF</p>
            </div>
            {creationMode === "file" && <CheckCircle2 size={24} className="text-white absolute top-4 right-4" />}
          </button>

          <button type="button" onClick={() => setCreationMode("json")} className={`p-6 rounded-xl border-2 border-foreground flex flex-col items-center text-center gap-4 transition-colors ${creationMode === "json" ? "bg-amber-500" : "bg-card hover:bg-muted"}`}>
            <div className={`w-14 h-14 rounded-xl border-2 border-foreground flex items-center justify-center ${creationMode === "json" ? "bg-white" : "bg-amber-100 dark:bg-amber-900/40"}`}>
              <FileCode size={28} className={creationMode === "json" ? "text-amber-600" : "text-amber-600 dark:text-amber-400"} />
            </div>
            <div>
              <h3 className="font-bold text-xl mb-1 text-foreground">Nhập mã JSON</h3>
              <p className={`text-sm font-bold ${creationMode === "json" ? "text-amber-900" : "text-muted-foreground"}`}>Dành cho nhà phát triển</p>
            </div>
            {creationMode === "json" && <CheckCircle2 size={24} className="text-foreground absolute top-4 right-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-4 mt-8">
        <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-3" style={{ fontFamily: "var(--font-display)" }}>
          <FileSearch size={28} className="text-foreground" strokeWidth={2.5} />
          2. Nguồn dữ liệu
        </h2>

        {creationMode === "ai" && (
          <div className="bg-card rounded-xl p-6 md:p-8 border-2 border-foreground">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-foreground pb-6">
              <div>
                <h3 className="font-extrabold text-xl text-foreground mb-1">Chuyên đề tập trung</h3>
                <p className="text-sm font-bold text-muted-foreground">Hệ thống ưu tiên các chuyên đề có tỷ lệ làm đúng dưới 50%</p>
              </div>
              <button type="button" onClick={() => setTopics((prev) => prev.map((t) => ({ ...t, selected: true })))} className="px-4 py-2 bg-background border-2 border-foreground text-foreground font-bold rounded-xl hover:bg-muted transition-colors">
                Chọn tất cả
              </button>
            </div>

            {topicsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-5 rounded-xl border-2 border-foreground bg-muted animate-pulse h-28"
                  />
                ))}
              </div>
            ) : topics.length === 0 ? (
              <div className="py-10 text-center rounded-xl border-2 border-foreground bg-muted">
                <p className="text-lg font-bold text-foreground mb-2">Chưa có chủ đề yếu</p>
                <p className="text-sm text-muted-foreground font-medium">
                  Hoàn thành thêm bài thi để hệ thống phân tích và gợi ý chủ đề cần luyện.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topics.map((topic) => {
                  const isWeak = topic.currentAccuracy < 50;
                  return (
                    <button key={topic.id} type="button" onClick={() => toggleTopic(topic.id)} className={`p-5 rounded-xl border-2 border-foreground transition-colors text-left flex items-start gap-4 ${topic.selected ? "bg-indigo-600 text-white" : "bg-background hover:bg-muted text-foreground"}`}>
                      <div className={`w-6 h-6 rounded-md border-2 border-foreground flex items-center justify-center shrink-0 mt-1 ${topic.selected ? "bg-white" : "bg-background"}`}>
                        {topic.selected && <Check size={16} className="text-indigo-600" strokeWidth={4} />}
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-md border-2 border-foreground text-xs font-bold ${getTopicBadgeClass(topic.selected)}`}>{topic.subject}</span>
                          {isWeak && (
                            <span className={`px-2 py-0.5 rounded-md border-2 border-foreground text-xs font-bold flex items-center gap-1 ${getWeakBadgeClass(topic.selected)}`}>
                              <Sparkles size={12} strokeWidth={3} />
                              Cần cải thiện
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-lg mb-2">{topic.name}</h4>

                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-bold ${topic.selected ? "text-indigo-100" : "text-muted-foreground"}`}>Độ chính xác:</span>
                          <div className="flex-1 h-3 bg-background rounded-full overflow-hidden max-w-[120px] border-2 border-foreground">
                            <div className={`h-full border-r-2 border-foreground ${getAccuracyColorClass(topic.currentAccuracy)}`} style={{ width: `${topic.currentAccuracy}%` }} />
                          </div>
                          <span className={`text-sm font-extrabold ${getAccuracyTextClass(topic.currentAccuracy)}`}>
                            {topic.currentAccuracy}%
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {creationMode === "file" && (
          <div className="bg-card rounded-xl p-8 border-2 border-foreground text-center">
            <button
              type="button"
              className="w-full border-2 border-dashed border-foreground rounded-xl bg-background p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 border-2 border-foreground rounded-full flex items-center justify-center mb-4">
                <Upload size={40} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-2xl font-extrabold text-foreground mb-2">Kéo thả hoặc chọn file</h3>
              <p className="text-muted-foreground font-bold mb-6">Hỗ trợ định dạng: PDF, DOC, DOCX (Tối đa 10MB)</p>
              {uploadedFile ? (
                <div className="bg-emerald-100 dark:bg-emerald-900/40 border-2 border-foreground rounded-xl px-6 py-4 flex items-center gap-3 text-emerald-800 dark:text-emerald-300 font-bold">
                  <FileText size={24} />
                  <span>{uploadedFile.name}</span>
                  <Check size={20} className="ml-2 text-emerald-600 dark:text-emerald-400" />
                </div>
              ) : (
                <button type="button" className="px-6 py-3 bg-foreground text-background font-bold rounded-xl border-2 border-foreground hover:bg-muted-foreground transition-colors">
                  Chọn tệp tài liệu
                </button>
              )}
            </button>
          </div>
        )}

        {creationMode === "json" && (
          <div className="bg-card rounded-xl p-6 border-2 border-foreground">
            <div className="flex items-center gap-3 mb-4">
              <FileJson size={24} className="text-amber-600 dark:text-amber-400" />
              <h3 className="font-extrabold text-xl text-foreground">Nhập dữ liệu JSON</h3>
            </div>
            <p className="text-muted-foreground font-bold mb-4">Dán đoạn mã JSON chứa danh sách câu hỏi vào bên dưới. Định dạng yêu cầu gồm: question, options, correctAnswer.</p>
            <textarea
              value={jsonContent}
              onChange={(e) => setJsonContent(e.target.value)}
              placeholder={'[\n  {\n    "question": "...",\n    "options": ["A", "B", "C", "D"],\n    "correctAnswer": 0\n  }\n]'}
              className="w-full h-64 p-4 font-mono text-sm bg-background border-2 border-foreground rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-500/20 text-foreground"
            />
          </div>
        )}
      </div>

      <div className="space-y-6 mt-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-foreground flex items-center gap-3" style={{ fontFamily: "var(--font-display)" }}>
          <BookOpen size={32} className="text-foreground" strokeWidth={2.5} />
          3. Tùy chỉnh Metadata
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl p-6 border-2 border-foreground">
            <h3 className="font-bold text-lg text-muted-foreground mb-4">Môn học</h3>
            <div className="flex flex-wrap gap-3">
              {subjects.map((s) => {
                const Icon = s.icon;
                const isActive = subject === s.id;
                const buttonClass = isActive
                  ? `${s.activeBg} ${s.activeText}`
                  : "bg-background text-foreground hover:bg-muted";
                return (
                  <button key={s.id} type="button" onClick={() => setSubject(s.id)} className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-foreground transition-colors font-extrabold text-sm md:text-base ${buttonClass}`}>
                    <Icon size={20} className={isActive ? "text-current" : s.color} strokeWidth={2.5} />
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border-2 border-foreground">
            <h3 className="font-bold text-lg text-muted-foreground mb-4">Mức độ</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: "easy", label: "Cơ bản", color: "bg-emerald-500", text: "text-white" },
                { id: "medium", label: "Trung bình", color: "bg-amber-500", text: "text-foreground" },
                { id: "hard", label: "Vận dụng", color: "bg-rose-500", text: "text-white" },
                { id: "mixed", label: "Hỗn hợp", color: "bg-indigo-500", text: "text-white" },
              ].map((level) => {
                const isActive = difficulty === level.id;
                const buttonClass = isActive
                  ? `${level.color} ${level.text}`
                  : "bg-background text-foreground hover:bg-muted";
                return (
                  <button key={level.id} type="button" onClick={() => setDifficulty(level.id as Difficulty)} className={`py-3.5 rounded-xl border-2 border-foreground transition-colors font-extrabold text-sm md:text-base text-center ${buttonClass}`}>
                    {level.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border-2 border-foreground">
            <h3 className="font-bold text-lg text-muted-foreground mb-4">Số lượng câu hỏi</h3>
            <div className="flex gap-3">
              {[10, 20, 30, 40, 50].map((num) => {
                const isActive = questionCount === num;
                return (
                  <button key={num} type="button" onClick={() => setQuestionCount(num)} className={`flex-1 py-3.5 rounded-xl border-2 border-foreground transition-colors font-extrabold text-sm md:text-base text-center ${isActive ? "bg-blue-500 text-white" : "bg-background text-foreground hover:bg-muted"}`}>
                    {num}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border-2 border-foreground">
            <h3 className="font-bold text-lg text-muted-foreground mb-4 flex items-center gap-2">
              <Clock size={20} strokeWidth={2.5} /> Thời gian làm bài
            </h3>
            <div className="flex gap-3">
              {[15, 30, 45, 60].map((mins) => {
                const isActive = timeLimit === mins;
                return (
                  <button key={mins} type="button" onClick={() => setTimeLimit(mins)} className={`flex-1 py-3.5 rounded-xl border-2 border-foreground transition-colors font-extrabold text-sm md:text-base text-center ${isActive ? "bg-pink-500 text-white" : "bg-background text-foreground hover:bg-muted"}`}>
                    {mins}p
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 lg:left-[280px] right-0 p-4 bg-background border border-card-foreground z-30">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 m-0 p-0">
          <div className="text-center md:text-left w-full md:w-auto">
            {generateError ? (
              <p className="font-bold text-rose-600 mb-1">{generateError}</p>
            ) : (
              <p className="font-extrabold text-lg text-foreground mb-1">Sẵn sàng tạo đề thi!</p>
            )}
            <p className="text-sm font-bold text-muted-foreground">
              Tạo từ {getGenerateSourceLabel(creationMode)} • {questionCount} câu • {timeLimit} phút
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || (creationMode === "ai" && selectedTopics.length === 0)}
            className="w-full md:w-auto px-8 py-4 rounded-xl flex items-center justify-center gap-3 transition-colors border-2 border-foreground disabled:opacity-50 disabled:cursor-not-allowed bg-card text-foreground hover:bg-muted"
          >
            {isGenerating ? (
              <>
                <Loader2 size={24} strokeWidth={2.5} className="animate-spin text-amber-500" />
                <span className="font-extrabold text-lg tracking-wide">Đang tạo...</span>
              </>
            ) : (
              <>
                <Zap size={24} strokeWidth={2.5} className="text-amber-500" />
                <span className="font-extrabold text-lg tracking-wide">Bắt đầu tạo</span>
                <ChevronRight size={24} strokeWidth={3} className="text-foreground" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
