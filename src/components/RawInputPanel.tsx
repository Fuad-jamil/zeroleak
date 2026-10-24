import React, { useRef, useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { EntityCategory, PresetMode } from '../engine/types';
import { DEVELOPER_SAMPLE, BUSINESS_SAMPLE, SamplePreset } from '../engine/samples';

interface RawInputPanelProps {
  value: string;
  onChange: (newValue: string) => void;
  mode: PresetMode;
  onAddCustomRuleWithCategory: (term: string, category: EntityCategory) => void;
  onQuickAddMask: (term: string) => void;
  onClear: () => void;
  onLoadSample: (sample: SamplePreset) => void;
}

export const RawInputPanel: React.FC<RawInputPanelProps> = ({
  value,
  onChange,
  mode,
  onAddCustomRuleWithCategory,
  onQuickAddMask,
  onClear,
  onLoadSample,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [inlineWord, setInlineWord] = useState<string>('');

  const handleSelect = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const text = textareaRef.current.value.substring(start, end).trim();
      if (text.length >= 2 && text.length <= 100) {
        setSelectedText(text);
      } else {
        setSelectedText('');
      }
    }
  };

  const handleMaskAs = (category: EntityCategory) => {
    if (selectedText) {
      onAddCustomRuleWithCategory(selectedText, category);
      setSelectedText('');
    }
  };

  const handleInlineWordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inlineWord.trim()) {
      onQuickAddMask(inlineWord.trim());
      setInlineWord('');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedText('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const lineCount = value ? value.split('\n').length : 0;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111726] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl relative overflow-hidden transition-colors">
      {/* Panel Header (Exact h-14, px-6, border-b) */}
      <div className="h-14 px-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-mono select-none whitespace-nowrap">
        {/* Left: Title & Tabular Numbers */}
        <div className="flex items-center gap-3">
          <span className="font-sans font-bold text-sm tracking-tight text-slate-900 dark:text-white">
            Source Input
          </span>
          <span className="tabular-nums text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-medium font-mono">
            {lineCount} lines · {value.length.toLocaleString()} chars
          </span>
        </div>

        {/* Right: + Mask word input & Clear button with Trash2 icon */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleInlineWordSubmit} className="flex items-center gap-1.5">
            <input
              type="text"
              value={inlineWord}
              onChange={(e) => setInlineWord(e.target.value)}
              placeholder="+ Mask phrase..."
              className="w-40 h-8 px-3 bg-slate-100 dark:bg-slate-800/80 border-0 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all font-mono"
            />
            {inlineWord.trim() && (
              <button
                type="submit"
                className="h-8 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium font-mono transition-colors cursor-pointer"
              >
                Add
              </button>
            )}
          </form>

          {value && (
            <button
              onClick={onClear}
              title="Clear source text"
              className="flex items-center h-8 px-2.5 rounded-lg text-xs font-mono font-medium text-slate-400 hover:text-red-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Select-to-Mask Action Bar */}
      {selectedText && (
        <div className="absolute top-16 left-6 right-6 z-30 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 rounded-xl shadow-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              Mask:
            </span>
            <span className="text-indigo-600 dark:text-indigo-300 font-semibold truncate max-w-[220px]" dir="auto">
              "{selectedText}"
            </span>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <button
              onClick={() => handleMaskAs('person')}
              className="h-7 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium font-mono transition-colors cursor-pointer"
            >
              Person
            </button>
            <button
              onClick={() => handleMaskAs('project')}
              className="h-7 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium font-mono transition-colors cursor-pointer"
            >
              Project
            </button>
            <button
              onClick={() => handleMaskAs('company')}
              className="h-7 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium font-mono transition-colors cursor-pointer"
            >
              Company
            </button>
            <button
              onClick={() => handleMaskAs('secret')}
              className="h-7 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium font-mono transition-colors cursor-pointer"
            >
              Secret
            </button>
            <button
              onClick={() => setSelectedText('')}
              className="h-7 px-2.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-mono transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Editor Body: Exact h-[calc(100vh-220px)] min-h-[520px], p-6, leading-[1.75], text-[13.5px] */}
      <div className="h-[calc(100vh-220px)] min-h-[520px] overflow-hidden relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={handleSelect}
          onKeyUp={handleSelect}
          placeholder={
            mode === 'developer'
              ? `# Paste PostgreSQL URIs, .env secrets, stack traces, internal URLs, or Arabic logs...
DATABASE_URL="postgresql://db_admin:SuperSecretP@ssw0rd!2026@10.0.0.45:5432/finance_production"
WEBHOOK_DISPATCH="https://webhook.internal.alamal-pay.com/v2/notify?token=9f86d081884c7d65..."
Hotline: +967-777-123-456 (المهندس: أحمد منصور)

Tip: Highlight any word to trigger the instant Mask Bar.`
              : `# Paste business emails, client memos, internal links, or contact details...
Confidential memo for Project_Horus with ApexHoldings.
Client: أحمد منصور (خالد). Contact hotline: +967-777-123-456.`
          }
          className="w-full h-full p-6 bg-transparent text-slate-800 dark:text-slate-100 font-mono text-[13.5px] leading-[1.75] resize-none focus:outline-none selection:bg-indigo-500/20 selection:text-indigo-900 dark:selection:text-indigo-200 placeholder-slate-400/50 border-none overflow-y-auto"
          spellCheck={false}
          dir="auto"
        />

        {/* Contextual Empty State Floating Prompt */}
        {!value && (
          <div className="absolute inset-x-6 bottom-8 pointer-events-none flex flex-col items-center justify-center p-6 bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center select-none animate-in fade-in">
            <p className="text-xs font-mono font-medium text-slate-600 dark:text-slate-300">
              Paste sensitive text or code here, or choose a quick example:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3 pointer-events-auto">
              <button
                onClick={() => onLoadSample(DEVELOPER_SAMPLE)}
                className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-mono font-medium text-slate-800 dark:text-slate-200 shadow-sm border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Load DevOps / .env Sample
              </button>
              <button
                onClick={() => onLoadSample(BUSINESS_SAMPLE)}
                className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-mono font-medium text-slate-800 dark:text-slate-200 shadow-sm border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Load Business Email Sample
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
