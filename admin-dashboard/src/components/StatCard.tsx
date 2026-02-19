import React from 'react';

const LOLC_BLUE = '#0C004B';

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  unit?: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, unit, icon }) => {
  const isPositive = change >= 0;

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      border: '1px solid #F0F0F8',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      transition: 'box-shadow 0.2s',
    }}
    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 6px 24px rgba(12,0,75,0.12)')}
    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 500, color: '#888', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {title}
          </p>
          <div style={{ fontSize: '30px', fontWeight: 700, color: '#333333', marginTop: '6px', lineHeight: 1.1 }}>
            {value}{unit}
          </div>
        </div>
        <div style={{
          width: 48, height: 48,
          background: 'rgba(12,0,75,0.07)',
          borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: LOLC_BLUE,
        }}>
          {icon}
        </div>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '13px',
        fontWeight: 500,
        color: isPositive ? '#059669' : '#dc2626',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points={isPositive ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
        </svg>
        {Math.abs(change)}{unit || ''}
        <span style={{ color: '#aaa', fontWeight: 400 }}>vs last month</span>
      </div>
    </div>
  );
};

export default StatCard;
