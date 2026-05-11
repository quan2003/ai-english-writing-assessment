"use client";

import {
  AlertCircle,
  BadgeCheck,
  ClipboardList,
  FileText,
  History,
  Lightbulb,
  Loader2,
  MessageSquareText,
  RotateCcw,
  Send,
  Sparkles,
  Trash2
} from "lucide-react";
import { FormEvent, useMemo, useRef, useState } from "react";
import type { GradeResult } from "@/lib/grading-types";

type HistoryEntry = {
  id: string;
  studentName: string;
  task: string;
  essayText: string;
  createdAt: string;
  result: GradeResult;
};

const emptyResultMessage = "Submit a writing task and student essay to see the rubric result.";

function levelClass(level: string) {
  return `level level-${level.toLowerCase()}`;
}

function formatScore(value: number) {
  return Number.isInteger(value) ? value.toFixed(1) : String(value);
}

function resultTone(total: number) {
  if (total >= 8.5) return "tone-excellent";
  if (total >= 7) return "tone-good";
  if (total >= 5) return "tone-fair";
  if (total >= 3) return "tone-average";
  return "tone-weak";
}

export default function Home() {
  const [studentName, setStudentName] = useState("");
  const [task, setTask] = useState("");
  const [essayText, setEssayText] = useState("");
  const [result, setResult] = useState<GradeResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const resultRef = useRef<HTMLElement | null>(null);

  const wordCount = useMemo(() => {
    return essayText.trim() ? essayText.trim().split(/\s+/).length : 0;
  }, [essayText]);
  const canSubmit = Boolean(task.trim() && essayText.trim()) && !isLoading;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, essay_text: essayText })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to grade this essay.");
      }

      const gradeResult = data as GradeResult;
      setResult(gradeResult);
      setHistory((items) => [
        {
          id: crypto.randomUUID(),
          studentName: studentName.trim() || "Unnamed student",
          task,
          essayText,
          createdAt: new Date().toLocaleString(),
          result: gradeResult
        },
        ...items
      ]);
      window.setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to grade this essay.");
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setStudentName("");
    setTask("");
    setEssayText("");
    setError("");
    setResult(null);
  }

  function restoreEntry(entry: HistoryEntry) {
    setStudentName(entry.studentName === "Unnamed student" ? "" : entry.studentName);
    setTask(entry.task);
    setEssayText(entry.essayText);
    setResult(entry.result);
    setError("");
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand-row">
            <p className="eyebrow">University English Writing</p>
            <div className="status-pill compact">
              <ClipboardList size={16} aria-hidden="true" />
              <span>4 criteria / 10 points</span>
            </div>
          </div>
          <h1>Writing Assessment</h1>
        </div>
        <p className="subtitle">
          Classroom-focused scoring across task fulfillment, organization, vocabulary,
          and grammar. The lecturer keeps the final decision.
        </p>
      </header>

      <div className="grid">
        <section className="panel input-panel">
          <div className="panel-header">
            <div className="panel-title">
              <FileText size={20} aria-hidden="true" />
              <h2>Input</h2>
            </div>
            <span className="panel-meta">{wordCount} words</span>
          </div>

          <form className="form-stack" onSubmit={handleSubmit}>
            <div className="form-scroll">
              <label>
                Student name
                <input
                  value={studentName}
                  onChange={(event) => setStudentName(event.target.value)}
                  placeholder="Optional"
                />
              </label>

              <label>
                Writing task
                <textarea
                  className="task-box"
                  value={task}
                  onChange={(event) => setTask(event.target.value)}
                  placeholder="Paste the assignment prompt here"
                  required
                />
              </label>

              <label>
                Student essay
                <textarea
                  className="essay-box"
                  value={essayText}
                  onChange={(event) => setEssayText(event.target.value)}
                  placeholder="Paste the student's essay here"
                  required
                />
                <span className={wordCount > 0 && wordCount < 50 ? "word-count warn" : "word-count"}>
                  {wordCount < 50 && wordCount > 0
                    ? `${wordCount} words - task fulfillment is capped under 50 words`
                    : `${wordCount} words`}
                </span>
              </label>

              {error ? (
                <div className="error">
                  <AlertCircle size={18} aria-hidden="true" />
                  <span>{error}</span>
                </div>
              ) : null}
            </div>

            <div className="actions">
              <button className="primary-btn" type="submit" disabled={!canSubmit}>
                {isLoading ? (
                  <Loader2 className="spin" size={18} aria-hidden="true" />
                ) : (
                  <Send size={18} aria-hidden="true" />
                )}
                {isLoading ? "Grading" : "Grade essay"}
              </button>
              <button
                className="icon-btn"
                type="button"
                onClick={resetForm}
                title="Reset form"
                aria-label="Reset form"
              >
                <RotateCcw size={18} aria-hidden="true" />
              </button>
            </div>
          </form>
        </section>

        <section className="panel result-panel" ref={resultRef}>
          <div className="panel-header">
            <div className="panel-title">
              <ClipboardList size={20} aria-hidden="true" />
              <h2>Result</h2>
            </div>
            {result ? <span className={levelClass(result.level)}>{result.level}</span> : null}
          </div>

          {!result ? (
            <div className="empty-state">
              <div className="empty-icon">
                <ClipboardList size={30} aria-hidden="true" />
              </div>
              <p>{emptyResultMessage}</p>
            </div>
          ) : (
            <div className={resultTone(result.total)}>
              <div className="score-hero">
                <div>
                  <p className="muted">Suggested total</p>
                  <div className="score-total">{formatScore(result.total)}</div>
                </div>
                <div>
                  <p className="muted">Confidence</p>
                  <strong className="confidence">{result.confidence}</strong>
                </div>
              </div>

              <div className="result-scroll">
                <div className="criteria-grid">
                  <div className="criterion">
                    <span>Task Fulfillment</span>
                    <strong>{formatScore(result.task_fulfillment)}</strong>
                  </div>
                  <div className="criterion">
                    <span>Organization</span>
                    <strong>{formatScore(result.organization)}</strong>
                  </div>
                  <div className="criterion">
                    <span>Vocabulary</span>
                    <strong>{formatScore(result.vocabulary)}</strong>
                  </div>
                  <div className="criterion">
                    <span>Grammar</span>
                    <strong>{formatScore(result.grammar)}</strong>
                  </div>
                </div>

                <section className="result-section feedback-card">
                  <h3>
                    <MessageSquareText size={17} aria-hidden="true" />
                    Feedback
                  </h3>
                  <p className="feedback">{result.feedback}</p>
                </section>

                <div className="list-columns">
                  <section className="result-section insight-card strengths-card">
                    <h3>
                      <BadgeCheck size={17} aria-hidden="true" />
                      Strengths
                    </h3>
                    <ul className="note-list clean-list">
                      {result.strengths.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                  <section className="result-section insight-card weaknesses-card">
                    <h3>
                      <AlertCircle size={17} aria-hidden="true" />
                      Weaknesses
                    </h3>
                    <ul className="note-list clean-list">
                      {result.weaknesses.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                </div>

                <section className="result-section insight-card suggestions-card">
                  <h3>
                    <Lightbulb size={17} aria-hidden="true" />
                    Suggestions for Lecturer
                  </h3>
                  <ul className="note-list clean-list">
                    {result.suggestions_for_lecturer.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          )}
        </section>

        <aside className="panel history-panel">
          <div className="panel-header">
            <div className="panel-title">
              <History size={20} aria-hidden="true" />
              <h2>Session History</h2>
            </div>
            <span className="panel-meta">{history.length} graded</span>
            <button
              className="icon-btn"
              type="button"
              onClick={() => setHistory([])}
              title="Clear history"
              aria-label="Clear history"
              disabled={!history.length}
            >
              <Trash2 size={18} aria-hidden="true" />
            </button>
          </div>

          {!history.length ? (
            <p className="muted">No essays graded in this browser session yet.</p>
          ) : (
            <div className="history-list">
              {history.map((entry) => (
                <button
                  className="history-item"
                  key={entry.id}
                  type="button"
                  onClick={() => restoreEntry(entry)}
                >
                  <div className="history-meta">
                    <span>{entry.createdAt}</span>
                    <span className={`history-score ${resultTone(entry.result.total)}`}>
                      <Sparkles size={14} aria-hidden="true" />
                      {formatScore(entry.result.total)}
                    </span>
                  </div>
                  <div className="history-name">{entry.studentName}</div>
                  <div className="history-task">{entry.task}</div>
                </button>
              ))}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
