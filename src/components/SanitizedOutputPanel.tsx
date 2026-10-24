import React, { useState } from 'react';
import { Copy, Check, X } from 'lucide-react';
import { AliasMapping, DetectedEntity } from '../engine/types';
import { CATEGORY_STYLES } from '../utils/categoryTheme';

interface SanitizedOutputPanelProps {
  sanitizedText: string;
  detectedEntities: DetectedEntity[];
  mappings: AliasMapping[];
  onSimulateReply: () => void;
  onOpenVaultWithOriginal?: (original: string) => void;
  onLoadSamplePreset?: () => void;
}

export const SanitizedOutputPanel: React.FC<SanitizedOutputPanelProps> = ({
  sanitizedText,
  detectedEntities,
  mappings,
  onSimulateReply,
  onOpenVaultWithOriginal,
  onLoadSamplePreset,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<AliasMapping | null>(null);

  const handleCopy = async () => {
    if (!sanitizedText) return;
    try {
      await navigator.clipboard.writeText(sanitizedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = sanitizedText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const activeAliasMap = new Map<string, AliasMapping>();
  for (const m of mappings) {
    if (m.enabled && m.alias) {
      activeAliasMap.set(m.alias, m);
    }
  }

  const renderAnnotatedView = () => {
    if (!sanitizedText) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-24 select-none">
          <p className="font-sans font-semibold text-sm text-slate-800 dark:text-slate-200">
            No input to sanitize
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm leading-relaxed">
            Paste sensitive code, .env, or logs into the left pane to instantly generate safe, contextual aliases.
          </p>
          {onLoadSamplePreset && (
            <button
              onClick={onLoadSamplePreset}
              className="mt-4 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-mono font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Load Sample Preset
            </button>
          )}
        </div>
      );
    }

    const aliases = Array.from(activeAliasMap.keys()).sort(
      (a, b) => b.length - a.length
    );

    if (aliases.length === 0) {
      return (
        <div className="whitespace-pre-wrap break-all font-mono text-[13.5px] leading-[1.75] text-slate-800 dark:text-slate-100 selection:bg-indigo-500/20 select-text" dir="auto">
          {sanitizedText}
        </div>
      );
    }

    const escaped = aliases.map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escaped.join('|')})`, 'g');
    const segments = sanitizedText.split(regex);

    return (
      <div className="whitespace-pre-wrap break-all font-mono text-[13.5px] leading-[1.75] text-slate-800 dark:text-slate-100 selection:bg-indigo-500/20 select-text" dir="auto">
        {segments.map((seg, idx) => {
          const mapping = activeAliasMap.get(seg);
          if (mapping) {
            const badge = CATEGORY_STYLES[mapping.category] || CATEGORY_STYLES.custom;
            return (
              <span
                key={idx}
                onClick={() => setSelectedEntity(mapping)}
                className={`inline px-1.5 py-[1px] mx-[1px] rounded text-[13px] font-mono cursor-pointer transition-colors align-baseline break-all select-text font-medium alias-pill ${badge.pillClass}`}
                title={`Original: ${mapping.original}\nType: ${badge.label}`}
              >{seg}</span>
            );
          }
          return <span key={idx}>{seg}</span>;
        })}
      </div>
    );
  };

  const maskedCount = detectedEntities.filter((e) => e.enabled).length;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111726] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl relative overflow-hidden transition-colors">
      {/* Panel Header (Exact h-14, px-6, border-b) */}
      <div className="h-14 px-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-mono select-none whitespace-nowrap">
        {/* Left: Title & Tabular Numbers */}
        <div className="flex items-center gap-3">
          <span className="font-sans font-bold text-sm tracking-tight text-slate-900 dark:text-white">
            Sanitized Output
          </span>
          <span className="tabular-nums text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20 font-semibold font-mono">
            {maskedCount} masked
          </span>
        </div>

        {/* Right Controls: Simulate Reply & Primary Copy Safe Prompt Button */}
        <div className="flex items-center gap-2.5">
          {/* Simulate AI Reply Button */}
          {sanitizedText && (
            <button
              onClick={onSimulateReply}
              title="Test Reversal: Simulates AI reply and switches to Step 2 automatically"
              className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono text-xs font-medium transition-colors cursor-pointer"
            >
              Simulate Reply
            </button>
          )}

          {/* Primary Copy Safe Prompt Button with Functional Icon & Feedback State */}
          <button
            onClick={handleCopy}
            disabled={!sanitizedText}
            className={`flex items-center h-8 px-4 rounded-lg font-sans text-xs font-medium transition-all shadow-sm cursor-pointer whitespace-nowrap ${
              copied
                ? 'bg-emerald-600 text-white shadow-emerald-950/20'
                : sanitizedText
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
                <span>Copy Safe Prompt</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area: Annotated view always rendered */}
      <div className="h-[calc(100vh-220px)] min-h-[520px] p-6 overflow-y-auto relative">
        {renderAnnotatedView()}

        {/* Selected Entity Inspector Popup */}
        {selectedEntity && (
          <div className="absolute bottom-6 left-6 right-6 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 rounded-xl p-3.5 shadow-2xl flex items-center justify-between gap-3 text-xs font-mono animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                {selectedEntity.category}
              </span>
              <span className="text-slate-400 text-[11px]">Original:</span>
              <span className="text-rose-600 dark:text-rose-400 font-semibold truncate max-w-[220px]" dir="auto">
                {selectedEntity.original}
              </span>
              <span className="text-slate-400">→</span>
              <span className="text-indigo-600 dark:text-indigo-300 font-semibold">
                {selectedEntity.alias}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onOpenVaultWithOriginal && (
                <button
                  onClick={() => {
                    onOpenVaultWithOriginal(selectedEntity.original);
                    setSelectedEntity(null);
                  }}
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  View in Vault
                </button>
              )}
              <button
                onClick={() => setSelectedEntity(null)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs font-medium cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Dismiss</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
