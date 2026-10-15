"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import {
  analyzeText,
  WORD_COUNTER_DEBOUNCE_MS,
} from "../wordCounterUtils";

const EMPTY_STATS = analyzeText("");

const STAT_LABELS = [
  ["words", "Words"],
  ["characters", "Characters"],
  ["charactersNoSpaces", "Characters (no spaces)"],
  ["sentences", "Sentences"],
  ["paragraphs", "Paragraphs"],
  ["lines", "Lines"],
  ["readingMinutes", "Reading time (200 wpm)"],
  ["speakingMinutes", "Speaking time (130 wpm)"],
];

export default function WordCounterTool() {
  const [text, setText] = useState("");
  const [stats, setStats] = useState(EMPTY_STATS);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setIsUpdating(true);
    const timeout = window.setTimeout(() => {
      setStats(analyzeText(text));
      setIsUpdating(false);
    }, WORD_COUNTER_DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [text]);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      setMessage("Text copied.");
    } catch {
      setMessage("Could not copy text. Select it and copy instead.");
    }
  }

  function clearText() {
    setText("");
    setStats(EMPTY_STATS);
    setMessage("");
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <label className="block text-sm font-semibold text-[#263e36]" htmlFor="word-counter-text">
        Paste or type your text
      </label>
      <textarea
        id="word-counter-text"
        aria-label="Text to count"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setMessage("");
        }}
        placeholder="Start writing or paste text here..."
        className="min-h-40 w-full resize-y border border-[#b8c9c0] p-3 text-sm leading-6 text-[#263e36] outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] sm:min-h-48"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[#71827c]" role="status" aria-live="polite">
          {isUpdating ? "Updating counts…" : `${text.length.toLocaleString()} characters entered`}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={copyText} disabled={!text}>Copy text</Button>
          <Button variant="outline" onClick={clearText} disabled={!text}>Clear</Button>
        </div>
      </div>
      {message && <p role="status" className="text-sm text-[#527268]">{message}</p>}

      <section aria-label="Text statistics" aria-live="polite" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STAT_LABELS.map(([key, label]) => (
          <div key={key} className="min-w-0 border border-[#dce5e0] bg-[#f8faf9] p-3">
            <p className="text-xs leading-4 text-[#62746d]">{label}</p>
            <p data-stat={key} className="mt-1 break-words text-xl font-semibold tabular-nums text-[#173d34]">
              {key.endsWith("Minutes") && stats[key] ? `~${stats[key]} min` : stats[key].toLocaleString()}
            </p>
          </div>
        ))}
      </section>

      <section aria-label="Top keywords" className="border border-[#dce5e0] p-3 sm:p-4">
        <h2 className="text-sm font-semibold text-[#173d34]">Top keywords</h2>
        {stats.keywords.length === 0 ? (
          <p className="mt-2 text-xs text-[#71827c]">Keywords will appear here.</p>
        ) : (
          <ol className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {stats.keywords.map(({ word, count }) => (
              <li key={word} className="flex min-w-0 justify-between gap-3 border-b border-[#edf1ef] pb-1 text-sm">
                <span className="truncate" dir="auto">{word}</span>
                <span className="shrink-0 font-medium tabular-nums text-[#527268]">{count}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
