import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Header, WorkspaceStep } from './components/Header';
import { RawInputPanel } from './components/RawInputPanel';
import { SanitizedOutputPanel } from './components/SanitizedOutputPanel';
import { RestorerPanel } from './components/RestorerPanel';
import { MappingVault } from './components/MappingVault';
import { PrivacyProofModal } from './components/PrivacyProofModal';
import {
  AliasMapping,
  CustomRule,
  DetectorOptions,
  EntityCategory,
  PresetMode,
  SanitizeResult,
} from './engine/types';
import { SessionAliasGenerator } from './engine/aliasGenerator';
import { sanitizeText } from './engine/sanitizer';
import { restoreText } from './engine/restorer';
import { DEVELOPER_SAMPLE, SamplePreset } from './engine/samples';

export const App: React.FC = () => {
  // Theme state: Default to 'light' as requested!
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeStep, setActiveStep] = useState<WorkspaceStep>('sanitize');
  const [mode, setMode] = useState<PresetMode>('developer');
  const [rawInput, setRawInput] = useState<string>('');
  const [llmResponse, setLlmResponse] = useState<string>('');
  const [activePreset, setActivePreset] = useState<SamplePreset | null>(null);

  const [customRules, setCustomRules] = useState<CustomRule[]>([]);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [vaultInitialSearch, setVaultInitialSearch] = useState('');

  const aliasGeneratorRef = useRef<SessionAliasGenerator>(
    new SessionAliasGenerator()
  );

  const [disabledOriginals, setDisabledOriginals] = useState<Set<string>>(
    new Set()
  );
  const [customAliases, setCustomAliases] = useState<Map<string, string>>(
    new Map()
  );

  // Sync theme with HTML root class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const enabledCategories = useMemo<Record<EntityCategory, boolean>>(() => {
    if (mode === 'developer') {
      return {
        db_uri: true,
        email: true,
        ipv4: true,
        secret: true,
        url: true,
        phone: true,
        person: true,
        project: true,
        company: true,
        custom: true,
      };
    }
    return {
      db_uri: false,
      email: true,
      ipv4: false,
      secret: true,
      url: true,
      phone: true,
      person: true,
      project: true,
      company: true,
      custom: true,
    };
  }, [mode]);

  const detectorOptions = useMemo<DetectorOptions>(() => {
    return {
      mode,
      enabledCategories,
      customRules,
    };
  }, [mode, enabledCategories, customRules]);

  // Compute Sanitization Result
  const sanitizeResult: SanitizeResult = useMemo(() => {
    const existingMappings: AliasMapping[] = [];

    for (const [orig, customAlias] of customAliases.entries()) {
      aliasGeneratorRef.current.setCustomMapping(orig, customAlias);
    }

    for (const orig of disabledOriginals) {
      existingMappings.push({
        id: `disabled-${orig}`,
        original: orig,
        alias: aliasGeneratorRef.current.getAlias(orig) || '',
        category: 'custom',
        count: 0,
        enabled: false,
        createdAt: 0,
      });
    }

    return sanitizeText(
      rawInput,
      detectorOptions,
      aliasGeneratorRef.current,
      existingMappings
    );
  }, [rawInput, detectorOptions, disabledOriginals, customAliases]);

  // Compute LLM Response Restoration Result
  const restoreResult = useMemo(() => {
    return restoreText(llmResponse, sanitizeResult.mappings);
  }, [llmResponse, sanitizeResult.mappings]);

  // Handlers
  const handleLoadSample = useCallback((sample: SamplePreset) => {
    aliasGeneratorRef.current.reset();
    setDisabledOriginals(new Set());
    setCustomAliases(new Map());
    setCustomRules([]);

    setActivePreset(sample);
    setMode(sample.id as PresetMode);
    setRawInput(sample.rawInput);
    setLlmResponse('');
    setActiveStep('sanitize');
  }, []);

  const handleSimulateReply = useCallback(() => {
    if (activePreset && activePreset.simulatedResponse) {
      setLlmResponse(activePreset.simulatedResponse);
    } else {
      const activeAliases = sanitizeResult.mappings
        .filter((m) => m.enabled)
        .map((m) => m.alias);
      
      const sampleItems = activeAliases.slice(0, 4).join(', ');
      setLlmResponse(`Here is the AI diagnostic assessment:

1. Verification and mitigation for: ${sampleItems || 'production environment'}.
2. Ensure network policies permit ingress from the calling service to the designated host.
3. Validate credentials and secret tokens.

All services analyzed.`);
    }
    // Automatically switch to Step 2 so the user immediately sees the restored output!
    setActiveStep('restore');
  }, [activePreset, sanitizeResult.mappings]);

  const handleToggleMapping = useCallback((original: string) => {
    setDisabledOriginals((prev) => {
      const next = new Set(prev);
      if (next.has(original)) {
        next.delete(original);
      } else {
        next.add(original);
      }
      return next;
    });
  }, []);

  const handleUpdateAlias = useCallback((original: string, newAlias: string) => {
    aliasGeneratorRef.current.setCustomMapping(original, newAlias);
    setCustomAliases((prev) => {
      const next = new Map(prev);
      next.set(original, newAlias);
      return next;
    });
  }, []);

  const handleQuickAddMask = useCallback((term: string) => {
    const rule: CustomRule = {
      id: `custom-rule-${Date.now()}`,
      term: term.trim(),
      category: 'custom',
      caseSensitive: false,
      enabled: true,
    };
    setCustomRules((prev) => [...prev, rule]);
  }, []);

  const handleAddCustomRuleWithCategory = useCallback(
    (term: string, category: EntityCategory) => {
      const rule: CustomRule = {
        id: `custom-rule-${Date.now()}`,
        term: term.trim(),
        category,
        caseSensitive: false,
        enabled: true,
      };
      setCustomRules((prev) => [...prev, rule]);
    },
    []
  );

  const handleUnmaskItem = useCallback((original: string) => {
    aliasGeneratorRef.current.removeMapping(original);
    setDisabledOriginals((prev) => new Set(prev).add(original));
    setCustomRules((prev) => prev.filter((r) => r.term !== original));
  }, []);

  const handleOpenVaultWithOriginal = useCallback((original: string) => {
    setVaultInitialSearch(original);
    setIsVaultOpen(true);
  }, []);

  const handleClearVault = useCallback(() => {
    aliasGeneratorRef.current.reset();
    setDisabledOriginals(new Set());
    setCustomAliases(new Map());
    setCustomRules([]);
  }, []);

  useEffect(() => {
    handleLoadSample(DEVELOPER_SAMPLE);

    // If running in browser extension, check for pending text from context menu
    const chromeObj = (window as any).chrome;
    if (chromeObj?.storage?.local) {
      chromeObj.storage.local.get(['pendingPrompt'], (res: { pendingPrompt?: string }) => {
        if (res?.pendingPrompt) {
          setRawInput(res.pendingPrompt);
          chromeObj.storage.local.remove(['pendingPrompt']);
        }
      });
    }
  }, [handleLoadSample]);

  return (
    <div className="min-h-screen canvas-bg flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
      <Header
        activeStep={activeStep}
        onStepChange={setActiveStep}
        mode={mode}
        onModeChange={(newMode) => setMode(newMode)}
        mappingsCount={sanitizeResult.mappings.length}
        isVaultOpen={isVaultOpen}
        onToggleVault={() => {
          setVaultInitialSearch('');
          setIsVaultOpen(!isVaultOpen);
        }}
        onOpenPrivacyProof={() => setIsPrivacyModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Centered Floating Cards Workbench (max-w-[1440px] px-6 py-6) */}
      <main className="max-w-[1440px] w-full mx-auto px-6 py-6 flex-1 flex flex-col">
        {activeStep === 'sanitize' ? (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[620px]">
            {/* Left Floating Card: Source Input */}
            <RawInputPanel
              value={rawInput}
              onChange={setRawInput}
              mode={mode}
              onAddCustomRuleWithCategory={handleAddCustomRuleWithCategory}
              onQuickAddMask={handleQuickAddMask}
              onClear={() => setRawInput('')}
              onLoadSample={handleLoadSample}
            />

            {/* Right Floating Card: Sanitized Output */}
            <SanitizedOutputPanel
              sanitizedText={sanitizeResult.sanitizedText}
              detectedEntities={sanitizeResult.detectedEntities}
              mappings={sanitizeResult.mappings}
              onSimulateReply={handleSimulateReply}
              onOpenVaultWithOriginal={handleOpenVaultWithOriginal}
              onLoadSamplePreset={() => handleLoadSample(DEVELOPER_SAMPLE)}
            />
          </div>
        ) : (
          /* Step 2: 2 Floating Cards (Paste AI Reply & Restored Code) */
          <div className="flex-1 flex flex-col min-h-[620px]">
            <RestorerPanel
              llmResponse={llmResponse}
              onLlmResponseChange={setLlmResponse}
              restoreResult={restoreResult}
              onClear={() => setLlmResponse('')}
            />
          </div>
        )}
      </main>

      {/* Vault Inspector Drawer */}
      <MappingVault
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        mappings={sanitizeResult.mappings}
        onToggleMapping={handleToggleMapping}
        onUpdateAlias={handleUpdateAlias}
        onClearVault={handleClearVault}
        onUnmaskItem={handleUnmaskItem}
        searchFilterInitial={vaultInitialSearch}
      />

      {/* Privacy Proof Modal */}
      <PrivacyProofModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </div>
  );
};

export default App;
