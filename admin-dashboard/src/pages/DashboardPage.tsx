import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useAuth } from '../hooks/useAuth';
import FeedbackModal from '../components/FeedbackModal';
import { analyticsService, feedbackService } from '../services/api';
import {
  AnalyticsData, BranchPerformance, FeedbackEntry,
  FilterParams, RatingDistribution, ServiceDistribution, TrendDataPoint
} from '../types';

const LOLC_BLUE = '#0C004B';
const CHART_COLORS = ['#0C004B', '#3b82f6', '#10b981', '#f59e0b', '#dc2626'];

const EMPTY_SUMMARY: AnalyticsData = {
  totalFeedback: 0, averageRating: 0, npsScore: 0, responseRate: 0,
  totalFeedbackChange: 0, averageRatingChange: 0, npsScoreChange: 0, responseRateChange: 0,
};

// Generate month options from Jan 2026 to current month
const generateMonthOptions = () => {
  const options: { label: string; value: string }[] = [];
  const now = new Date();
  const start = new Date(2026, 0, 1); // January 2026
  const cur = new Date(start);
  while (cur <= now) {
    const label = cur.toLocaleString('default', { month: 'long', year: 'numeric' });
    const value = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
    options.push({ label, value });
    cur.setMonth(cur.getMonth() + 1);
  }
  return options;
};
const MONTH_OPTIONS = generateMonthOptions();

// ── Helpers ───────────────────────────────────────────────────

const StarDisplay: React.FC<{ rating: number }> = ({ rating }) => (
  <div style={{ display: 'flex', gap: '1px' }}>
    {[1,2,3,4,5].map(s => (
      <svg key={s} width="13" height="13" viewBox="0 0 24 24"
        fill={s <= rating ? '#F4A61D' : 'none'}
        stroke={s <= rating ? '#F4A61D' : '#CBD5E0'} strokeWidth="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ))}
  </div>
);

const getBadgeStyle = (r: number): React.CSSProperties => {
  if (r >= 4.5) return { background: '#d1fae5', color: '#065f46' };
  if (r >= 3.5) return { background: '#dbeafe', color: '#1e40af' };
  if (r >= 2.5) return { background: '#fef3c7', color: '#92400e' };
  return { background: '#fee2e2', color: '#991b1b' };
};
const getBadgeLabel = (r: number) => {
  if (r >= 4.5) return 'Excellent';
  if (r >= 3.5) return 'Good';
  if (r >= 2.5) return 'Average';
  return 'Poor';
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 20px', color:'#aaa' }}>
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#CBD5E0" strokeWidth="1.5" style={{marginBottom:'10px'}}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <p style={{ fontSize:'13px', margin:0, textAlign:'center' }}>{message}</p>
  </div>
);

const RatingBar: React.FC<{ star: number; count: number; total: number }> = ({ star, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const colors = ['#dc2626','#f97316','#f59e0b','#3b82f6','#10b981'];
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'5px' }}>
      <span style={{ fontSize:'12px', color:'#555', width:14, textAlign:'right' }}>{star}</span>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="#F4A61D" stroke="#F4A61D" strokeWidth="1">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
      <div style={{ flex:1, background:'#F0F0F8', borderRadius:4, height:8, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, background:colors[star-1], height:'100%', borderRadius:4, transition:'width 0.4s' }} />
      </div>
      <span style={{ fontSize:'12px', color:'#888', width:36, textAlign:'right' }}>{pct}%</span>
      <span style={{ fontSize:'11px', color:'#bbb', width:36 }}>({count})</span>
    </div>
  );
};

const KpiCard: React.FC<{
  title: string; value: string; change: number; icon: string; active: boolean; onClick: () => void;
}> = ({ title, value, change, icon, active, onClick }) => {
  const isPos = change >= 0;
  return (
    <div onClick={onClick} style={{
      background: active ? LOLC_BLUE : 'white',
      borderRadius:'14px', padding:'20px',
      boxShadow: active ? '0 4px 20px rgba(12,0,75,0.25)' : '0 2px 10px rgba(0,0,0,0.07)',
      border: active ? 'none' : '1px solid #F0F0F8',
      cursor:'pointer', transition:'all 0.2s', userSelect:'none',
    }}
      onMouseEnter={e => { if(!active) e.currentTarget.style.boxShadow='0 4px 16px rgba(12,0,75,0.12)'; }}
      onMouseLeave={e => { if(!active) e.currentTarget.style.boxShadow='0 2px 10px rgba(0,0,0,0.07)'; }}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <p style={{ fontSize:'11px', fontWeight:500, color: active?'rgba(255,255,255,0.7)':'#888', margin:0, textTransform:'uppercase', letterSpacing:'0.5px' }}>{title}</p>
          <div style={{ fontSize:'26px', fontWeight:700, color: active?'#fff':'#333', marginTop:'6px', lineHeight:1.1 }}>{value}</div>
        </div>
        <div style={{ width:40, height:40, background: active?'rgba(255,255,255,0.15)':'rgba(12,0,75,0.07)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>
          {icon}
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'5px', marginTop:'10px', fontSize:'11px', fontWeight:500, color: active?'rgba(255,255,255,0.8)':(isPos?'#059669':'#dc2626') }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points={isPos?"18 15 12 9 6 15":"6 9 12 15 18 9"}/>
        </svg>
        {Math.abs(change)}% vs last month
        <span style={{ marginLeft:'auto', fontSize:'10px', opacity:0.6 }}>{active?'▲ collapse':'expand ▼'}</span>
      </div>
    </div>
  );
};

// ── Pagination component (shows 1 … n with arrows) ──────────────
const Pagination: React.FC<{
  currentPage: number; totalPages: number; onPageChange: (p: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const btnBase: React.CSSProperties = {
    minWidth:28, height:28, borderRadius:'6px', border:'1px solid #E2E8F0',
    background:'white', color:'#555', fontSize:'12px', fontWeight:600,
    cursor:'pointer', fontFamily:"'Inter', sans-serif", padding:'0 6px',
    display:'flex', alignItems:'center', justifyContent:'center',
  };

  // Build page numbers to show: always first, last, current ±1, with ellipsis
  const pages: (number | '...')[] = [];
  const addPage = (p: number) => { if (!pages.includes(p)) pages.push(p); };

  addPage(1);
  if (currentPage > 3) pages.push('...');
  for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) addPage(p);
  if (currentPage < totalPages - 2) pages.push('...');
  if (totalPages > 1) addPage(totalPages);

  return (
    <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
      {/* First page button */}
      <button onClick={() => onPageChange(1)} disabled={currentPage===1}
        style={{ ...btnBase, color: currentPage===1?'#ccc':'#555', cursor: currentPage===1?'default':'pointer' }}>«</button>
      {/* Prev */}
      <button onClick={() => onPageChange(currentPage-1)} disabled={currentPage===1}
        style={{ ...btnBase, color: currentPage===1?'#ccc':'#555', cursor: currentPage===1?'default':'pointer' }}>‹</button>
      {/* Page numbers */}
      {pages.map((p, i) =>
        p === '...'
          ? <span key={`ellipsis-${i}`} style={{ fontSize:'12px', color:'#aaa', padding:'0 4px' }}>…</span>
          : (
            <button key={p} onClick={() => onPageChange(p as number)} style={{
              ...btnBase,
              border: currentPage===p ? 'none' : '1px solid #E2E8F0',
              background: currentPage===p ? LOLC_BLUE : 'white',
              color: currentPage===p ? 'white' : '#555',
            }}>{p}</button>
          )
      )}
      {/* Next */}
      <button onClick={() => onPageChange(currentPage+1)} disabled={currentPage===totalPages}
        style={{ ...btnBase, color: currentPage===totalPages?'#ccc':'#555', cursor: currentPage===totalPages?'default':'pointer' }}>›</button>
      {/* Last page button */}
      <button onClick={() => onPageChange(totalPages)} disabled={currentPage===totalPages}
        style={{ ...btnBase, color: currentPage===totalPages?'#ccc':'#555', cursor: currentPage===totalPages?'default':'pointer' }}>»</button>
    </div>
  );
};

// ── Reusable branch search dropdown ───────────────────────────
const BranchSelect: React.FC<{
  branches: BranchPerformance[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}> = ({ branches, value, onChange, placeholder = 'All Branches', style }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const filtered = branches.filter(b => b.branchName.toLowerCase().includes(search.toLowerCase()));
  const selected = branches.find(b => b.branchId === value);

  return (
    <div style={{ position:'relative', ...style }}>
      <div onClick={() => setOpen(o => !o)} style={{
        padding:'8px 12px', border:'1.5px solid #E2E8F0', borderRadius:'8px',
        fontSize:'13px', fontFamily:"'Inter', sans-serif", color: value ? '#333' : '#888',
        background:'white', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center',
        minWidth:200,
      }}>
        <span>{selected ? selected.branchName : placeholder}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" style={{ transform: open?'rotate(180deg)':'none', transition:'0.2s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      {open && (
        <div style={{
          position:'absolute', top:'100%', left:0, right:0, zIndex:200,
          background:'white', border:'1px solid #E2E8F0', borderRadius:'8px',
          boxShadow:'0 4px 16px rgba(0,0,0,0.1)', marginTop:'4px', overflow:'hidden',
        }}>
          <div style={{ padding:'8px' }}>
            <input
              autoFocus
              type="text" placeholder="Search branches..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width:'100%', padding:'6px 10px', border:'1px solid #E2E8F0', borderRadius:'6px', fontSize:'12px', outline:'none', boxSizing:'border-box' as const }}
            />
          </div>
          <div style={{ maxHeight:200, overflowY:'auto' }}>
            <div onClick={() => { onChange(''); setOpen(false); setSearch(''); }}
              style={{ padding:'8px 12px', fontSize:'13px', color:'#888', cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background='#F8F8FC'}
              onMouseLeave={e => e.currentTarget.style.background='white'}>
              {placeholder}
            </div>
            {filtered.map(b => (
              <div key={b.branchId}
                onClick={() => { onChange(b.branchId); setOpen(false); setSearch(''); }}
                style={{ padding:'8px 12px', fontSize:'13px', color:'#333', cursor:'pointer', background: value===b.branchId?'#F0F0F8':'white' }}
                onMouseEnter={e => e.currentTarget.style.background='#F8F8FC'}
                onMouseLeave={e => e.currentTarget.style.background=value===b.branchId?'#F0F0F8':'white'}>
                {b.branchName}
              </div>
            ))}
            {filtered.length === 0 && <p style={{ padding:'8px 12px', fontSize:'12px', color:'#aaa', margin:0 }}>No branches found</p>}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Dashboard ─────────────────────────────────────────────
const DashboardPage: React.FC = () => {
  const { username, logout } = useAuth();

  const [summary, setSummary] = useState<AnalyticsData>(EMPTY_SUMMARY);
  const [trends, setTrends] = useState<TrendDataPoint[]>([]);
  const [ratingDist, setRatingDist] = useState<RatingDistribution[]>([]);
  const [branches, setBranches] = useState<BranchPerformance[]>([]);
  const [serviceDist, setServiceDist] = useState<ServiceDistribution[]>([]);
  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackEntry | null>(null);
  const [totalEntries, setTotalEntries] = useState(0);

  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FilterParams>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  // Card 1 — Trend filters
  const [trendFromMonth, setTrendFromMonth] = useState('2026-01');
  const [trendToMonth, setTrendToMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  });

  // Shared branch filter — used by all analytics panels
  const [selectedBranchId, setSelectedBranchId] = useState('');
  // Keep these as aliases so existing JSX still compiles
  const ratingBranchId = selectedBranchId;
  const setRatingBranchId = setSelectedBranchId;
  const npsBranchId = selectedBranchId;
  const setNpsBranchId = setSelectedBranchId;

  // Card 4 — Branch performance filters + recent feedback
  const [branchTableSearch, setBranchTableSearch] = useState('');
  const [performerFilter, setPerformerFilter] = useState<'all' | 'top' | 'bottom'>('all');
  const [performerCount, setPerformerCount] = useState(10);
  const [responsesPage, setResponsesPage] = useState(1);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      // Summary and branch performance are always global
      const [s, b] = await Promise.all([
        analyticsService.getSummary(),
        analyticsService.getBranchPerformance(),
      ]);
      setSummary(s);
      setBranches(b);
    } catch {
      setError('Cannot connect to backend. Make sure Spring Boot is running on port 8080.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Trends reload when date range or branch filter changes
  const loadTrends = useCallback(async () => {
    try {
      const t = await analyticsService.getTrends(trendFromMonth, trendToMonth, selectedBranchId || undefined);
      setTrends(t);
    } catch { setTrends([]); }
  }, [trendFromMonth, trendToMonth, selectedBranchId]);

  // Rating dist reloads when branch filter changes
  const loadRatingDist = useCallback(async () => {
    try {
      const r = await analyticsService.getRatingDistribution(selectedBranchId || undefined);
      setRatingDist(r);
    } catch { setRatingDist([]); }
  }, [selectedBranchId]);

  // Service dist reloads when branch filter changes
  const loadServiceDist = useCallback(async () => {
    try {
      const sd = await analyticsService.getServiceDistribution(selectedBranchId || undefined);
      setServiceDist(sd);
    } catch { setServiceDist([]); }
  }, [selectedBranchId]);

  const loadFeedback = useCallback(async () => {
    try {
      const res = await feedbackService.getAll({
        ...filters,
        branch: selectedBranchId || filters.branch,
        search: searchTerm,
        page: currentPage - 1,
      });
      setFeedbackList(res.content || []);
      setTotalEntries(res.totalElements || 0);
    } catch {
      setFeedbackList([]);
      setTotalEntries(0);
    }
  }, [filters, searchTerm, currentPage, selectedBranchId]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadTrends(); }, [loadTrends]);
  useEffect(() => { loadRatingDist(); }, [loadRatingDist]);
  useEffect(() => { loadServiceDist(); }, [loadServiceDist]);
  useEffect(() => { loadFeedback(); }, [loadFeedback]);

  const handleCardClick = (card: string) => setActiveCard(prev => prev === card ? null : card);

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
      const header = 'Date,Time,Customer Service,Branch Environment,Recommendation,Overall,Branch,Service,Comments\n';
      const rows = feedbackList.map(f =>
        `${f.date},${f.time},${f.customerService},${f.branchEnvironment},${f.recommendation},${f.overallRating},${f.branch},${f.serviceType||''},"${f.additionalComments||''}"`
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

  // ── Derived data ──────────────────────────────────────────────

  // Filter trends by selected month range
  const filteredTrends = trends.filter(t => {
    if (!t.month) return true;
    // t.month is like "Jan", "Feb" — match against YYYY-MM range
    return true; // backend handles filtering when we pass date params; this is client filter fallback
  });

  // These are now driven by backend via loadRatingDist and loadServiceDist
  const displayedRatingDist = ratingDist;
  const displayedServiceDist = serviceDist;

  // Branch table filtering and performer range
  const searchedBranches = branches.filter(b =>
    b.branchName.toLowerCase().includes(branchTableSearch.toLowerCase())
  );
  const sortedBranches = [...searchedBranches].sort((a,b) => b.averageRating - a.averageRating);
  const displayedBranches = performerFilter === 'top'
    ? sortedBranches.slice(0, performerCount)
    : performerFilter === 'bottom'
    ? sortedBranches.slice(-performerCount).reverse()
    : sortedBranches;

  // Feedback pagination for responses card
  const ROWS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(totalEntries / ROWS_PER_PAGE));
  const globalTotalPages = Math.max(1, Math.ceil(totalEntries / ROWS_PER_PAGE));

  const filteredFeedback = feedbackList.filter(f => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return f.branch.toLowerCase().includes(t) ||
      (f.additionalComments||'').toLowerCase().includes(t) ||
      (f.serviceType||'').toLowerCase().includes(t);
  });

  const getRatingTotal = (d: RatingDistribution) =>
    d.fiveStar + d.fourStar + d.threeStar + d.twoStar + d.oneStar;

  const inputStyle: React.CSSProperties = {
    padding:'7px 11px', border:'1.5px solid #E2E8F0', borderRadius:'8px',
    fontSize:'13px', fontFamily:"'Inter', sans-serif", color:'#333', outline:'none', background:'white',
  };

  const panelStyle: React.CSSProperties = {
    background:'#F8F8FC', borderRadius:'0 0 14px 14px', padding:'20px',
    marginTop:'-4px', border:'1px solid #E8E8F0', borderTop:'none', marginBottom:'16px',
  };

  const sectionLabel: React.CSSProperties = {
    margin:'0 0 14px', fontWeight:700, fontSize:'14px', color:'#333',
  };

  return (
    <div style={{ minHeight:'100vh', background:'#F2F2F8', fontFamily:"'Inter', sans-serif" }}>

      {/* ── Header ── */}
      <div style={{
        background:`linear-gradient(135deg, ${LOLC_BLUE} 0%, #1a0a7a 100%)`,
        padding:'0 28px', boxShadow:'0 2px 16px rgba(12,0,75,0.2)',
        position:'sticky', top:0, zIndex:300,
      }}>
        <div style={{ maxWidth:'1400px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', height:'58px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:32, height:32, background:'rgba(255,255,255,0.15)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,0.2)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F4F4F4" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </div>
            <div>
              <div style={{ color:'#F4F4F4', fontSize:'14px', fontWeight:700, lineHeight:1.2 }}>LOLC Admin Dashboard</div>
              <div style={{ color:'rgba(244,244,244,0.55)', fontSize:'10px' }}>Customer Feedback Analytics</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <button onClick={() => { loadData(); loadTrends(); loadRatingDist(); loadServiceDist(); loadFeedback(); }} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'7px', color:'#F4F4F4', padding:'5px 11px', fontSize:'12px', cursor:'pointer', fontFamily:"'Inter', sans-serif" }}>🔄 Refresh</button>
            <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:'20px', padding:'4px 11px', color:'#F4F4F4', fontSize:'12px' }}>{username}</div>
            <button onClick={logout} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'7px', color:'#F4F4F4', padding:'5px 11px', fontSize:'12px', cursor:'pointer', fontFamily:"'Inter', sans-serif" }}>Logout</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:'1400px', margin:'0 auto', padding:'20px 18px' }}>

        {/* Status banners */}
        {error && <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:'10px', padding:'10px 14px', marginBottom:'14px', color:'#dc2626', fontSize:'13px' }}>⚠️ {error}</div>}
        {isLoading && <div style={{ background:'#dbeafe', border:'1px solid #93c5fd', borderRadius:'10px', padding:'10px 14px', marginBottom:'14px', color:'#1e40af', fontSize:'13px' }}>⏳ Loading data...</div>}

        {/* ── Global filter bar ── */}
        <div style={{ background:'white', borderRadius:'12px', padding:'12px 16px', marginBottom:'14px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', display:'flex', flexWrap:'wrap', gap:'8px', alignItems:'center' }}>
          <select style={inputStyle} value={selectedBranchId} onChange={e => {
              setSelectedBranchId(e.target.value);
              setFilters(p => ({ ...p, branch: e.target.value||undefined }));
            }}>
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.branchName}</option>)}
          </select>
          <select style={inputStyle} value={filters.rating||''} onChange={e => setFilters(p => ({ ...p, rating: e.target.value||undefined }))}>
            <option value="">All Ratings</option>
            {['5','4','3','2','1'].map(r => <option key={r} value={r}>{r} Stars</option>)}
          </select>
          <select style={inputStyle} value={filters.serviceType||''} onChange={e => setFilters(p => ({ ...p, serviceType: e.target.value||undefined }))}>
            <option value="">All Services</option>
            {['Loans','Savings','Insurance','Leasing'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button style={{ padding:'7px 14px', borderRadius:'8px', border:'none', background:LOLC_BLUE, color:'white', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:"'Inter', sans-serif" }} onClick={() => { loadData(); loadTrends(); loadRatingDist(); loadServiceDist(); loadFeedback(); }}>Apply</button>
          <button style={{ padding:'7px 14px', borderRadius:'8px', border:'1px solid #E2E8F0', background:'white', color:'#555', fontSize:'13px', cursor:'pointer', fontFamily:"'Inter', sans-serif" }} onClick={() => { setFilters({}); setSearchTerm(''); setCurrentPage(1); setSelectedBranchId(''); }}>Reset</button>
          <button style={{ padding:'7px 14px', borderRadius:'8px', border:'none', background:'#10b981', color:'white', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:"'Inter', sans-serif", marginLeft:'auto' }} onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Exporting...' : '⬇ Export CSV'}
          </button>
        </div>

        {/* ── KPI Cards ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(190px, 1fr))', gap:'10px', marginBottom:'4px' }}>
          <KpiCard title="Total Feedback" value={summary.totalFeedback.toString()} change={summary.totalFeedbackChange} icon="📝" active={activeCard==='feedback'} onClick={() => handleCardClick('feedback')} />
          <KpiCard title="Average Rating" value={summary.averageRating > 0 ? `${summary.averageRating.toFixed(1)} / 5` : '—'} change={summary.averageRatingChange} icon="⭐" active={activeCard==='rating'} onClick={() => handleCardClick('rating')} />
          <KpiCard title="NPS Score" value={summary.npsScore !== 0 ? summary.npsScore.toString() : '—'} change={summary.npsScoreChange} icon="📊" active={activeCard==='nps'} onClick={() => handleCardClick('nps')} />
          <KpiCard title="Total Responses" value={totalEntries > 0 ? totalEntries.toString() : '0'} change={summary.responseRateChange} icon="✅" active={activeCard==='responses'} onClick={() => handleCardClick('responses')} />
        </div>

        {/* ══════════════════════════════════════════════════════════
            PANEL 1 — Total Feedback → Trends with month range picker
        ══════════════════════════════════════════════════════════ */}
        {activeCard === 'feedback' && (
          <div style={panelStyle}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px', flexWrap:'wrap', gap:'10px' }}>
              <p style={sectionLabel}>📈 Feedback Trends</p>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                <span style={{ fontSize:'12px', color:'#888' }}>From</span>
                <select style={inputStyle} value={trendFromMonth} onChange={e => setTrendFromMonth(e.target.value)}>
                  {MONTH_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <span style={{ fontSize:'12px', color:'#888' }}>To</span>
                <select style={inputStyle} value={trendToMonth} onChange={e => setTrendToMonth(e.target.value)}>
                  {MONTH_OPTIONS.filter(m => m.value >= trendFromMonth).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>
            {trends.length === 0 ? (
              <EmptyState message="No trend data yet. Submit some feedback to see trends." />
            ) : (
              <div style={{ height:250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F8" />
                    <XAxis dataKey="month" tick={{ fontSize:11 }} />
                    <YAxis domain={[0,5]} tick={{ fontSize:11 }} />
                    <Tooltip contentStyle={{ borderRadius:'10px', border:'1px solid #E2E8F0', fontFamily:"'Inter', sans-serif", fontSize:'12px' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize:'11px' }} />
                    <Line type="monotone" dataKey="customerService" name="Customer Service" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="branchEnvironment" name="Branch Environment" stroke={CHART_COLORS[1]} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="recommendation" name="Recommendation" stroke={CHART_COLORS[2]} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            PANEL 2 — Average Rating → Rating breakdown + branch filter
        ══════════════════════════════════════════════════════════ */}
        {activeCard === 'rating' && (
          <div style={panelStyle}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px', flexWrap:'wrap', gap:'10px' }}>
              <p style={sectionLabel}>⭐ Rating Breakdown by Question</p>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ fontSize:'12px', color:'#888' }}>Filter by branch:</span>
                <BranchSelect
                  branches={branches}
                  value={ratingBranchId}
                  onChange={setRatingBranchId}
                  placeholder="All Branches"
                />
              </div>
            </div>
            {ratingBranchId && (
              <div style={{ background:'#dbeafe', borderRadius:'8px', padding:'8px 12px', marginBottom:'12px', fontSize:'12px', color:'#1e40af' }}>
                📍 Showing ratings for: <strong>{branches.find(b=>b.branchId===ratingBranchId)?.branchName}</strong>
                <button onClick={() => setRatingBranchId('')} style={{ marginLeft:10, background:'none', border:'none', color:'#3b82f6', cursor:'pointer', fontSize:'12px', fontWeight:600 }}>✕ Clear</button>
              </div>
            )}
            {displayedRatingDist.length === 0 ? (
              <EmptyState message="No rating data yet." />
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:'16px' }}>
                {ratingDist.map(dist => {
                  const total = getRatingTotal(dist);
                  return (
                    <div key={dist.category} style={{ background:'white', borderRadius:'12px', padding:'16px', border:'1px solid #F0F0F8' }}>
                      <p style={{ margin:'0 0 12px', fontWeight:600, fontSize:'13px', color:'#333' }}>{dist.category}</p>
                      {[{star:5,count:dist.fiveStar},{star:4,count:dist.fourStar},{star:3,count:dist.threeStar},{star:2,count:dist.twoStar},{star:1,count:dist.oneStar}].map(({star,count}) => (
                        <RatingBar key={star} star={star} count={count} total={total} />
                      ))}
                      <div style={{ marginTop:'10px', paddingTop:'10px', borderTop:'1px solid #F0F0F8', display:'flex', justifyContent:'space-between', fontSize:'12px' }}>
                        <span style={{ color:'#888' }}>Total responses</span>
                        <span style={{ fontWeight:700, color:'#333' }}>{total}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            PANEL 3 — NPS Score → Service distribution + branch filter
        ══════════════════════════════════════════════════════════ */}
        {activeCard === 'nps' && (
          <div style={panelStyle}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px', flexWrap:'wrap', gap:'10px' }}>
              <p style={sectionLabel}>📊 Feedback by Service Type</p>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ fontSize:'12px', color:'#888' }}>Filter by branch:</span>
                <BranchSelect
                  branches={branches}
                  value={npsBranchId}
                  onChange={setNpsBranchId}
                  placeholder="All Branches"
                />
              </div>
            </div>
            {npsBranchId && (
              <div style={{ background:'#dbeafe', borderRadius:'8px', padding:'8px 12px', marginBottom:'12px', fontSize:'12px', color:'#1e40af' }}>
                📍 Showing analytics for: <strong>{branches.find(b=>b.branchId===npsBranchId)?.branchName}</strong>
                <button onClick={() => setNpsBranchId('')} style={{ marginLeft:10, background:'none', border:'none', color:'#3b82f6', cursor:'pointer', fontSize:'12px', fontWeight:600 }}>✕ Clear</button>
              </div>
            )}
            {displayedServiceDist.length === 0 ? (
              <EmptyState message="No service data yet." />
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px' }}>
                <div style={{ height:230 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={displayedServiceDist} cx="50%" cy="45%" outerRadius={82} innerRadius={48} dataKey="value" paddingAngle={3}>
                        {displayedServiceDist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius:'10px', border:'1px solid #E2E8F0', fontFamily:"'Inter', sans-serif", fontSize:'12px' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize:'11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', gap:'10px' }}>
                  {displayedServiceDist.map((s, i) => {
                    const total = displayedServiceDist.reduce((sum,x) => sum+x.value, 0);
                    const pct = total > 0 ? Math.round((s.value/total)*100) : 0;
                    return (
                      <div key={s.name} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <div style={{ width:10, height:10, borderRadius:'50%', background:CHART_COLORS[i%CHART_COLORS.length], flexShrink:0 }} />
                        <span style={{ fontSize:'13px', color:'#333', flex:1 }}>{s.name}</span>
                        <span style={{ fontSize:'13px', fontWeight:700, color:'#333' }}>{pct}%</span>
                        <span style={{ fontSize:'12px', color:'#888' }}>({s.value})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            PANEL 4 — Total Responses → Branch performance + recent feedback
        ══════════════════════════════════════════════════════════ */}
        {activeCard === 'responses' && (
          <div style={panelStyle}>

            {/* Branch performance section */}
            <div style={{ marginBottom:'24px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px', flexWrap:'wrap', gap:'10px' }}>
                <p style={sectionLabel}>🏢 Branch Performance</p>
                <div style={{ display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }}>
                  {/* Performer filter */}
                  <select style={inputStyle} value={performerFilter} onChange={e => setPerformerFilter(e.target.value as 'all'|'top'|'bottom')}>
                    <option value="all">All Branches</option>
                    <option value="top">Top Performers</option>
                    <option value="bottom">Bottom Performers</option>
                  </select>
                  {performerFilter !== 'all' && (
                    <select style={inputStyle} value={performerCount} onChange={e => setPerformerCount(Number(e.target.value))}>
                      {[5,10,20,50].map(n => <option key={n} value={n}>Top {n}</option>)}
                    </select>
                  )}
                  {/* Branch search */}
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute', left:'9px', top:'50%', transform:'translateY(-50%)', color:'#aaa' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    </span>
                    <input type="text" placeholder="Search branches..." value={branchTableSearch} onChange={e => setBranchTableSearch(e.target.value)}
                      style={{ ...inputStyle, paddingLeft:'28px', width:'180px' }} />
                  </div>
                </div>
              </div>

              {displayedBranches.length === 0 ? (
                <EmptyState message={branchTableSearch ? `No branches matching "${branchTableSearch}"` : 'No branch data yet.'} />
              ) : (
                <>
                  <div style={{ overflowX:'auto', maxHeight:'340px', overflowY:'auto', borderRadius:'10px', border:'1px solid #E8E8F0' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'520px' }}>
                      <thead style={{ position:'sticky', top:0, zIndex:10 }}>
                        <tr>
                          {['Rank','Branch','Responses','Avg Rating','Score %','Performance'].map(h => (
                            <th key={h} style={{ textAlign:'left', padding:'9px 12px', fontSize:'10px', fontWeight:600, color:'#888', textTransform:'uppercase', letterSpacing:'0.4px', background:'#F8F8FC', borderBottom:'1px solid #E2E8F0' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {displayedBranches.map((b, i) => {
                          const globalRank = sortedBranches.findIndex(x => x.branchId === b.branchId) + 1;
                          const pct = (b.averageRating / 5) * 100;
                          return (
                            <tr key={b.branchId} style={{ borderBottom:'1px solid #F8F8FC', background:'white' }}
                              onMouseEnter={e => e.currentTarget.style.background='#F8F8FC'}
                              onMouseLeave={e => e.currentTarget.style.background='white'}>
                              <td style={{ padding:'9px 12px' }}>
                                <span style={{ width:24, height:24, borderRadius:'50%', background: globalRank<=3?LOLC_BLUE:'#E2E8F0', color: globalRank<=3?'white':'#555', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700 }}>{globalRank}</span>
                              </td>
                              <td style={{ padding:'9px 12px', fontSize:'13px', fontWeight:500, color:'#333' }}>{b.branchName}</td>
                              <td style={{ padding:'9px 12px', fontSize:'13px', color:'#555' }}>{b.totalFeedback}</td>
                              <td style={{ padding:'9px 12px' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="#F4A61D" stroke="#F4A61D" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                  <span style={{ fontSize:'13px', fontWeight:700, color:'#333' }}>{b.averageRating.toFixed(1)}</span>
                                </div>
                              </td>
                              <td style={{ padding:'9px 12px' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                  <div style={{ flex:1, background:'#F0F0F8', borderRadius:4, height:6, minWidth:50 }}>
                                    <div style={{ width:`${pct}%`, background: pct>=80?'#10b981':pct>=60?'#3b82f6':pct>=40?'#f59e0b':'#dc2626', height:'100%', borderRadius:4 }} />
                                  </div>
                                  <span style={{ fontSize:'11px', color:'#888', whiteSpace:'nowrap' }}>{Math.round(pct)}%</span>
                                </div>
                              </td>
                              <td style={{ padding:'9px 12px' }}>
                                <span style={{ ...getBadgeStyle(b.averageRating), padding:'2px 9px', borderRadius:'20px', fontSize:'11px', fontWeight:600 }}>{getBadgeLabel(b.averageRating)}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p style={{ fontSize:'11px', color:'#aaa', margin:'8px 0 0', textAlign:'right' }}>
                    Showing {displayedBranches.length} of {branches.length} branches
                    {performerFilter==='top' && ` — Top ${performerCount} performers`}
                    {performerFilter==='bottom' && ` — Bottom ${performerCount} performers`}
                  </p>
                </>
              )}
            </div>

            {/* Divider */}
            <div style={{ borderTop:'1px solid #E2E8F0', marginBottom:'20px' }} />

            {/* Recent feedback inside responses panel */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px', flexWrap:'wrap', gap:'10px' }}>
                <p style={sectionLabel}>
                  📋 Recent Feedback
                  {totalEntries > 0 && <span style={{ background:'#dbeafe', color:'#1e40af', padding:'2px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:600, marginLeft:'10px' }}>{totalEntries} total</span>}
                </p>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:'9px', top:'50%', transform:'translateY(-50%)', color:'#aaa' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </span>
                  <input type="text" placeholder="Search feedback..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    style={{ ...inputStyle, paddingLeft:'28px', width:'200px' }} />
                </div>
              </div>

              {filteredFeedback.length === 0 ? (
                <EmptyState message="No feedback yet. Submit a form at localhost:3000 to see entries here." />
              ) : (
                <>
                  <div style={{ overflowX:'auto', borderRadius:'10px', border:'1px solid #E8E8F0' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'680px' }}>
                      <thead>
                        <tr>
                          {['Date','Cust. Service','Branch Env.','Recommend.','Overall','Branch','Service','Action'].map(h => (
                            <th key={h} style={{ textAlign:'left', padding:'9px 12px', fontSize:'10px', fontWeight:600, color:'#888', textTransform:'uppercase', letterSpacing:'0.5px', background:'#F8F8FC', borderBottom:'1px solid #E2E8F0' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFeedback.map(f => (
                          <tr key={f.id} style={{ borderBottom:'1px solid #F8F8FC', background:'white' }}
                            onMouseEnter={e => e.currentTarget.style.background='#F8F8FC'}
                            onMouseLeave={e => e.currentTarget.style.background='white'}>
                            <td style={{ padding:'9px 12px' }}>
                              <div style={{ fontWeight:600, fontSize:'12px', color:'#333' }}>{f.date}</div>
                              <div style={{ fontSize:'10px', color:'#bbb' }}>{f.time}</div>
                            </td>
                            <td style={{ padding:'9px 12px' }}><StarDisplay rating={f.customerService} /></td>
                            <td style={{ padding:'9px 12px' }}><StarDisplay rating={f.branchEnvironment} /></td>
                            <td style={{ padding:'9px 12px' }}><StarDisplay rating={f.recommendation} /></td>
                            <td style={{ padding:'9px 12px' }}>
                              <span style={{ ...getBadgeStyle(f.overallRating), padding:'2px 8px', borderRadius:'20px', fontSize:'11px', fontWeight:600 }}>{getBadgeLabel(f.overallRating)}</span>
                            </td>
                            <td style={{ padding:'9px 12px', fontSize:'12px', color:'#555', fontWeight:500 }}>{f.branch}</td>
                            <td style={{ padding:'9px 12px', fontSize:'12px', color:'#555' }}>{f.serviceType||'—'}</td>
                            <td style={{ padding:'9px 12px' }}>
                              <button onClick={() => setSelectedFeedback(f)} style={{ background:'rgba(12,0,75,0.07)', color:LOLC_BLUE, border:'none', borderRadius:'6px', padding:'4px 10px', fontSize:'11px', fontWeight:600, cursor:'pointer', fontFamily:"'Inter', sans-serif" }}>View</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination with 1…n */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'12px', flexWrap:'wrap', gap:'8px' }}>
                    <span style={{ fontSize:'12px', color:'#888' }}>
                      Showing <strong>{filteredFeedback.length}</strong> of <strong>{totalEntries}</strong> entries
                    </span>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={(p) => { setCurrentPage(p); setResponsesPage(p); }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      </div>

      <FeedbackModal feedback={selectedFeedback} onClose={() => setSelectedFeedback(null)} />
      {/* Footer */}
      <div style={{
        borderTop: '1px solid #E2E8F0', padding: '14px 28px',
        textAlign: 'center', background: '#F2F2F8',
      }}>
        <p style={{ fontSize: '12px', color: '#aaa', margin: 0, letterSpacing: '0.3px' }}>
          2026 Powered By LOLC Technologies Ltd
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        select { appearance: auto; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #F0F0F8; }
        ::-webkit-scrollbar-thumb { background: #CBD5E0; border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default DashboardPage;
