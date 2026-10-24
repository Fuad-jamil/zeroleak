import React, { useState } from 'react';
import { Copy, Check, Trash2 } from 'lucide-react';
import { RestoreResult } from '../engine/types';

interface RestorerPanelProps {
  llmResponse: string;
  onLlmResponseChange: (newResponse: string) => void;
  restoreResult: RestoreResult;
  onClear: () => void;
}

export const RestorerPanel: React.FC<RestorerPanelProps> = ({
  llmResponse,
  onLlmResponseChange,
  restoreResult,
  onClear,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!restoreResult.restoredText) return;
    try {
      await navigator.clipboard.writeText(restoreResult.restoredText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = restoreResult.restoredText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderRestoredView = () => {
    if (!restoreResult.restoredText) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-24 select-none">
          <p className="font-sans font-semibold text-sm text-slate-800 dark:text-slate-200">
            No AI Response Pasted
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm leading-relaxed">
            Paste the answer received from ChatGPT, Claude, or Gemini into the left pane to restore original credentials and endpoints.
          </p>
        </div>
      );
    }

    if (restoreResult.items.length === 0) {
      return (
        <div className="whitespace-pre-wrap break-all font-mono text-[13.5px] leading-[1.75] text-slate-800 dark:text-slate-100 selection:bg-emerald-500/20 select-text" dir="auto">
          {restoreResult.restoredText}
        </div>
      );
    }

    const sortedOriginals = [...restoreResult.items].sort(
      (a, b) => b.original.length - a.original.length
    );

    const escapedTokens = sortedOriginals.map((item) =>
      item.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    const splitRegex = new RegExp(`(${escapedTokens.join('|')})`, 'g');
    const parts = restoreResult.restoredText.split(splitRegex);

    const originalMap = new Map(sortedOriginals.map((item) => [item.original, item]));

    return (
      <div className="whitespace-pre-wrap break-all font-mono text-[13.5px] leading-[1.75] text-slate-800 dark:text-slate-100 selection:bg-emerald-500/20 select-text" dir="auto">
        {parts.map((part, idx) => {
          const item = originalMap.get(part);
          if (item) {
            return (
              <span
                key={idx}
                className="inline px-1.5 py-[1px] mx-[1px] rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[13px] font-mono align-baseline break-all select-text font-semibold alias-pill"
                title={`Restored from alias: ${item.alias}`}
              >{part}</span>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </div>
    );
  };

  const lineCount = llmResponse ? llmResponse.split('\n').length : 0;

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
      {/* Left Card 50%: Paste AI Reply Pane */}
      <div className="flex flex-col h-full bg-white dark:bg-[#111726] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl relative overflow-hidden transition-colors">
        {/* Header (Exact h-14, px-6, border-b) */}
        <div className="h-14 px-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-mono select-none whitespace-nowrap">
          <div className="flex items-center gap-3">
            <span className="font-sans font-bold text-sm tracking-tight text-slate-900 dark:text-white">
              Paste AI Reply
            </span>
            <span className="tabular-nums text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-medium font-mono">
              {lineCount} lines · {llmResponse.length.toLocaleString()} chars
            </span>
          </div>

          <div className="flex items-center gap-2">
            {llmResponse && (
              <button
                onClick={onClear}
                title="Clear AI reply"
                className="flex items-center h-8 px-2.5 rounded-lg text-xs font-mono font-medium text-slate-400 hover:text-red-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Textarea with transparent background & exact typography sync */}
        <div className="h-[calc(100vh-220px)] min-h-[520px] overflow-hidden relative">
          <textarea
            value={llmResponse}
            onChange={(e) => onLlmResponseChange(e.target.value)}
            placeholder={`Paste the AI's response here (with aliases like user_1@domain_1.com, 10.0.0.1, SECRET_KEY_1, Project_Alpha)...

ZeroLeak will immediately match all session aliases and restore original production values in the right pane.`}
            className="w-full h-full p-6 bg-transparent text-slate-800 dark:text-slate-100 font-mono text-[13.5px] leading-[1.75] resize-none focus:outline-none selection:bg-emerald-500/20 placeholder-slate-400/60 border-none overflow-y-auto"
            spellCheck={false}
            dir="auto"
          />
        </div>
      </div>

      {/* Right Card 50%: Restored Code Output Pane */}
      <div className="flex flex-col h-full bg-white dark:bg-[#111726] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl relative overflow-hidden transition-colors">
        {/* Header (Exact h-14, px-6, border-b) */}
        <div className="h-14 px-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-mono select-none whitespace-nowrap">
          <div className="flex items-center gap-3">
            <span className="font-sans font-bold text-sm tracking-tight text-slate-900 dark:text-white">
              Restored Code
            </span>
            <span className="tabular-nums text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20 font-semibold font-mono">
              {restoreResult.restoredCount} restored
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!restoreResult.restoredText}
              className={`flex items-center h-8 px-4 rounded-lg font-sans text-xs font-medium transition-all shadow-sm cursor-pointer whitespace-nowrap ${
                copied
                  ? 'bg-emerald-600 text-white shadow-emerald-950/20'
                  : restoreResult.restoredText
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  : 'text-slate-400 bg-slate-100 dark:bg-slate-800/60 dark:text-slate-500 cursor-not-allowed shadow-none'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1.5" />
                  <span>Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1.5" />
                  <span>Copy Restored Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Body: Exact h-[calc(100vh-220px)] min-h-[520px], p-6, leading-[1.75], text-[13.5px] */}
        <div className="h-[calc(100vh-220px)] min-h-[520px] p-6 overflow-y-auto">
          {renderRestoredView()}
        </div>
      </div>
    </div>
  );
};
