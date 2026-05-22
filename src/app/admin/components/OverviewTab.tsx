'use client';

import TokenTrendChart from './TokenTrendChart';

interface ProviderInfo {
  name: string;
  id: string;
  keyCount: number;
  availableKeys: number;
  configured: boolean;
  modelPrefixes: string[];
  errors?: Record<string, number>;
  keyErrors?: Array<{
    keyHash: string;
    errors: Record<string, { count: number; reason: string }>;
  }>;
}

interface AdminData {
  status: string;
  timestamp: string;
  providers: ProviderInfo[];
  usage: {
    requests: number;
    tokens: number;
    promptTokens: number;
    completionTokens: number;
    providers: Record<string, { requests: number; tokens: number; promptTokens: number; completionTokens: number }>;
  };
  quota: {
    daily: { used: number; limit: number | string };
    monthly: { used: number; limit: number | string };
    allowed: boolean;
  };
  config: {
    dailyLimit: number | null;
    monthlyLimit: number | null;
  };
}

interface OverviewTabProps {
  data: AdminData;
  apiKey: string;
  lang: 'zh' | 'en';
  t: any;
  testingHash: string | null;
  operationLoading: boolean;
  onTestKey: (providerId: string, hash: string) => Promise<void>;
  onDeleteKey: (providerId: string, hash: string) => Promise<void>;
}

export default function OverviewTab({
  data,
  apiKey,
  lang,
  t,
  testingHash,
  operationLoading,
  onTestKey,
  onDeleteKey,
}: OverviewTabProps) {
  const fmtNum = (n: number) => n.toLocaleString();
  const fmtTokens = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Quota Status */}
      <section className="glass-panel">
        <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '1.25rem', color: '#fff', fontWeight: 600 }}>
          {t.quotaStatus}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          <div className="stat-card">
            <span style={{ color: '#9ca3af', fontSize: '0.85rem', fontWeight: 500 }}>{t.dailyRequests}</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '0.4rem', color: '#f3f4f6' }}>
              {fmtNum(data.quota.daily.used)}
              <span style={{ color: '#4b5563', fontSize: '1rem', fontWeight: 'normal' }}>
                {' / '}{typeof data.quota.daily.limit === 'number' ? fmtNum(data.quota.daily.limit) : '∞'}
              </span>
            </div>
          </div>
          <div className="stat-card">
            <span style={{ color: '#9ca3af', fontSize: '0.85rem', fontWeight: 500 }}>{t.monthlyRequests}</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '0.4rem', color: '#f3f4f6' }}>
              {fmtNum(data.quota.monthly.used)}
              <span style={{ color: '#4b5563', fontSize: '1rem', fontWeight: 'normal' }}>
                {' / '}{typeof data.quota.monthly.limit === 'number' ? fmtNum(data.quota.monthly.limit) : '∞'}
              </span>
            </div>
          </div>
        </div>
        <div style={{
          marginTop: '1.25rem', padding: '0.4rem 0.8rem', borderRadius: '6px',
          display: 'inline-block', fontSize: '0.85rem', fontWeight: 500,
          backgroundColor: data.quota.allowed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: data.quota.allowed ? '#34d399' : '#fca5a5',
          border: data.quota.allowed ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
        }}>
          {data.quota.allowed ? t.withinLimits : t.rateLimited}
        </div>
      </section>

      {/* Today's Usage */}
      <section className="glass-panel">
        <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '1.25rem', color: '#fff', fontWeight: 600 }}>
          {t.todaysUsage}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{t.requests}</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '0.4rem', color: '#fff' }}>
              {fmtNum(data.usage.requests)}
            </div>
          </div>
          <div className="stat-card">
            <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{t.totalTokens}</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '0.4rem', color: '#fff' }}>
              {fmtTokens(data.usage.tokens)}
            </div>
          </div>
          <div className="stat-card">
            <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{t.promptTokens}</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '0.4rem', color: '#60a5fa' }}>
              {fmtTokens(data.usage.promptTokens || 0)}
            </div>
          </div>
          <div className="stat-card">
            <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{t.completionTokens}</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '0.4rem', color: '#34d399' }}>
              {fmtTokens(data.usage.completionTokens || 0)}
            </div>
          </div>
        </div>

        {/* Per-provider usage breakdown */}
        {data.usage.providers && Object.keys(data.usage.providers).length > 0 && (
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', color: '#e5e7eb', marginBottom: '1rem', fontWeight: 600 }}>
              {t.byProvider}
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: '#9ca3af', fontWeight: 500 }}>{t.providerCol}</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem', color: '#9ca3af', fontWeight: 500 }}>{t.requestsCol}</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem', color: '#9ca3af', fontWeight: 500 }}>{t.promptCol}</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem', color: '#9ca3af', fontWeight: 500 }}>{t.completionCol}</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem', color: '#9ca3af', fontWeight: 500 }}>{t.totalCol}</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.usage.providers).map(([name, stats]) => (
                    <tr key={name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500, color: '#f3f4f6' }}>{name}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#d1d5db' }}>{fmtNum(stats.requests)}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#60a5fa' }}>{fmtTokens(stats.promptTokens)}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#34d399' }}>{fmtTokens(stats.completionTokens)}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 600, color: '#fff' }}>{fmtTokens(stats.tokens)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Token Consumption Trend */}
      <TokenTrendChart apiKey={apiKey} lang={lang} />

      {/* Error Statistics */}
      {data.providers.some((p) => p.errors && Object.keys(p.errors).length > 0) && (
        <section className="glass-panel">
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '1.25rem', color: '#ef4444', fontWeight: 600 }}>
            {t.apiErrorsTitle}
          </h2>
          {data.providers
            .filter((p) => p.errors && Object.keys(p.errors).length > 0)
            .map((p) => (
              <div key={p.id} style={{ marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.75rem', color: '#f87171', fontSize: '1rem' }}>
                  {p.name}
                </div>
                
                {/* Summary by status code */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  {Object.entries(p.errors!).map(([code, count]) => (
                    <span key={code} style={{
                      padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem',
                      backgroundColor: code === '429' ? 'rgba(245, 158, 11, 0.15)' : code.startsWith('4') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      color: code === '429' ? '#fbbf24' : code.startsWith('4') ? '#fca5a5' : '#9ca3af',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}>
                      HTTP {code}: <strong>{count}</strong> {t.times}
                    </span>
                  ))}
                </div>
                
                {/* Per-key breakdown */}
                {p.keyErrors && p.keyErrors.length > 0 && (
                  <div style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {p.keyErrors.map((ke) => (
                      <div key={ke.keyHash} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', padding: '0.4rem', borderRadius: '6px', background: 'rgba(255,255,255,0.01)' }}>
                        <span style={{ fontFamily: 'monospace', color: '#f3f4f6', backgroundColor: '#1f2937', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                          key:{ke.keyHash.slice(0, 8)}
                        </span>
                        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                          {Object.entries(ke.errors).map(([code, detail]) => (
                            <span key={code} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              <span style={{ color: '#fca5a5' }}>HTTP {code}×{detail.count}</span>
                              {detail.reason && (
                                <span style={{ color: '#6b7280' }}>
                                  ({detail.reason})
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginLeft: 'auto' }}>
                          <button
                            onClick={() => onTestKey(p.id, ke.keyHash)}
                            disabled={operationLoading || testingHash !== null}
                            style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              color: '#60a5fa',
                              fontSize: '0.75rem',
                              cursor: operationLoading || testingHash !== null ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            {testingHash === ke.keyHash ? t.btnTestingKey : t.btnTestKey}
                          </button>
                          <button
                            onClick={() => onDeleteKey(p.id, ke.keyHash)}
                            disabled={operationLoading}
                            style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              color: '#f87171',
                              fontSize: '0.75rem',
                              cursor: operationLoading ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            {t.btnDeleteKey}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </section>
      )}
    </div>
  );
}
