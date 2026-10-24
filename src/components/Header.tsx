import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { PresetMode } from '../engine/types';

export type WorkspaceStep = 'sanitize' | 'restore';

interface HeaderProps {
  activeStep: WorkspaceStep;
  onStepChange: (step: WorkspaceStep) => void;
  mode: PresetMode;
  onModeChange: (newMode: PresetMode) => void;
  mappingsCount: number;
  isVaultOpen: boolean;
  onToggleVault: () => void;
  onOpenPrivacyProof: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeStep,
  onStepChange,
  mode,
  onModeChange,
  mappingsCount,
  isVaultOpen,
  onToggleVault,
  onOpenPrivacyProof,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="h-16 px-6 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs select-none sticky top-0 z-40 transition-colors duration-200 whitespace-nowrap">
      {/* Left: Brand + Local Only Status Pill */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="font-mono font-bold text-base tracking-tight text-slate-900 dark:text-white">
            zeroleak
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold">
            v1.3
          </span>
        </div>

        {/* Local Only Indicator */}
        <button
          onClick={onOpenPrivacyProof}
          title="100% Client-Side Memory Isolation. Zero Outbound API Calls."
          className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20 text-[11px] font-mono font-medium hover:bg-emerald-100 dark:hover:bg-emerald-500/15 transition-colors cursor-pointer"
        >
          <span>LOCAL ONLY</span>
          <span className="opacity-50">/</span>
          <span>0B NETWORK</span>
        </button>
      </div>

      {/* Center: Apple / Linear Style Typographic Step Switcher */}
      <div className="flex items-center bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-xl shadow-inner font-mono text-xs">
        <button
          onClick={() => onStepChange('sanitize')}
          className={`px-4 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            activeStep === 'sanitize'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          1. Sanitize Prompt
        </button>
        <button
          onClick={() => onStepChange('restore')}
          className={`px-4 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            activeStep === 'restore'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          2. Restore AI Reply
        </button>
      </div>

      {/* Right Controls: Mode Toggle, Vault, Theme Icon Button */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Preset Mode Segmented Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg font-mono text-[11px]">
          <button
            onClick={() => onModeChange('developer')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              mode === 'developer'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            Dev
          </button>
          <button
            onClick={() => onModeChange('business')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              mode === 'business'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            Business
          </button>
        </div>

        {/* Vault Drawer Button */}
        <button
          onClick={onToggleVault}
          className={`flex items-center gap-1.5 h-9 px-3 rounded-lg font-mono text-[11px] transition-colors cursor-pointer ${
            isVaultOpen
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 font-semibold'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium'
          }`}
        >
          <span>Vault</span>
          <span className="tabular-nums px-1.5 py-0.2 rounded bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-sm text-[10px]">
            {mappingsCount}
          </span>
        </button>

        {/* Theme Toggle Button (Clean icon-only square button w-9 h-9) */}
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>
      </div>
    </header>
  );
};
