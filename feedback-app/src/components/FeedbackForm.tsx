import React, { useState, useEffect } from 'react';
import StarRating from './StarRating';
import { FeedbackFormData, Language } from '../types';
import { translations } from '../utils/translations';
import { submitFeedback, getBranches } from '../utils/api';

const LOLC_BLUE = '#0C004B';
const SERVICE_TYPES = ['Loans', 'Savings', 'Insurance', 'Leasing'];

const SelectField: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  error?: boolean;
}> = ({ label, value, onChange, options, placeholder, error }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <label style={{
      fontSize: '11px', fontWeight: 700, color: '#888',
      textTransform: 'uppercase', letterSpacing: '0.6px',
    }}>
      {label}
      {error && <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%', padding: '8px 10px',
        border: '1px solid ' + (error ? '#dc2626' : '#D1D5DB'),
        borderRadius: '6px', fontSize: '13px',
        fontFamily: "'Inter', sans-serif",
        color: value ? '#333333' : '#9CA3AF',
        outline: 'none', background: 'white', cursor: 'pointer',
        boxSizing: 'border-box' as const,
        boxShadow: error ? '0 0 0 2px rgba(220,38,38,0.15)' : 'none',
      }}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

const FeedbackForm: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [branches, setBranches] = useState<{ value: string; label: string }[]>([]);
  const [formData, setFormData] = useState<FeedbackFormData>({
    customerService: 0,
    branchEnvironment: 0,
    recommendation: 0,
    additionalComments: '',
    branchId: '',
    serviceType: '',
  });
  const [serviceType, setServiceType] = useState('');
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Load branches from the backend when the form loads
  useEffect(() => {
    getBranches()
      .then((data: any[]) => {
        setBranches(data.map((b: any) => ({ value: b.id, label: b.name })));
      })
      .catch(() => {
        // Fallback if API is not reachable
        setBranches([
          { value: 'colombo', label: 'Colombo Main' },
          { value: 'kandy', label: 'Kandy' },
          { value: 'galle', label: 'Galle' },
          { value: 'negombo', label: 'Negombo' },
          { value: 'kurunegala', label: 'Kurunegala' },
        ]);
      });
  }, []);

  const t = translations[lang];

  const validate = (): boolean => {
    const newErrors: Record<string, boolean> = {};
    if (!formData.customerService) newErrors.customerService = true;
    if (!formData.branchEnvironment) newErrors.branchEnvironment = true;
    if (!formData.recommendation) newErrors.recommendation = true;
    if (!formData.branchId) newErrors.branchId = true;
    if (!serviceType) newErrors.serviceType = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await submitFeedback({ ...formData, serviceType });
      setIsSuccess(true);
    } catch (err) {
      setSubmitError(t.errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      customerService: 0, branchEnvironment: 0, recommendation: 0,
      additionalComments: '', branchId: '', serviceType: '',
    });
    setServiceType('');
    setErrors({});
    setIsSuccess(false);
    setSubmitError('');
  };

  const questions = [
    { key: 'customerService' as const, label: t.question1 },
    { key: 'branchEnvironment' as const, label: t.question2 },
    { key: 'recommendation' as const, label: t.question3 },
  ];

  const serviceOptions = SERVICE_TYPES.map(s => ({ value: s, label: s }));

  return (
    <div style={{
      minHeight: '100vh', background: '#F8F8FC',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* Header */}
      <div style={{
        width: '100%', background: LOLC_BLUE, padding: '20px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(12,0,75,0.15)', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 40, height: 40, background: 'rgba(255,255,255,0.15)',
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F4F4F4" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h1 style={{ color: '#F4F4F4', fontSize: '22px', fontWeight: 700, margin: 0 }}>
            LOLC {t.title}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['en', 'si', 'ta'] as Language[]).map((l) => (
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

      {/* Main Content */}
      <div style={{ width: '100%', maxWidth: '480px', padding: '24px 16px 40px', flex: 1 }}>

        {/* Success Screen */}
        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{
              width: 80, height: 80,
              background: 'linear-gradient(135deg, #0C004B, #2D1B8E)',
              borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 24px',
              boxShadow: '0 8px 32px rgba(12,0,75,0.3)',
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#F4F4F4" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 style={{ fontSize: '30px', fontWeight: 700, color: '#333333', marginBottom: '12px' }}>
              {t.successTitle}
            </h2>
            <p style={{ fontSize: '16px', color: '#666', lineHeight: 1.6, marginBottom: '32px' }}>
              {t.successMessage}
            </p>
            <button onClick={handleReset} style={{
              background: LOLC_BLUE, color: '#F4F4F4', border: 'none',
              borderRadius: '12px', padding: '14px 32px',
              fontSize: '16px', fontWeight: 600, cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
            }}>
              Submit Another
            </button>
          </div>

        ) : (
          <form onSubmit={handleSubmit} noValidate>

            {/* Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #0C004B 0%, #1a0a7a 100%)',
              borderRadius: '16px', padding: '20px', marginBottom: '20px',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', right: -20, top: -20,
                width: 100, height: 100,
                background: 'rgba(255,255,255,0.05)', borderRadius: '50%',
              }} />
              <p style={{ color: 'rgba(244,244,244,0.8)', fontSize: '14px', margin: '0 0 4px', position: 'relative' }}>
                Your opinion matters to us
              </p>
              <p style={{ color: '#F4F4F4', fontSize: '16px', fontWeight: 500, margin: 0, position: 'relative', lineHeight: 1.5 }}>
                Please take a moment to rate your experience at your LOLC branch.
              </p>
            </div>

            {/* Branch + Service Type side by side */}
            <div style={{
              background: 'white', borderRadius: '16px', padding: '16px', marginBottom: '16px',
              boxShadow: (errors.branchId || errors.serviceType)
                ? '0 0 0 2px #dc2626, 0 2px 8px rgba(0,0,0,0.06)'
                : '0 2px 8px rgba(0,0,0,0.06)',
              border: (errors.branchId || errors.serviceType)
                ? '1px solid #fca5a5' : '1px solid transparent',
            }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <SelectField
                    label="Branch"
                    value={formData.branchId || ''}
                    onChange={(val) => {
                      setFormData(prev => ({ ...prev, branchId: val }));
                      setErrors(prev => ({ ...prev, branchId: false }));
                    }}
                    options={branches}
                    placeholder="Select branch"
                    error={errors.branchId}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <SelectField
                    label="Service Type"
                    value={serviceType}
                    onChange={(val) => {
                      setServiceType(val);
                      setErrors(prev => ({ ...prev, serviceType: false }));
                    }}
                    options={serviceOptions}
                    placeholder="Select service"
                    error={errors.serviceType}
                  />
                </div>
              </div>
              {(errors.branchId || errors.serviceType) && (
                <p style={{ color: '#dc2626', fontSize: '12px', margin: '8px 0 0' }}>
                  Please select both a branch and service type
                </p>
              )}
            </div>

            {/* Star Ratings */}
            {questions.map((q, idx) => (
              <div key={q.key} style={{
                background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px',
                boxShadow: errors[q.key]
                  ? '0 0 0 2px #dc2626, 0 2px 8px rgba(0,0,0,0.06)'
                  : '0 2px 8px rgba(0,0,0,0.06)',
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
                    <p style={{ fontSize: '16px', fontWeight: 500, color: '#333333', margin: 0, lineHeight: 1.45 }}>
                      {q.label}
                    </p>
                    <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 500 }}>* Required</span>
                  </div>
                </div>
                <StarRating
                  value={formData[q.key]}
                  onChange={(val) => {
                    setFormData(prev => ({ ...prev, [q.key]: val }));
                    setErrors(prev => ({ ...prev, [q.key]: false }));
                  }}
                  error={errors[q.key]}
                />
                {errors[q.key] && (
                  <p style={{ color: '#dc2626', fontSize: '13px', textAlign: 'center', marginTop: '8px', marginBottom: 0 }}>
                    {t.required}
                  </p>
                )}
              </div>
            ))}

            {/* Additional Comments */}
            <div style={{
              background: 'white', borderRadius: '16px', padding: '20px',
              marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
              <label style={{
                display: 'block', fontSize: '16px', fontWeight: 500,
                color: '#333333', marginBottom: '4px',
              }}>
                {t.additionalComments}
                <span style={{ fontSize: '13px', color: '#999', fontWeight: 400, marginLeft: '8px' }}>
                  (optional)
                </span>
              </label>
              <textarea
                value={formData.additionalComments}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalComments: e.target.value }))}
                placeholder={t.commentsPlaceholder}
                rows={4}
                style={{
                  width: '100%', border: '1.5px solid #E2E8F0', borderRadius: '10px',
                  padding: '12px', fontSize: '16px', fontFamily: "'Inter', sans-serif",
                  color: '#333333', resize: 'vertical', outline: 'none',
                  boxSizing: 'border-box' as const, marginTop: '8px',
                }}
                onFocus={(e) => e.target.style.borderColor = LOLC_BLUE}
                onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
              />
            </div>

            {submitError && (
              <div style={{
                background: '#fee2e2', border: '1px solid #fca5a5',
                borderRadius: '10px', padding: '12px 16px',
                marginBottom: '16px', color: '#dc2626', fontSize: '14px',
              }}>
                {submitError}
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" disabled={isSubmitting} style={{
              width: '100%',
              background: isSubmitting
                ? 'rgba(12,0,75,0.5)'
                : 'linear-gradient(135deg, #0C004B 0%, #1a0a7a 100%)',
              color: '#F4F4F4', border: 'none', borderRadius: '14px', padding: '16px',
              fontSize: '16px', fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontFamily: "'Inter', sans-serif",
              boxShadow: isSubmitting ? 'none' : '0 4px 16px rgba(12,0,75,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              {isSubmitting ? (
                <>
                  <div style={{
                    width: 18, height: 18,
                    border: '2px solid rgba(244,244,244,0.3)',
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

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        textarea::placeholder { color: #A0AEC0; }
        select option { color: #333333; }
        button:active { transform: scale(0.98); }
      `}</style>
    </div>
  );
};

export default FeedbackForm;