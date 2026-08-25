import { useState } from "react";
import { Brain, Check, Loader2, RefreshCw, X } from "lucide-react";
import { useStudyLibrary } from "@/hooks/useStudyLibrary";

interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  topic: string;
  explanation: string;
}

const FN_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/study-quiz`;

interface Props {
  videoId: string;
  title: string;
  subjectId: string;
  onClose: () => void;
}

const StudyQuiz = ({ videoId, title, subjectId, onClose }: Props) => {
  const { saveQuizResult, quizzes } = useStudyLibrary();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const last = quizzes[videoId];

  const generate = async () => {
    setLoading(true);
    setError(null);
    setSubmitted(false);
    setAnswers({});
    try {
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, subjectId }),
      });
      const json = await res.json();
      if (!res.ok || !json.questions?.length) throw new Error();
      setQuestions(json.questions);
    } catch {
      setError("Quiz load nahi ho paaya. Dobara try karein.");
    } finally {
      setLoading(false);
    }
  };

  const submit = () => {
    setSubmitted(true);
    const weakTopics = questions.filter((q, i) => answers[i] !== q.answerIndex).map((q) => q.topic);
    const score = questions.length - weakTopics.length;
    saveQuizResult({ videoId, subjectId, title, score, total: questions.length, weakTopics });
  };

  const score = submitted ? questions.filter((q, i) => answers[i] === q.answerIndex).length : 0;

  return (
    <div className="border border-primary/25 bg-primary/5 rounded-xl p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
          <Brain className="w-4 h-4" /> Lecture Quiz
        </p>
        <div className="flex items-center gap-2">
          {questions.length > 0 && (
            <button onClick={generate} aria-label="New questions" className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
              <RefreshCw className="w-3.5 h-3.5 text-foreground" />
            </button>
          )}
          <button onClick={onClose} aria-label="Close quiz" className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
            <X className="w-3.5 h-3.5 text-foreground" />
          </button>
        </div>
      </div>

      {questions.length === 0 && (
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground">
            Is lecture ke 5 quick questions se apni understanding check karein. Galat answers ke topics weak topics me save honge.
          </p>
          {last && (
            <p className="text-[11px] text-muted-foreground">
              Pichhla score: <span className="text-primary font-semibold">{last.score}/{last.total}</span>
            </p>
          )}
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-semibold disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
            {loading ? "Quiz ban raha hai..." : "Start quiz"}
          </button>
          {error && <p className="text-[11px] text-cinema-red">⚠️ {error}</p>}
        </div>
      )}

      {questions.map((q, qi) => (
        <div key={qi} className="space-y-1.5">
          <p className="text-xs font-medium text-foreground">{qi + 1}. {q.question}</p>
          <div className="grid gap-1.5">
            {q.options.map((opt, oi) => {
              const picked = answers[qi] === oi;
              const correct = submitted && oi === q.answerIndex;
              const wrong = submitted && picked && oi !== q.answerIndex;
              return (
                <button
                  key={oi}
                  disabled={submitted}
                  onClick={() => setAnswers((p) => ({ ...p, [qi]: oi }))}
                  className={`text-left text-[11px] px-2.5 py-1.5 rounded-lg border transition-colors ${
                    correct
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : wrong
                        ? "border-cinema-red/50 bg-cinema-red/10 text-cinema-red"
                        : picked
                          ? "border-primary/40 bg-primary/10 text-foreground"
                          : "border-border bg-secondary/50 text-foreground"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {submitted && (
            <p className="text-[10px] text-muted-foreground">
              {answers[qi] === q.answerIndex ? "✅ Sahi" : `❌ Review: ${q.topic}`} — {q.explanation}
            </p>
          )}
        </div>
      ))}

      {questions.length > 0 && !submitted && (
        <button
          onClick={submit}
          disabled={Object.keys(answers).length < questions.length}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-semibold disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" /> Submit answers
        </button>
      )}

      {submitted && (
        <p className="text-xs text-foreground">
          Score: <span className="text-primary font-bold">{score}/{questions.length}</span>
          {score < questions.length && " — weak topics tumhare subject progress card me save ho gaye."}
        </p>
      )}
    </div>
  );
};

export default StudyQuiz;
