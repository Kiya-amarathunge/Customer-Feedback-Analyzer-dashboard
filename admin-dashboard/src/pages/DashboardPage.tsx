import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useAuth } from '../hooks/useAuth';
import StatCard from '../components/StatCard';
import FeedbackModal from '../components/FeedbackModal';
import { analyticsService, feedbackService } from '../services/api';
import {
  AnalyticsData, BranchPerformance, FeedbackEntry,
  FilterParams, RatingDistribution, TrendDataPoint
} from '../types';

const LOLC_BLUE = '#0C004B';
const CHART_COLORS = ['#0C004B', '#3b82f6', '#10b981', '#f59e0b', '#dc2626'];

// Mock data for development
const MOCK_SUMMARY: AnalyticsData = {
  totalFeedback: 1247, averageRating: 4.2, npsScore: 72, responseRate: 68,
  totalFeedbackChange: 12.5, averageRatingChange: 0.3, npsScoreChange: 8, responseRateChange: -3.2,
};
const MOCK_TRENDS: TrendDataPoint[] = [
  { month: 'Jan', customerService: 3.8, branchEnvironment: 3.9, recommendation: 3.7, count: 89 },
  { month: 'Feb', customerService: 3.9, branchEnvironment: 4.0, recommendation: 3.8, count: 95 },
  { month: 'Mar', customerService: 4.1, branchEnvironment: 4.1, recommendation: 4.0, count: 102 },
  { month: 'Apr', customerService: 4.0, branchEnvironment: 4.2, recommendation: 3.9, count: 98 },
  { month: 'May', customerService: 4.2, branchEnvironment: 4.1, recommendation: 4.1, count: 115 },
  { month: 'Jun', customerService: 4.3, branchEnvironment: 4.3, recommendation: 4.2, count: 108 },
  { month: 'Jul', customerService: 4.4, branchEnvironment: 4.4, recommendation: 4.3, count: 122 },
  { month: 'Aug', customerService: 4.3, branchEnvironment: 4.5, recommendation: 4.2, count: 118 },
  { month: 'Sep', customerService: 4.5, branchEnvironment: 4.4, recommendation: 4.4, count: 130 },
  { month: 'Oct', customerService: 4.4, branchEnvironment: 4.6, recommendation: 4.3, count: 125 },
  { month: 'Nov', customerService: 4.6, branchEnvironment: 4.5, recommendation: 4.5, count: 138 },
  { month: 'Dec', customerService: 4.5, branchEnvironment: 4.4, recommendation: 4.4, count: 107 },
];
const MOCK_RATING_DIST: RatingDistribution[] = [
  { category: 'Customer Service', fiveStar: 542, fourStar: 387, threeStar: 198, twoStar: 87, oneStar: 33 },
  { category: 'Branch Env.', fiveStar: 498, fourStar: 421, threeStar: 215, twoStar: 76, oneStar: 37 },
  { category: 'Recommendation', fiveStar: 523, fourStar: 398, threeStar: 187, twoStar: 98, oneStar: 41 },
];
const MOCK_BRANCHES: BranchPerformance[] = [
  { branchName: 'Colombo Main', branchId: '1', averageRating: 4.6, totalFeedback: 328 },
  { branchName: 'Negombo', branchId: '4', averageRating: 4.5, totalFeedback: 187 },
  { branchName: 'Galle', branchId: '3', averageRating: 4.3, totalFeedback: 215 },
  { branchName: 'Kandy', branchId: '2', averageRating: 4.2, totalFeedback: 298 },
  { branchName: 'Kurunegala', branchId: '5', averageRating: 3.8, totalFeedback: 219 },
];
const MOCK_SERVICE = [
  { name: 'Loans', value: 456 },
  { name: 'Savings', value: 342 },
  { name: 'Insurance', value: 287 },
  { name: 'Leasing', value: 162 },
];
const MOCK_FEEDBACK: FeedbackEntry[] = [
  { id: '1', date: '2026-02-12', time: '14:32', customerService: 5, branchEnvironment: 4, recommendation: 5, additionalComments: 'Excellent service! The staff was very helpful and professional.', branch: 'Colombo Main', branchId: '1', serviceType: 'Loans', overallRating: 5, createdAt: '2026-02-12T14:32:00' },
  { id: '2', date: '2026-02-12', time: '11:15', customerService: 4, branchEnvironment: 5, recommendation: 4, additionalComments: 'Clean and modern branch. Quick service.', branch: 'Kandy', branchId: '2', serviceType: 'Savings', overallRating: 4, createdAt: '2026-02-12T11:15:00' },
  { id: '3', date: '2026-02-11', time: '16:45', customerService: 3, branchEnvironment: 3, recommendation: 3, additionalComments: 'Average experience. Wait time could be improved.', branch: 'Galle', branchId: '3', serviceType: 'Insurance', overallRating: 3, createdAt: '2026-02-11T16:45:00' },
  { id: '4', date: '2026-02-11', time: '10:20', customerService: 5, branchEnvironment: 5, recommendation: 5, additionalComments: 'Outstanding service from start to finish.', branch: 'Colombo Main', branchId: '1', serviceType: 'Leasing', overallRating: 5, createdAt: '2026-02-11T10:20:00' },
  { id: '5', date: '2026-02-10', time: '13:55', customerService: 4, branchEnvironment: 4, recommendation: 4, additionalComments: 'Good overall experience. Staff was friendly.', branch: 'Negombo', branchId: '4', serviceType: 'Loans', overallRating: 4, createdAt: '2026-02-10T13:55:00' },
  { id: '6', date: '2026-02-10', time: '09:30', customerService: 2, branchEnvironment: 3, recommendation: 2, additionalComments: 'Long waiting time. Staff seemed overwhelmed.', branch: 'Kurunegala', branchId: '5', serviceType: 'Savings', overallRating: 2, createdAt: '2026-02-10T09:30:00' },
  { id: '7', date: '2026-02-09', time: '15:10', customerService: 5, branchEnvironment: 4, recommendation: 5, additionalComments: 'Very satisfied with the service provided.', branch: 'Colombo Main', branchId: '1', serviceType: 'Insurance', overallRating: 5, createdAt: '2026-02-09T15:10:00' },
  { id: '8', date: '2026-02-09', time: '12:00', customerService: 4, branchEnvironment: 5, recommendation: 4, additionalComments: 'Beautiful branch location and helpful staff.', branch: 'Galle', branchId: '3', serviceType: 'Loans', overallRating: 4, createdAt: '2026-02-09T12:00:00' },
  { id: '9', date: '2026-02-08', time: '14:20', customerService: 3, branchEnvironment: 4, recommendation: 3, additionalComments: 'Decent service but could be faster.', branch: 'Kandy', branchId: '2', serviceType: 'Leasing', overallRating: 3, createdAt: '2026-02-08T14:20:00' },
  { id: '10', date: '2026-02-08', time: '11:45', customerService: 5, branchEnvironment: 5, recommendation: 5, additionalComments: 'Perfect experience! Will definitely come back.', branch: 'Negombo', branchId: '4', serviceType: 'Savings', overallRating: 5, createdAt: '2026-02-08T11:45:00' },
];

const StarDisplay: React.FC<{ rating: number }> = ({ rating }) => (
  <div style={{ display: 'flex', gap: '1px' }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <svg key={s} width="14" height="14" viewBox="0 0 24 24"
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

const CollapsibleSection: React.FC<{
  title: string;
  badge?: string;
  icon: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, badge, icon, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      marginBottom: '20px',
      overflow: 'hidden',
      border: '1px solid #F0F0F8',
    }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: '20px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#F8F8FC')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>{icon}</span>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#333333', margin: 0 }}>{title}</h2>
          {badge && (
            <span style={{
              background: '#dbeafe', color: '#1e40af',
              padding: '3px 10px', borderRadius: '20px',
              fontSize: '12px', fontWeight: 600,
            }}>{badge}</span>
          )}
        </div>
        <div style={{
          width: 28, height: 28,
          background: 'rgba(12,0,75,0.08)',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: LOLC_BLUE,
          transform: open ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.25s ease',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
      <div style={{
        maxHeight: open ? '2000px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.35s ease',
      }}>
        <div style={{ borderTop: '1px solid #F0F0F8', padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { username, logout } = useAuth();
  const [summary, setSummary] = useState<AnalyticsData>(MOCK_SUMMARY);
  const [trends, setTrends] = useState<TrendDataPoint[]>(MOCK_TRENDS);
  const [ratingDist, setRatingDist] = useState<RatingDistribution[]>(MOCK_RATING_DIST);
  const [branches, setBranches] = useState<BranchPerformance[]>(MOCK_BRANCHES);
  const [serviceDist] = useState(MOCK_SERVICE);
  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>(MOCK_FEEDBACK);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackEntry | null>(null);
  const [filters, setFilters] = useState<FilterParams>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [s, t, r, b] = await Promise.all([
        analyticsService.getSummary(),
        analyticsService.getTrends(),
        analyticsService.getRatingDistribution(),
        analyticsService.getBranchPerformance(),
      ]);
      setSummary(s);
      setTrends(t);
      setRatingDist(r);
      setBranches(b);
    } catch {
      // Use mock data as fallback
    }
  }, []);

  const loadFeedback = useCallback(async () => {
    try {
      const res = await feedbackService.getAll({ ...filters, search: searchTerm, page: currentPage - 1 });
      setFeedbackList(res.content);
    } catch {
      // Use mock data as fallback
    }
  }, [filters, searchTerm, currentPage]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadFeedback(); }, [loadFeedback]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await feedbackService.exportCsv(filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LOLC_Feedback_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch {
      // Fallback: generate CSV from current data
      const header = 'Date,Time,Customer Service,Branch Environment,Recommendation,Overall,Branch,Service,Comments\n';
      const rows = feedbackList.map(f =>
        `${f.date},${f.time},${f.customerService},${f.branchEnvironment},${f.recommendation},${f.overallRating},${f.branch},${f.serviceType || ''},"${f.additionalComments || ''}"`
      ).join('\n');
      const blob = new Blob([header + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LOLC_Feedback_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } finally {
      setIsExporting(false);
    }
  };

  const filteredFeedback = feedbackList.filter(f => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      f.branch.toLowerCase().includes(term) ||
      (f.additionalComments || '').toLowerCase().includes(term) ||
      (f.serviceType || '').toLowerCase().includes(term)
    );
  });

  const inputStyle: React.CSSProperties = {
    padding: '9px 12px',
    border: '1.5px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: "'Inter', sans-serif",
    color: '#333333',
    outline: 'none',
    background: 'white',
  };

  const btnStyle: React.CSSProperties = {
    padding: '9px 20px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.15s',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5FA', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${LOLC_BLUE} 0%, #1a0a7a 100%)`,
        padding: '0 32px',
        boxShadow: '0 2px 16px rgba(12,0,75,0.2)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{
          maxWidth: '1400px', margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          height: '64px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 36, height: 36,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '9px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F4F4F4" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </div>
            <div>
              <div style={{ color: '#F4F4F4', fontSize: '16px', fontWeight: 700, lineHeight: 1.2 }}>
                LOLC Admin Dashboard
              </div>
              <div style={{ color: 'rgba(244,244,244,0.6)', fontSize: '11px' }}>
                Customer Feedback Analytics
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '20px',
              padding: '6px 14px',
              color: '#F4F4F4',
              fontSize: '13px',
              fontWeight: 500,
            }}>
              {username}
            </div>
            <button
              onClick={logout}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#F4F4F4',
                padding: '7px 14px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 24px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <StatCard title="Total Feedback" value={summary.totalFeedback.toLocaleString()} change={summary.totalFeedbackChange} icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          } />
          <StatCard title="Average Rating" value={summary.averageRating.toFixed(1)} change={summary.averageRatingChange} icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          } />
          <StatCard title="NPS Score" value={summary.npsScore} change={summary.npsScoreChange} icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          } />
          <StatCard title="Response Rate" value={summary.responseRate} unit="%" change={summary.responseRateChange} icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          } />
        </div>

        {/* Filters */}
        <div style={{
          background: 'white', borderRadius: '16px', padding: '20px 24px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: '24px',
          border: '1px solid #F0F0F8',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#333333', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={LOLC_BLUE} strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Filters
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            {[
              { label: 'Date Range', id: 'dateRange', opts: ['Last 7 days', 'Last 30 days', 'Last 3 months', 'Last 6 months', 'All time'] },
              { label: 'Branch', id: 'branch', opts: ['All Branches', 'Colombo Main', 'Kandy', 'Galle', 'Negombo', 'Kurunegala'] },
              { label: 'Rating', id: 'rating', opts: ['All Ratings', '5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'] },
              { label: 'Service Type', id: 'service', opts: ['All Services', 'Loans', 'Savings', 'Insurance', 'Leasing'] },
            ].map((f) => (
              <div key={f.id}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  {f.label}
                </label>
                <select
                  style={{ ...inputStyle, width: '100%' }}
                  onChange={(e) => setFilters(prev => ({ ...prev, [f.id]: e.target.value }))}
                >
                  {f.opts.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button style={{ ...btnStyle, background: LOLC_BLUE, color: '#F4F4F4' }}
              onClick={loadFeedback}>Apply Filters</button>
            <button style={{ ...btnStyle, background: '#F0F0F8', color: '#333333' }}
              onClick={() => { setFilters({}); setSearchTerm(''); }}>Reset</button>
            <button
              style={{ ...btnStyle, background: '#F0F0F8', color: '#333333', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', opacity: isExporting ? 0.7 : 1 }}
              onClick={handleExport}
              disabled={isExporting}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>

        {/* Trends */}
        <CollapsibleSection title="Feedback Trends" badge="12 Months" icon="📈" defaultOpen>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F8" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis domain={[3, 5]} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(v) => v.toFixed(1)} />
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}
                />
                <Legend wrapperStyle={{ fontSize: '13px' }} />
                <Line type="monotone" dataKey="customerService" name="Customer Service" stroke="#0C004B" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="branchEnvironment" name="Branch Environment" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="recommendation" name="Recommendation" stroke="#10b981" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CollapsibleSection>

        {/* Rating Distribution */}
        <CollapsibleSection title="Rating Distribution" badge="By Category" icon="📊">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F8" />
                  <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#888' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#888' }} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontFamily: "'Inter', sans-serif", fontSize: '13px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="fiveStar" name="5 Stars" stackId="a" fill="#10b981" />
                  <Bar dataKey="fourStar" name="4 Stars" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="threeStar" name="3 Stars" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="twoStar" name="2 Stars" stackId="a" fill="#ef4444" />
                  <Bar dataKey="oneStar" name="1 Star" stackId="a" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#333333', margin: '0 0 12px' }}>Branch Performance</p>
              {branches.map((b, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px', background: '#F8F8FC', borderRadius: '10px',
                  marginBottom: '8px', borderLeft: `3px solid ${LOLC_BLUE}`,
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#333333' }}>{b.branchName}</div>
                    <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{b.totalFeedback} responses</div>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: LOLC_BLUE }}>{b.averageRating}</div>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleSection>

        {/* Branch & Service Analytics */}
        <CollapsibleSection title="Branch & Service Analytics" badge="5 Branches" icon="🏢">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#333333', margin: '0 0 12px' }}>Feedback Volume by Branch</p>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branches}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F8" />
                    <XAxis dataKey="branchName" tick={{ fontSize: 11, fill: '#888' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#888' }} />
                    <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontFamily: "'Inter', sans-serif", fontSize: '13px' }} />
                    <Bar dataKey="totalFeedback" name="Feedbacks" radius={[6, 6, 0, 0]}>
                      {branches.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#333333', margin: '0 0 12px' }}>Feedback by Service Type</p>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={serviceDist} cx="50%" cy="45%" outerRadius={90} innerRadius={55} dataKey="value" paddingAngle={3}>
                      {serviceDist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontFamily: "'Inter', sans-serif", fontSize: '13px' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Feedback Table */}
        <CollapsibleSection title="Recent Feedback" badge="Latest entries" icon="📋">
          <div style={{ marginBottom: '16px' }}>
            <div style={{ position: 'relative', maxWidth: '360px' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...inputStyle, paddingLeft: '38px', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr>
                  {['Date', 'Customer Service', 'Branch Env.', 'Recommendation', 'Overall', 'Branch', 'Action'].map((h) => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '10px 14px',
                      fontSize: '11px', fontWeight: 600, color: '#888',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                      background: '#F8F8FC', borderBottom: '1px solid #E2E8F0',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredFeedback.map((f) => (
                  <tr key={f.id} style={{ borderBottom: '1px solid #F0F0F8' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F8F8FC')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#333' }}>{f.date}</div>
                      <div style={{ fontSize: '11px', color: '#aaa' }}>{f.time}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}><StarDisplay rating={f.customerService} /></td>
                    <td style={{ padding: '12px 14px' }}><StarDisplay rating={f.branchEnvironment} /></td>
                    <td style={{ padding: '12px 14px' }}><StarDisplay rating={f.recommendation} /></td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        ...getBadgeStyle(f.overallRating),
                        padding: '3px 10px', borderRadius: '20px',
                        fontSize: '12px', fontWeight: 600,
                      }}>
                        {getBadgeLabel(f.overallRating)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#555', fontWeight: 500 }}>{f.branch}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <button
                        onClick={() => setSelectedFeedback(f)}
                        style={{
                          background: 'rgba(12,0,75,0.07)',
                          color: LOLC_BLUE,
                          border: 'none',
                          borderRadius: '6px',
                          padding: '5px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #F0F0F8',
          }}>
            <span style={{ fontSize: '13px', color: '#888' }}>
              Showing <strong>{filteredFeedback.length}</strong> of <strong>1,247</strong> entries
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1, 2, 3, 4, 5].map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  style={{
                    width: 32, height: 32,
                    borderRadius: '6px',
                    border: currentPage === p ? 'none' : '1px solid #E2E8F0',
                    background: currentPage === p ? LOLC_BLUE : 'white',
                    color: currentPage === p ? '#F4F4F4' : '#555',
                    fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >{p}</button>
              ))}
            </div>
          </div>
        </CollapsibleSection>
      </div>

      <FeedbackModal feedback={selectedFeedback} onClose={() => setSelectedFeedback(null)} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        select { appearance: auto; }
      `}</style>
    </div>
  );
};

export default DashboardPage;
