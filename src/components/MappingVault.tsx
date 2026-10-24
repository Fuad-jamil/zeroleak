import React, { useState } from 'react';
import { X } from 'lucide-react';
import { AliasMapping } from '../engine/types';
import { CATEGORY_STYLES } from '../utils/categoryTheme';

interface MappingVaultProps {
  isOpen: boolean;
  onClose: () => void;
  mappings: AliasMapping[];
  onToggleMapping: (original: string) => void;
  onUpdateAlias: (original: string, newAlias: string) => void;
  onClearVault: () => void;
  onUnmaskItem: (original: string) => void;
  searchFilterInitial?: string;
}

export const MappingVault: React.FC<MappingVaultProps> = ({
  isOpen,
  onClose,
  mappings,
  onToggleMapping,
  onUpdateAlias,
  onClearVault,
  onUnmaskItem,
  searchFilterInitial = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(searchFilterInitial);
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [revealSecrets, setRevealSecrets] = useState<Record<string, boolean>>({});
  const [editingOriginal, setEditingOriginal] = useState<string | null>(null);
  const [editAliasValue, setEditAliasValue] = useState<string>('');

  if (!isOpen) return null;

  const toggleReveal = (id: string) => {
    setRevealSecrets((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const startEdit = (original: string, currentAlias: string) => {
    setEditingOriginal(original);
    setEditAliasValue(currentAlias);
  };

  const saveEdit = (original: string) => {
    if (editAliasValue.trim()) {
      onUpdateAlias(original, editAliasValue.trim());
    }
    setEditingOriginal(null);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(mappings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `zeroleak-vault-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredMappings = mappings.filter((m) => {
    const info = CATEGORY_STYLES[m.category] || CATEGORY_STYLES.custom;
    const matchesGroup = selectedGroup === 'ALL' || info.group === selectedGroup;
    const matchesQuery =
      !searchQuery ||
      m.original.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesQuery;
  });

  const groups = ['ALL', 'CREDENTIALS', 'NETWORK', 'IDENTITY', 'CUSTOM'];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-all animate-in fade-in select-none">
      <div className="flex-1" onClick={onClose} />

      {/* Swiss Typographic Drawer */}
      <div className="w-full max-w-2xl bg-white dark:bg-[#111726] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full overflow-hidden text-xs font-mono transition-colors">
        {/* Drawer Header */}
        <div className="h-14 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-sans font-bold text-sm tracking-tight text-slate-900 dark:text-white">
              Vault Inspector
            </span>
            <span className="tabular-nums text-[11px] text-slate-500 dark:text-slate-400 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-medium font-mono">
              {mappings.length} entities in-memory
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              disabled={mappings.length === 0}
              className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium font-mono disabled:opacity-40 transition-colors cursor-pointer"
            >
              JSON Export
            </button>
            <button
              onClick={onClearVault}
              disabled={mappings.length === 0}
              className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-slate-500 text-xs font-medium font-mono disabled:opacity-40 transition-colors cursor-pointer"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              title="Close Vault"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search & Group Filter Pills */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by original value, alias, or tag..."
            className="w-full h-9 px-3 bg-slate-100 dark:bg-slate-800/80 border-0 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-mono"
          />

          {/* Group Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {groups.map((grp) => (
              <button
                key={grp}
                onClick={() => setSelectedGroup(grp)}
                className={`h-7 px-3 rounded-lg text-[11px] font-mono font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  selectedGroup === grp
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm font-semibold'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {grp}
              </button>
            ))}
          </div>
        </div>

        {/* Typographic Table Header */}
        <div className="grid grid-cols-[65px,1fr,1fr,55px,65px] px-6 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 font-semibold tracking-wider uppercase font-mono">
          <div>Tag</div>
          <div>Original Value</div>
          <div>Alias</div>
          <div className="text-center">Count</div>
          <div className="text-right">Action</div>
        </div>

        {/* Data Rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredMappings.length === 0 ? (
            <div className="py-24 text-center text-slate-400 text-xs font-mono">
              No mappings found matching current filter.
            </div>
          ) : (
            filteredMappings.map((m) => {
              const isRevealed = revealSecrets[m.id] || false;
              const isEditing = editingOriginal === m.original;
              const badge = CATEGORY_STYLES[m.category] || CATEGORY_STYLES.custom;

              return (
                <div
                  key={m.id}
                  className={`grid grid-cols-[65px,1fr,1fr,55px,65px] items-center px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-xs font-mono ${
                    !m.enabled ? 'opacity-40' : ''
                  }`}
                >
                  {/* Tag Badge */}
                  <div>
                    <button
                      onClick={() => onToggleMapping(m.original)}
                      title={m.enabled ? 'Active (Click to disable)' : 'Disabled (Click to enable)'}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                        m.enabled
                          ? badge.pillClass
                          : 'bg-slate-100 text-slate-400 line-through dark:bg-slate-800'
                      }`}
                    >
                      {badge.tag}
                    </button>
                  </div>

                  {/* Original Value & Show/Hide */}
                  <div className="flex items-center gap-2 min-w-0 pr-3">
                    <button
                      onClick={() => toggleReveal(m.id)}
                      className="text-[10px] uppercase font-mono text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0 cursor-pointer"
                    >
                      {isRevealed ? 'Hide' : 'Show'}
                    </button>
                    <span
                      className={`truncate select-text ${
                        isRevealed ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-600 dark:text-slate-300'
                      }`}
                      dir="auto"
                      title={m.original}
                    >
                      {isRevealed
                        ? m.original
                        : m.original.length > 20
                        ? `${m.original.slice(0, 4)}••••${m.original.slice(-4)}`
                        : '••••••••'}
                    </span>
                  </div>

                  {/* Alias */}
                  <div className="min-w-0 pr-3">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editAliasValue}
                          onChange={(e) => setEditAliasValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(m.original);
                            if (e.key === 'Escape') setEditingOriginal(null);
                          }}
                          autoFocus
                          className="w-full h-7 bg-slate-100 dark:bg-slate-800 px-2 text-indigo-600 dark:text-indigo-300 text-xs rounded border border-indigo-500/40 focus:outline-none"
                        />
                        <button
                          onClick={() => saveEdit(m.original)}
                          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:opacity-80 cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => startEdit(m.original, m.alias)}
                        className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold truncate cursor-pointer hover:underline"
                        title="Click to rename alias"
                      >
                        <span className="truncate">{m.alias}</span>
                        <span className="text-[10px] text-slate-400 font-normal">Edit</span>
                      </div>
                    )}
                  </div>

                  {/* Count in Tabular Nums */}
                  <div className="text-center text-slate-500 dark:text-slate-400 text-[11px] font-mono tabular-nums">
                    {m.count}
                  </div>

                  {/* Explicit Remove Button with X icon */}
                  <div className="text-right">
                    <button
                      onClick={() => onUnmaskItem(m.original)}
                      title="Instantly unmasks this entity across all panels"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium font-mono text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
