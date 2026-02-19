import React from 'react';
import { FeedbackEntry } from '../types';

const LOLC_BLUE = '#0C004B';

interface FeedbackModalProps {
  feedback: FeedbackEntry | null;
  onClose: () => void;
}

const StarDisplay: React.FC<{ rating: number }> = ({ rating }) => (
  <div style={{ display: 'flex', gap: '2px' }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <svg key={s} width="18" height="18" viewBox="0 0 24 24"
        fill={s <= rating ? '#F4A61D' : 'none'}
        stroke={s <= rating ? '#F4A61D' : '#CBD5E0'}
        strokeWidth="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ))}
  </div>
);

const getBadgeStyle = (rating: number): React.CSSProperties => {
  if (rating >= 4.5) return { background: '#d1fae5', color: '#065f46' };
  if (rating >= 3.5) return { background: '#dbeafe', color: '#1e40af' };
  if (rating >= 2.5) return { background: '#fef3c7', color: '#92400e' };
  return { background: '#fee2e2', color: '#991b1b' };
};

const getBadgeLabel = (rating: number): string => {
  if (rating >= 4.5) return 'Excellent';
  if (rating >= 3.5) return 'Good';
  if (rating >= 2.5) return 'Average';
  return 'Poor';
};

const FeedbackModal: React.FC<FeedbackModalProps> = ({ feedback, onClose }) => {
  if (!feedback) return null;

  const ratings = [
    { label: 'Customer Service', value: feedback.customerService },
    { label: 'Branch Environment', value: feedback.branchEnvironment },
    { label: 'Likelihood to Recommend', value: feedback.recommendation },
  ];

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{
        background: 'white',
        borderRadius: '20px',
        maxWidth: '560px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
        animation: 'slideUp 0.25s ease',
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${LOLC_BLUE}, #2D1B8E)`,
          borderRadius: '20px 20px 0 0',
          padding: '24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h3 style={{ color: '#F4F4F4', fontSize: '20px', fontWeight: 700, margin: 0 }}>
              Feedback Details
            </h3>
            <p style={{ color: 'rgba(244,244,244,0.7)', fontSize: '14px', margin: '4px 0 0' }}>
              ID: #{feedback.id}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: '#F4F4F4',
              width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '20px', fontWeight: 300,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {/* Meta info */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '12px', marginBottom: '24px',
          }}>
            {[
              { label: 'Date', value: `${feedback.date} at ${feedback.time}` },
              { label: 'Branch', value: feedback.branch },
              { label: 'Service Type', value: feedback.serviceType || 'N/A' },
              {
                label: 'Overall',
                value: (
                  <span style={{
                    ...getBadgeStyle(feedback.overallRating),
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}>
                    {getBadgeLabel(feedback.overallRating)}
                  </span>
                ),
              },
            ].map((item, i) => (
              <div key={i} style={{
                background: '#F8F8FC',
                borderRadius: '10px',
                padding: '12px',
              }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#888', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {item.label}
                </p>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#333333' }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Ratings */}
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px' }}>
              Ratings Breakdown
            </p>
            {ratings.map((r) => (
              <div key={r.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px',
                background: '#F8F8FC',
                borderRadius: '10px',
                marginBottom: '8px',
              }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#333333' }}>{r.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <StarDisplay rating={r.value} />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: LOLC_BLUE, minWidth: 30 }}>
                    {r.value}/5
                  </span>
                </div>
              </div>
            ))}
            {/* Overall */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px',
              background: 'rgba(12,0,75,0.05)',
              borderRadius: '10px',
              border: `2px solid ${LOLC_BLUE}`,
            }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: LOLC_BLUE }}>Overall Rating</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <StarDisplay rating={feedback.overallRating} />
                <span style={{ fontSize: '16px', fontWeight: 700, color: LOLC_BLUE, minWidth: 30 }}>
                  {feedback.overallRating}/5
                </span>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>
              Additional Comments
            </p>
            <div style={{
              background: '#F8F8FC',
              borderRadius: '10px',
              padding: '16px',
              borderLeft: `4px solid ${LOLC_BLUE}`,
              fontSize: '15px',
              lineHeight: 1.6,
              color: feedback.additionalComments ? '#333333' : '#aaa',
              fontStyle: feedback.additionalComments ? 'normal' : 'italic',
            }}>
              {feedback.additionalComments || 'No comments provided'}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default FeedbackModal;
