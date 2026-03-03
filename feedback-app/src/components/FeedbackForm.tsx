import React, { useState, useEffect, useRef } from 'react';
import StarRating from './StarRating';
import { Branch, FeedbackFormData, Language } from '../types';
import { translations } from '../utils/translations';
import { submitFeedback, getBranches } from '../utils/api';

const LOLC_BLUE = '#0C004B';

const SERVICE_TYPES = ['Loans', 'Savings', 'Insurance', 'Leasing'];

// ── Compact searchable combobox (no separate card, used inline) ───────────────
const ComboBox: React.FC<{
  label: string;
  value: string;
  displayValue: string;
  onSelect: (id: string, name: string) => void;
  options: { id: string; label: string }[];
  placeholder: string;
  searchPlaceholder: string;
  notFoundText: string;
  selectErrorText: string;
  error?: boolean;
}> = ({
  label, value, displayValue, onSelect,
  options, placeholder, searchPlaceholder, notFoundText,
  selectErrorText, error,
}) => {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const containerRef      = useRef<HTMLDivElement>(null);
  const inputRef          = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleOpen = () => {
    setOpen(true);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelect = (id: string, lbl: string) => {
    onSelect(id, lbl);
    setOpen(false);
    setQuery('');
  };

  const handleManualInput = (val: string) => {
    setQuery(val);
    onSelect('', val);
  };

  const shown = displayValue || '';

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{
        fontSize: '11px', fontWeight: 700, color: '#888',
        textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 6px',
      }}>{label}</p>

      <div ref={containerRef} style={{ position: 'relative' }}>
        <div onClick={handleOpen} style={{
          padding: '10px 32px 10px 12px',
          border: '1.5px solid ' + (error ? '#dc2626' : open ? LOLC_BLUE : '#E2E8F0'),
          borderRadius: '8px', fontSize: '14px',
          color: shown ? '#333' : '#A0AEC0',
          background: 'white', cursor: 'pointer',
          display: 'flex', alignItems: 'center',
          userSelect: 'none', transition: 'border-color 0.2s',
          position: 'relative', minHeight: '42px',
        }}>
          <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
            {shown || placeholder}
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"
            style={{ position:'absolute', right:10, transform: open?'rotate(180deg)':'none', transition:'0.2s' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>

        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 500,
            background: 'white', border: '1.5px solid #E2E8F0', borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
          }}>
            <div style={{ padding: '8px 8px 4px' }}>
              <input
                ref={inputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={query}
                onChange={e => {
                  const val = e.target.value;
                  setQuery(val);
                  const match = options.find(o => o.label.toLowerCase() === val.toLowerCase());
                  if (!match && val) handleManualInput(val);
                }}
                style={{
                  width: '100%', padding: '7px 10px',
                  border: '1.5px solid #E2E8F0', borderRadius: '6px',
                  fontSize: '13px', outline: 'none',
                  fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' as const,
                }}
              />
            </div>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {filtered.length > 0 ? filtered.map(o => (
                <div key={o.id} onClick={() => handleSelect(o.id, o.label)}
                  style={{
                    padding: '10px 12px', fontSize: '13px', cursor: 'pointer',
                    color: value === o.id ? LOLC_BLUE : '#333',
                    fontWeight: value === o.id ? 600 : 400,
                    background: value === o.id ? 'rgba(12,0,75,0.05)' : 'white',
                    borderBottom: '1px solid #F8F8FC',
                  }}
                  onMouseEnter={e => { if (value !== o.id) e.currentTarget.style.background = '#F8F8FC'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = value === o.id ? 'rgba(12,0,75,0.05)' : 'white'; }}
                >{o.label}</div>
              )) : (
                <div style={{ padding: '10px 12px', fontSize: '12px', color: '#aaa', fontStyle: 'italic' }}>
                  {notFoundText}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', marginBottom: 0 }}>
          {selectErrorText}
        </p>
      )}
    </div>
  );
};

// ── Main form ─────────────────────────────────────────────────────────────────
const FeedbackForm: React.FC = () => {
  const [lang, setLang]           = useState<Language>('en');
  const [branches, setBranches]   = useState<Branch[]>([]);
  const [formData, setFormData]   = useState<FeedbackFormData>({
    customerService: 0, branchEnvironment: 0, recommendation: 0,
    additionalComments: '', branchId: '', branchName: '',
  });
  const [serviceType, setServiceType]       = useState('');
  const [serviceDisplay, setServiceDisplay] = useState('');
  const [errors, setErrors]                 = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [isSuccess, setIsSuccess]           = useState(false);
  const [submitError, setSubmitError]       = useState('');

  const t = translations[lang];

  // Load branches from backend on mount
  useEffect(() => {
    getBranches().then(data => setBranches(data || [])).catch(() => setBranches([]));
  }, []);

  const validate = (): boolean => {
    const e: Record<string, boolean> = {};
    if (!formData.customerService)  e.customerService  = true;
    if (!formData.branchEnvironment) e.branchEnvironment = true;
    if (!formData.recommendation)   e.recommendation   = true;
    // Branch valid if either an id is selected OR a name was typed
    if (!formData.branchId && !formData.branchName) e.branchId = true;
    if (!serviceType) e.serviceType = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await submitFeedback({ ...formData, serviceType });
      setIsSuccess(true);
    } catch {
      setSubmitError(t.errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({ customerService: 0, branchEnvironment: 0, recommendation: 0, additionalComments: '', branchId: '', branchName: '' });
    setServiceType('');
    setServiceDisplay('');
    setErrors({});
    setIsSuccess(false);
    setSubmitError('');
  };

  const questions = [
    { key: 'customerService'   as const, label: t.question1 },
    { key: 'branchEnvironment' as const, label: t.question2 },
    { key: 'recommendation'    as const, label: t.question3 },
  ];

  const branchOptions = branches.map(b => ({ id: b.id, label: b.name }));
  const serviceOptions = SERVICE_TYPES.map(s => ({ id: s, label: s }));

  return (
    <div style={{
      minHeight: '100vh', background: '#F8F8FC',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* ── Header ── */}
      <div style={{
        width: '100%', background: LOLC_BLUE, padding: '18px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(12,0,75,0.15)', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 38, height: 38, background: 'rgba(255,255,255,0.15)',
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F4F4F4" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h1 style={{ color: '#F4F4F4', fontSize: '20px', fontWeight: 700, margin: 0 }}>
            LOLC {t.title}
          </h1>
        </div>
        {/* Language switcher */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['en', 'si', 'ta'] as Language[]).map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              padding: '5px 10px', borderRadius: '6px',
              border: lang === l ? '1.5px solid #F4F4F4' : '1.5px solid rgba(255,255,255,0.3)',
              background: lang === l ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: '#F4F4F4', fontSize: '12px', fontWeight: lang === l ? 600 : 400,
              cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            }}>
              {l === 'en' ? 'En' : l === 'si' ? 'සි' : 'த'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ width: '100%', maxWidth: '480px', padding: '24px 16px 48px', flex: 1 }}>

        {isSuccess ? (
          // ── Success screen ──
          <div style={{ textAlign: 'center', padding: '56px 24px' }}>
            <div style={{
              width: 84, height: 84,
              background: 'linear-gradient(135deg, #0C004B, #2D1B8E)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 8px 32px rgba(12,0,75,0.3)',
            }}>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#F4F4F4" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#333', marginBottom: '12px' }}>
              {t.successTitle}
            </h2>
            <p style={{ fontSize: '16px', color: '#666', lineHeight: 1.6, marginBottom: '32px' }}>
              {t.successMessage}
            </p>
            <button onClick={handleReset} style={{
              background: LOLC_BLUE, color: '#F4F4F4', border: 'none',
              borderRadius: '12px', padding: '14px 32px', fontSize: '16px',
              fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            }}>
              {t.submitAnother}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>

            {/* Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #0C004B 0%, #1a0a7a 100%)',
              borderRadius: '16px', padding: '20px', marginBottom: '20px',
            }}>
              <p style={{ color: 'rgba(244,244,244,0.8)', fontSize: '13px', margin: '0 0 4px' }}>
                {t.subtitle}
              </p>
              <p style={{ color: '#F4F4F4', fontSize: '15px', fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
                {t.bannerText}
              </p>
            </div>

            {/* Branch + Service — compact side-by-side card matching screenshot */}
            <div style={{
              background: 'white', borderRadius: '16px', padding: '16px',
              marginBottom: '16px',
              boxShadow: (errors.branchId || errors.serviceType)
                ? '0 0 0 2px #dc2626, 0 2px 8px rgba(0,0,0,0.06)'
                : '0 2px 8px rgba(0,0,0,0.06)',
              border: (errors.branchId || errors.serviceType) ? '1px solid #fca5a5' : '1px solid transparent',
            }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <ComboBox
                  label={t.branchLabel}
                  value={formData.branchId || ''}
                  displayValue={formData.branchName || ''}
                  onSelect={(id, name) => {
                    setFormData((prev: FeedbackFormData) => ({ ...prev, branchId: id, branchName: name }));
                    setErrors((prev: Record<string, boolean>) => ({ ...prev, branchId: false }));
                  }}
                  options={branchOptions}
                  placeholder={t.branchPlaceholder}
                  searchPlaceholder={t.branchSearch}
                  notFoundText={t.branchNotFound}
                  selectErrorText={t.selectError}
                  error={errors.branchId}
                />
                <ComboBox
                  label={t.serviceLabel}
                  value={serviceType}
                  displayValue={serviceDisplay}
                  onSelect={(id, name) => {
                    setServiceType(id || name);
                    setServiceDisplay(name);
                    setErrors((prev: Record<string, boolean>) => ({ ...prev, serviceType: false }));
                  }}
                  options={serviceOptions}
                  placeholder={t.servicePlaceholder}
                  searchPlaceholder={t.serviceSearch}
                  notFoundText={t.serviceNotFound}
                  selectErrorText={t.selectError}
                  error={errors.serviceType}
                />
              </div>
            </div>

            {/* Star rating questions */}
            {questions.map((q, idx) => (
              <div key={q.key} style={{
                background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px',
                boxShadow: errors[q.key] ? '0 0 0 2px #dc2626, 0 2px 8px rgba(0,0,0,0.06)' : '0 2px 8px rgba(0,0,0,0.06)',
                border: errors[q.key] ? '1px solid #fca5a5' : '1px solid transparent',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '16px' }}>
                  <div style={{
                    minWidth: 28, height: 28,
                    background: errors[q.key] ? '#fee2e2' : 'rgba(12,0,75,0.08)',
                    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700,
                    color: errors[q.key] ? '#dc2626' : LOLC_BLUE,
                  }}>
                    {idx + 1}
                  </div>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 500, color: '#333', margin: 0, lineHeight: 1.45 }}>
                      {q.label}
                    </p>
                    <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 500 }}>{t.required}</span>
                  </div>
                </div>
                <StarRating
                  value={formData[q.key]}
                  onChange={val => {
                    setFormData((prev: FeedbackFormData) => ({ ...prev, [q.key]: val }));
                    setErrors((prev: Record<string, boolean>) => ({ ...prev, [q.key]: false }));
                  }}
                  error={errors[q.key]}
                />
                {errors[q.key] && (
                  <p style={{ color: '#dc2626', fontSize: '13px', textAlign: 'center', marginTop: '8px', marginBottom: 0 }}>
                    {t.rateRequired}
                  </p>
                )}
              </div>
            ))}

            {/* Additional comments */}
            <div style={{
              background: 'white', borderRadius: '16px', padding: '20px',
              marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
              <label style={{ display: 'block', fontSize: '15px', fontWeight: 600, color: '#333', marginBottom: '4px' }}>
                {t.additionalComments}
                <span style={{ fontSize: '13px', color: '#999', fontWeight: 400, marginLeft: '8px' }}>
                  {t.optional}
                </span>
              </label>
              <textarea
                value={formData.additionalComments}
                onChange={e => setFormData((prev: FeedbackFormData) => ({ ...prev, additionalComments: e.target.value }))}
                placeholder={t.commentsPlaceholder}
                rows={4}
                style={{
                  width: '100%', border: '1.5px solid #E2E8F0', borderRadius: '10px',
                  padding: '12px', fontSize: '15px', fontFamily: "'Inter', sans-serif",
                  color: '#333', resize: 'vertical', outline: 'none',
                  boxSizing: 'border-box' as const, marginTop: '8px',
                }}
              />
            </div>

            {submitError && (
              <div style={{
                background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px',
                padding: '12px 16px', marginBottom: '16px', color: '#dc2626', fontSize: '14px',
              }}>
                {submitError}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} style={{
              width: '100%',
              background: isSubmitting ? 'rgba(12,0,75,0.5)' : 'linear-gradient(135deg, #0C004B 0%, #1a0a7a 100%)',
              color: '#F4F4F4', border: 'none', borderRadius: '14px', padding: '16px',
              fontSize: '16px', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontFamily: "'Inter', sans-serif",
              boxShadow: isSubmitting ? 'none' : '0 4px 16px rgba(12,0,75,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              {isSubmitting ? (
                <>
                  <div style={{
                    width: 18, height: 18, border: '2px solid rgba(244,244,244,0.3)',
                    borderTopColor: '#F4F4F4', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  {t.submitting}
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F4F4F4" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  {t.submitButton}
                </>
              )}
            </button>
          </form>
        )}
      </div>


      {/* Footer */}
      <div style={{
        width: '100%', borderTop: '1px solid #E2E8F0',
        padding: '14px 24px', textAlign: 'center',
        background: '#F8F8FC',
      }}>
        <p style={{ fontSize: '12px', color: '#aaa', margin: 0, letterSpacing: '0.3px' }}>
          2026 Powered By LOLC Technologies Ltd
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea::placeholder { color: #A0AEC0; }
        input::placeholder { color: #A0AEC0; }
        button:active { transform: scale(0.98); }
      `}</style>
    </div>
  );
};

export default FeedbackForm;
