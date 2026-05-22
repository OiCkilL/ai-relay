'use client';

import { useState, useMemo, useEffect } from 'react';

interface ToolsTabProps {
  apiKey: string;
  lang: 'zh' | 'en';
  t: any;
  providers: any[];
}

export default function ToolsTab({ apiKey, lang, t, providers }: ToolsTabProps) {
  // Temporary Key Generator States
  const [tempDuration, setTempDuration] = useState<number>(86400); // Default 1 day (86400 seconds)

  // Model & Key Connectivity Test States
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [useCustomKey, setUseCustomKey] = useState<boolean>(false);
  const [customKey, setCustomKey] = useState<string>('');
  const [testLoading, setTestLoading] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; status?: number; error?: string } | null>(null);

  // Extract all models from configured providers
  const testableModels = useMemo(() => {
    return providers
      .filter((p) => p.keyCount > 0)
      .flatMap((p) => {
        return (p.models || []).map((m: any) => ({
          modelId: m.id,
          displayName: m.displayName,
          providerId: p.id,
          providerName: p.name,
        }));
      });
  }, [providers]);

  // Set default model once models are loaded
  useEffect(() => {
    if (testableModels.length > 0 && !selectedModel) {
      setSelectedModel(testableModels[0].modelId);
    }
  }, [testableModels, selectedModel]);

  const handleRunTest = async () => {
    if (!selectedModel) return;
    const modelObj = testableModels.find((m) => m.modelId === selectedModel);
    if (!modelObj) return;

    setTestLoading(true);
    setTestResult(null);

    try {
      const payload: any = { model: selectedModel };
      if (useCustomKey && customKey.trim()) {
        payload.key = customKey.trim();
      }

      const res = await fetch(`/api/admin/providers/${modelObj.providerId}/keys/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setTestResult({
          success: false,
          status: res.status,
          error: data.error?.message || 'Verification request failed',
        });
      } else if (data.valid) {
        setTestResult({ success: true });
      } else {
        setTestResult({
          success: false,
          status: data.status || 400,
          error: data.error || 'Invalid API Key',
        });
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        status: 500,
        error: e instanceof Error ? e.message : 'Unknown network/server error',
      });
    } finally {
      setTestLoading(false);
    }
  };
  const [generatedKey, setGeneratedKey] = useState<string>('');
  const [generatedKeyExpires, setGeneratedKeyExpires] = useState<string>('');
  const [tempKeyLoading, setTempKeyLoading] = useState<boolean>(false);
  const [tempKeyMessage, setTempKeyMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleGenerateTempKey = async () => {
    setTempKeyLoading(true);
    setTempKeyMessage(null);
    setGeneratedKey('');
    setGeneratedKeyExpires('');
    setCopied(false);
    try {
      const res = await fetch('/api/admin/temp-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ durationSeconds: tempDuration }),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error?.message || 'Failed to generate temporary key');
      }
      setGeneratedKey(resData.key);
      setGeneratedKeyExpires(resData.expiresAt);
      setTempKeyMessage({ text: lang === 'zh' ? '生成成功！' : 'Key generated successfully!', type: 'success' });
    } catch (e) {
      setTempKeyMessage({
        text: e instanceof Error ? e.message : (lang === 'zh' ? '生成失败' : 'Failed to generate temporary key'),
        type: 'error',
      });
    } finally {
      setTempKeyLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-select {
          appearance: none;
          background-image: url("data:image/svg+xml;utf8,<svg fill='none' height='24' stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><polyline points='6 9 12 15 18 9'/></svg>");
          background-repeat: no-repeat;
          background-position: right 0.5rem center;
          background-size: 1rem;
          padding-right: 2rem !important;
        }
      `}} />

      {/* Temporary API Key Generator */}
      <section className="glass-panel">
        <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '0.5rem', color: '#fff', fontWeight: 600 }}>
          {t.tempKeyTitle}
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: 0, marginBottom: '1.5rem', lineHeight: '1.5' }}>
          {t.tempKeyDesc}
        </p>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#d1d5db', fontSize: '0.9rem' }}>{t.tempDurationLabel}</span>
            <select
              value={tempDuration}
              onChange={(e) => setTempDuration(Number(e.target.value))}
              disabled={tempKeyLoading}
              className="custom-select"
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value={3600}>{t.duration1h}</option>
              <option value={86400}>{t.duration1d}</option>
              <option value={604800}>{t.duration7d}</option>
              <option value={2592000}>{t.duration30d}</option>
            </select>
          </div>

          <button
            onClick={handleGenerateTempKey}
            disabled={tempKeyLoading}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#10b981',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              cursor: tempKeyLoading ? 'wait' : 'pointer',
              opacity: tempKeyLoading ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#059669'; }}
            onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#10b981'; }}
          >
            {tempKeyLoading ? '...' : t.generateBtn}
          </button>
        </div>

        {tempKeyMessage && (
          <p style={{
            color: tempKeyMessage.type === 'error' ? '#ef4444' : '#10b981',
            fontSize: '0.9rem',
            margin: '0.5rem 0',
            fontWeight: 500
          }}>
            {tempKeyMessage.text}
          </p>
        )}

        {generatedKey && (
          <div style={{
            marginTop: '1.25rem',
            padding: '1.25rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
          }} className="config-card">
            <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.5rem', fontWeight: 500 }}>
              {t.generatedKeyLabel}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                readOnly
                value={generatedKey}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  color: '#10b981',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleCopy}
                style={{
                  padding: '0.6rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#34d399',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)'; }}
              >
                {copied ? t.copied : t.copy}
              </button>
            </div>
            {generatedKeyExpires && (
              <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.75rem' }}>
                {t.expiresAtLabel} <code style={{ fontFamily: 'monospace', color: '#f3f4f6' }}>{new Date(generatedKeyExpires).toLocaleString()}</code>
              </div>
            )}
          </div>
        )}

        <div style={{
          marginTop: '1.25rem',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          backgroundColor: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid rgba(239, 68, 68, 0.15)',
          color: '#fca5a5',
          fontSize: '0.85rem',
          lineHeight: '1.4'
        }}>
          {t.tempKeyNotice}
        </div>
      </section>

      {/* Model & Key Connectivity Test */}
      <section className="glass-panel">
        <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '0.5rem', color: '#fff', fontWeight: 600 }}>
          {t.testToolTitle}
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: 0, marginBottom: '1.5rem', lineHeight: '1.5' }}>
          {t.testToolDesc}
        </p>

        {testableModels.length === 0 ? (
          <div style={{
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            color: '#fca5a5',
            fontSize: '0.9rem',
          }}>
            {t.noConfiguredModels}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Model Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ color: '#d1d5db', fontSize: '0.9rem', fontWeight: 500 }}>
                {t.testModelLabel}
              </label>
              <select
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  setTestResult(null);
                }}
                disabled={testLoading}
                className="custom-select"
                style={{
                  width: '100%',
                  maxWidth: '500px',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {testableModels.map((m) => (
                  <option key={`${m.providerId}:${m.modelId}`} value={m.modelId}>
                    [{m.providerName}] {m.displayName} ({m.modelId})
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Key Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <input
                type="checkbox"
                id="useCustomKey"
                checked={useCustomKey}
                onChange={(e) => {
                  setUseCustomKey(e.target.checked);
                  setTestResult(null);
                }}
                disabled={testLoading}
                style={{ cursor: 'pointer', width: '1.1rem', height: '1.1rem' }}
              />
              <label htmlFor="useCustomKey" style={{ color: '#d1d5db', fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none' }}>
                {t.useCustomKeyLabel}
              </label>
            </div>

            {/* Custom Key Input */}
            {useCustomKey && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: '500px' }}>
                <input
                  type="password"
                  placeholder={t.customKeyPlaceholder}
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  disabled={testLoading}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontFamily: 'monospace',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {/* Run Button */}
            <div>
              <button
                onClick={handleRunTest}
                disabled={testLoading || !selectedModel || (useCustomKey && !customKey.trim())}
                style={{
                  padding: '0.5rem 2rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  cursor: testLoading ? 'wait' : 'pointer',
                  opacity: (testLoading || !selectedModel || (useCustomKey && !customKey.trim())) ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#2563eb'; }}
                onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#3b82f6'; }}
              >
                {testLoading ? t.btnTesting : t.btnRunTest}
              </button>
            </div>

            {/* Test Result Display */}
            {testResult && (
              <div style={{
                marginTop: '0.5rem',
                padding: '1.25rem',
                borderRadius: '8px',
                backgroundColor: testResult.success ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                border: testResult.success ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)',
                color: testResult.success ? '#34d399' : '#fca5a5',
                fontSize: '0.9rem',
                lineHeight: '1.5',
              }}>
                {testResult.success ? (
                  <div style={{ fontWeight: 500 }}>{t.testResultSuccess}</div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{t.testResultFailed}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#f87171', wordBreak: 'break-all' }}>
                      {t.testResultFailedDetails
                        .replace('{status}', String(testResult.status || 'unknown'))
                        .replace('{error}', testResult.error || '')}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
