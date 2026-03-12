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
import SendLinksPage from './SendLinksPage';
import EmployeePerformancePage from './EmployeePerformancePage';

// ── Design tokens matching LOLC Digital ME ─────────────────────
const NAVY       = '#0d1b2a';
const TEAL       = '#17a2b8';
const TEAL_LIGHT = '#e8f7fa';
const LOLC_BLUE  = '#0C004B'; // kept for chart colours
const CHART_COLORS = ['#0C004B', '#3b82f6', '#10b981', '#f59e0b', '#dc2626'];

const EMPTY_SUMMARY: AnalyticsData = {
  totalFeedback: 0, averageRating: 0, npsScore: 0, responseRate: 0,
  totalFeedbackChange: 0, averageRatingChange: 0, npsScoreChange: 0, responseRateChange: 0,
};

const generateMonthOptions = () => {
  const options: { label: string; value: string }[] = [];
  const now = new Date();
  const cur = new Date(2026, 0, 1);
  while (cur <= now) {
    options.push({ label: cur.toLocaleString('default', { month: 'long', year: 'numeric' }), value: `${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}` });
    cur.setMonth(cur.getMonth() + 1);
  }
  return options;
};
const MONTH_OPTIONS = generateMonthOptions();

// ── Small helpers ──────────────────────────────────────────────
const StarDisplay: React.FC<{ rating: number }> = ({ rating }) => (
  <div style={{ display:'flex', gap:'1px' }}>
    {[1,2,3,4,5].map(s => (
      <svg key={s} width="13" height="13" viewBox="0 0 24 24" fill={s<=rating?'#F4A61D':'none'} stroke={s<=rating?'#F4A61D':'#CBD5E0'} strokeWidth="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ))}
  </div>
);
const getBadgeStyle = (r:number):React.CSSProperties => r>=4.5?{background:'#d1fae5',color:'#065f46'}:r>=3.5?{background:'#dbeafe',color:'#1e40af'}:r>=2.5?{background:'#fef3c7',color:'#92400e'}:{background:'#fee2e2',color:'#991b1b'};
const getBadgeLabel = (r:number) => r>=4.5?'Excellent':r>=3.5?'Good':r>=2.5?'Average':'Poor';
const EmptyState: React.FC<{message:string}> = ({message}) => (
  <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 20px',color:'#aaa'}}>
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#CBD5E0" strokeWidth="1.5" style={{marginBottom:'10px'}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    <p style={{fontSize:'13px',margin:0,textAlign:'center'}}>{message}</p>
  </div>
);
const RatingBar: React.FC<{star:number;count:number;total:number}> = ({star,count,total}) => {
  const pct = total>0?Math.round((count/total)*100):0;
  const colors=['#dc2626','#f97316','#f59e0b','#3b82f6','#10b981'];
  return (
    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'5px'}}>
      <span style={{fontSize:'12px',color:'#555',width:14,textAlign:'right'}}>{star}</span>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="#F4A61D" stroke="#F4A61D" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      <div style={{flex:1,background:'#F0F0F8',borderRadius:4,height:8,overflow:'hidden'}}><div style={{width:`${pct}%`,background:colors[star-1],height:'100%',borderRadius:4,transition:'width 0.4s'}}/></div>
      <span style={{fontSize:'12px',color:'#888',width:36,textAlign:'right'}}>{pct}%</span>
      <span style={{fontSize:'11px',color:'#bbb',width:36}}>({count})</span>
    </div>
  );
};

const KpiCard: React.FC<{title:string;value:string;change:number;icon:string;active:boolean;onClick:()=>void}> = ({title,value,change,icon,active,onClick}) => {
  const isPos=change>=0;
  return (
    <div onClick={onClick} style={{background:active?NAVY:'white',borderRadius:'8px',padding:'18px',boxShadow:active?'0 4px 16px rgba(13,27,42,0.3)':'0 1px 3px rgba(0,0,0,0.08)',border:active?'none':`1px solid #e0e4e8`,borderTop:active?`3px solid ${TEAL}`:`3px solid ${TEAL}`,cursor:'pointer',transition:'all 0.2s',userSelect:'none'}}
      onMouseEnter={e=>{if(!active)e.currentTarget.style.background=TEAL_LIGHT;}}
      onMouseLeave={e=>{if(!active)e.currentTarget.style.background='white';}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div>
          <p style={{fontSize:'11px',fontWeight:600,color:active?'rgba(255,255,255,0.6)':'#6b7280',margin:0,textTransform:'uppercase',letterSpacing:'0.5px'}}>{title}</p>
          <div style={{fontSize:'26px',fontWeight:700,color:active?'#fff':'#2d3748',marginTop:'6px',lineHeight:1.1}}>{value}</div>
        </div>
        <div style={{width:38,height:38,background:active?'rgba(255,255,255,0.1)':`rgba(23,162,184,0.1)`,borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>{icon}</div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:'5px',marginTop:'10px',fontSize:'11px',fontWeight:500,color:active?'rgba(255,255,255,0.7)':(isPos?'#059669':'#dc2626')}}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points={isPos?"18 15 12 9 6 15":"6 9 12 15 18 9"}/></svg>
        {Math.abs(change)}% vs last month
        <span style={{marginLeft:'auto',fontSize:'10px',opacity:0.6}}>{active?'▲ collapse':'expand ▼'}</span>
      </div>
    </div>
  );
};

const Pagination: React.FC<{currentPage:number;totalPages:number;onPageChange:(p:number)=>void}> = ({currentPage,totalPages,onPageChange}) => {
  if(totalPages<=1) return null;
  const btn:React.CSSProperties={minWidth:28,height:28,borderRadius:'4px',border:'1px solid #e0e4e8',background:'white',color:'#555',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:"'Segoe UI',Arial,sans-serif",padding:'0 6px',display:'flex',alignItems:'center',justifyContent:'center'};
  const pages:(number|'...')[]=[]; const add=(p:number)=>{if(!pages.includes(p))pages.push(p);};
  add(1); if(currentPage>3)pages.push('...');
  for(let p=Math.max(2,currentPage-1);p<=Math.min(totalPages-1,currentPage+1);p++)add(p);
  if(currentPage<totalPages-2)pages.push('...');
  if(totalPages>1)add(totalPages);
  return (
    <div style={{display:'flex',gap:'4px',alignItems:'center'}}>
      <button onClick={()=>onPageChange(1)} disabled={currentPage===1} style={{...btn,color:currentPage===1?'#ccc':'#555',cursor:currentPage===1?'default':'pointer'}}>«</button>
      <button onClick={()=>onPageChange(currentPage-1)} disabled={currentPage===1} style={{...btn,color:currentPage===1?'#ccc':'#555',cursor:currentPage===1?'default':'pointer'}}>‹</button>
      {pages.map((p,i)=>p==='...'?<span key={`e${i}`} style={{fontSize:'12px',color:'#aaa',padding:'0 4px'}}>…</span>:<button key={p} onClick={()=>onPageChange(p as number)} style={{...btn,border:currentPage===p?'none':'1px solid #e0e4e8',background:currentPage===p?TEAL:'white',color:currentPage===p?'white':'#555'}}>{p}</button>)}
      <button onClick={()=>onPageChange(currentPage+1)} disabled={currentPage===totalPages} style={{...btn,color:currentPage===totalPages?'#ccc':'#555',cursor:currentPage===totalPages?'default':'pointer'}}>›</button>
      <button onClick={()=>onPageChange(totalPages)} disabled={currentPage===totalPages} style={{...btn,color:currentPage===totalPages?'#ccc':'#555',cursor:currentPage===totalPages?'default':'pointer'}}>»</button>
    </div>
  );
};

const BranchSelect: React.FC<{branches:BranchPerformance[];value:string;onChange:(v:string)=>void;placeholder?:string;style?:React.CSSProperties}> = ({branches,value,onChange,placeholder='All Branches',style}) => {
  const [search,setSearch]=useState(''); const [open,setOpen]=useState(false);
  const filtered=branches.filter(b=>b.branchName.toLowerCase().includes(search.toLowerCase()));
  const selected=branches.find(b=>b.branchId===value);
  return (
    <div style={{position:'relative',...style}}>
      <div onClick={()=>setOpen(o=>!o)} style={{padding:'7px 10px',border:'1px solid #e0e4e8',borderRadius:'4px',fontSize:'13px',color:value?'#2d3748':'#6b7280',background:'white',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',minWidth:200}}>
        <span>{selected?selected.branchName:placeholder}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" style={{transform:open?'rotate(180deg)':'none',transition:'0.2s'}}><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      {open&&(
        <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:200,background:'white',border:'1px solid #e0e4e8',borderRadius:'4px',boxShadow:'0 4px 12px rgba(0,0,0,0.1)',marginTop:'2px',overflow:'hidden'}}>
          <div style={{padding:'6px'}}><input autoFocus type="text" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%',padding:'5px 8px',border:'1px solid #e0e4e8',borderRadius:'4px',fontSize:'12px',outline:'none',boxSizing:'border-box' as const}}/></div>
          <div style={{maxHeight:180,overflowY:'auto'}}>
            <div onClick={()=>{onChange('');setOpen(false);setSearch('');}} style={{padding:'7px 10px',fontSize:'13px',color:'#6b7280',cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.background=TEAL_LIGHT} onMouseLeave={e=>e.currentTarget.style.background='white'}>{placeholder}</div>
            {filtered.map(b=>(
              <div key={b.branchId} onClick={()=>{onChange(b.branchId);setOpen(false);setSearch('');}} style={{padding:'7px 10px',fontSize:'13px',color:'#2d3748',cursor:'pointer',background:value===b.branchId?TEAL_LIGHT:'white'}} onMouseEnter={e=>e.currentTarget.style.background=TEAL_LIGHT} onMouseLeave={e=>e.currentTarget.style.background=value===b.branchId?TEAL_LIGHT:'white'}>{b.branchName}</div>
            ))}
            {filtered.length===0&&<p style={{padding:'7px 10px',fontSize:'12px',color:'#aaa',margin:0}}>No branches found</p>}
          </div>
        </div>
      )}
    </div>
  );
};

type NavTab = 'analytics' | 'send-links' | 'employee-performance';

// ── Main Dashboard ─────────────────────────────────────────────
const DashboardPage: React.FC = () => {
  const {username,logout} = useAuth();
  const [activeTab,setActiveTab] = useState<NavTab>('analytics');

  const [summary,setSummary]=useState<AnalyticsData>(EMPTY_SUMMARY);
  const [trends,setTrends]=useState<TrendDataPoint[]>([]);
  const [ratingDist,setRatingDist]=useState<RatingDistribution[]>([]);
  const [branches,setBranches]=useState<BranchPerformance[]>([]);
  const [serviceDist,setServiceDist]=useState<ServiceDistribution[]>([]);
  const [feedbackList,setFeedbackList]=useState<FeedbackEntry[]>([]);
  const [selectedFeedback,setSelectedFeedback]=useState<FeedbackEntry|null>(null);
  const [totalEntries,setTotalEntries]=useState(0);
  const [activeCard,setActiveCard]=useState<string|null>(null);
  const [isLoading,setIsLoading]=useState(true);
  const [error,setError]=useState('');
  const [filters,setFilters]=useState<FilterParams>({});
  const [searchTerm,setSearchTerm]=useState('');
  const [currentPage,setCurrentPage]=useState(1);
  const [isExporting,setIsExporting]=useState(false);
  const [trendFromMonth,setTrendFromMonth]=useState('2026-01');
  const [trendToMonth,setTrendToMonth]=useState(()=>{const n=new Date();return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`;});
  const [selectedBranchId,setSelectedBranchId]=useState('');
  const ratingBranchId=selectedBranchId; const setRatingBranchId=setSelectedBranchId;
  const npsBranchId=selectedBranchId;    const setNpsBranchId=setSelectedBranchId;
  const [branchTableSearch,setBranchTableSearch]=useState('');
  const [performerFilter,setPerformerFilter]=useState<'all'|'top'|'bottom'>('all');
  const [performerCount,setPerformerCount]=useState(10);
  const [responsesPage,setResponsesPage]=useState(1);

  const loadData=useCallback(async()=>{setIsLoading(true);setError('');try{const[s,b]=await Promise.all([analyticsService.getSummary(),analyticsService.getBranchPerformance()]);setSummary(s);setBranches(b);}catch{setError('Cannot connect to backend. Make sure Spring Boot is running on port 8080.');}finally{setIsLoading(false);}}, []);
  const loadTrends=useCallback(async()=>{try{setTrends(await analyticsService.getTrends(trendFromMonth,trendToMonth,selectedBranchId||undefined));}catch{setTrends([]);}}, [trendFromMonth,trendToMonth,selectedBranchId]);
  const loadRatingDist=useCallback(async()=>{try{setRatingDist(await analyticsService.getRatingDistribution(selectedBranchId||undefined));}catch{setRatingDist([]);}}, [selectedBranchId]);
  const loadServiceDist=useCallback(async()=>{try{setServiceDist(await analyticsService.getServiceDistribution(selectedBranchId||undefined));}catch{setServiceDist([]);}}, [selectedBranchId]);
  const loadFeedback=useCallback(async()=>{try{const res=await feedbackService.getAll({...filters,branch:selectedBranchId||filters.branch,search:searchTerm,page:currentPage-1});setFeedbackList(res.content||[]);setTotalEntries(res.totalElements||0);}catch{setFeedbackList([]);setTotalEntries(0);}}, [filters,searchTerm,currentPage,selectedBranchId]);

  useEffect(()=>{loadData();},[loadData]);
  useEffect(()=>{loadTrends();},[loadTrends]);
  useEffect(()=>{loadRatingDist();},[loadRatingDist]);
  useEffect(()=>{loadServiceDist();},[loadServiceDist]);
  useEffect(()=>{loadFeedback();},[loadFeedback]);

  const handleExport=async()=>{setIsExporting(true);try{const blob=await feedbackService.exportCsv(filters);const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`LOLC_Feedback_${new Date().toISOString().split('T')[0]}.csv`;a.click();}catch{const h='Date,Time,Customer Service,Branch Environment,Recommendation,Overall,Branch,Service,Comments\n';const rows=feedbackList.map(f=>`${f.date},${f.time},${f.customerService},${f.branchEnvironment},${f.recommendation},${f.overallRating},${f.branch},${f.serviceType||''},"${f.additionalComments||''}"`).join('\n');const blob=new Blob([h+rows],{type:'text/csv'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`LOLC_Feedback_${new Date().toISOString().split('T')[0]}.csv`;a.click();}finally{setIsExporting(false);}};

  const searchedBranches=branches.filter(b=>b.branchName.toLowerCase().includes(branchTableSearch.toLowerCase()));
  const sortedBranches=[...searchedBranches].sort((a,b)=>b.averageRating-a.averageRating);
  const displayedBranches=performerFilter==='top'?sortedBranches.slice(0,performerCount):performerFilter==='bottom'?sortedBranches.slice(-performerCount).reverse():sortedBranches;
  const ROWS_PER_PAGE=10; const totalPages=Math.max(1,Math.ceil(totalEntries/ROWS_PER_PAGE));
  const filteredFeedback=feedbackList.filter(f=>{if(!searchTerm)return true;const t=searchTerm.toLowerCase();return f.branch.toLowerCase().includes(t)||(f.additionalComments||'').toLowerCase().includes(t)||(f.serviceType||'').toLowerCase().includes(t);});
  const getRatingTotal=(d:RatingDistribution)=>d.fiveStar+d.fourStar+d.threeStar+d.twoStar+d.oneStar;

  const inp:React.CSSProperties={padding:'7px 10px',border:'1px solid #e0e4e8',borderRadius:'4px',fontSize:'13px',fontFamily:"'Segoe UI',Arial,sans-serif",color:'#2d3748',outline:'none',background:'white'};
  const panelStyle:React.CSSProperties={background:'white',borderRadius:'0 0 8px 8px',padding:'20px',marginTop:'-2px',border:'1px solid #e0e4e8',borderTop:'none',marginBottom:'14px',boxShadow:'0 2px 6px rgba(0,0,0,0.06)'};
  const sectionLabel:React.CSSProperties={margin:'0 0 14px',fontWeight:700,fontSize:'14px',color:'#2d3748'};

  // Tab style matching Digital ME
  const tabStyle=(tab:NavTab):React.CSSProperties=>({
    padding:'0 18px', height:'100%', border:'none', borderBottom: activeTab===tab?`3px solid ${TEAL}`:'3px solid transparent',
    background:'transparent', color:activeTab===tab?TEAL:'rgba(255,255,255,0.65)', fontSize:'13px', fontWeight:600,
    cursor:'pointer', fontFamily:"'Segoe UI',Arial,sans-serif", transition:'all 0.15s', display:'flex', alignItems:'center', gap:6,
  });

  return (
    <div style={{minHeight:'100vh',background:'#f4f6f8',fontFamily:"'Segoe UI',Arial,sans-serif"}}>

      {/* ── Header ── */}
      <div style={{background:NAVY,boxShadow:'0 2px 8px rgba(0,0,0,0.3)',position:'sticky',top:0,zIndex:300}}>
        {/* Top bar */}
        <div style={{padding:'0 24px',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{maxWidth:'1400px',margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center',height:'52px'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{background:TEAL,borderRadius:6,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
              </div>
              <div>
                <div style={{color:'white',fontSize:'15px',fontWeight:700,letterSpacing:'-0.3px'}}>LOLC Admin Dashboard</div>
                <div style={{color:'rgba(255,255,255,0.45)',fontSize:'10px',letterSpacing:'0.3px'}}>Customer Feedback Analytics</div>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{textAlign:'right',marginRight:4}}>
                <div style={{color:'white',fontSize:'13px',fontWeight:600}}>{username}</div>
                <div style={{color:'rgba(255,255,255,0.45)',fontSize:'10px'}}>Administrator</div>
              </div>
              <button onClick={logout} style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:'4px',color:'rgba(255,255,255,0.8)',padding:'5px 12px',fontSize:'12px',cursor:'pointer',fontFamily:'inherit'}}>Logout</button>
            </div>
          </div>
        </div>

        {/* ── Navigation Tabs ── */}
        <div style={{padding:'0 24px'}}>
          <div style={{maxWidth:'1400px',margin:'0 auto',display:'flex',alignItems:'stretch',height:'40px',gap:2}}>
            <button style={tabStyle('analytics')} onClick={()=>setActiveTab('analytics')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              Analytics
            </button>
            <button style={tabStyle('send-links')} onClick={()=>setActiveTab('send-links')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              Send Links
            </button>
            <button style={tabStyle('employee-performance')} onClick={()=>setActiveTab('employee-performance')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Employee Performance
            </button>
            {activeTab==='analytics'&&(
              <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6}}>
                <button onClick={()=>{loadData();loadTrends();loadRatingDist();loadServiceDist();loadFeedback();}} style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:'4px',color:'rgba(255,255,255,0.8)',padding:'4px 10px',fontSize:'12px',cursor:'pointer',fontFamily:'inherit'}}>🔄 Refresh</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Tab Content ── */}
      {activeTab==='send-links' && <SendLinksPage />}
      {activeTab==='employee-performance' && <EmployeePerformancePage />}

      {activeTab==='analytics' && (
        <div style={{maxWidth:'1400px',margin:'0 auto',padding:'20px 24px'}}>

          {error&&<div style={{background:'#f8d7da',border:'1px solid #f5c6cb',borderRadius:'6px',padding:'10px 14px',marginBottom:'14px',color:'#721c24',fontSize:'13px'}}>⚠️ {error}</div>}
          {isLoading&&<div style={{background:'#cff4fc',border:'1px solid #b6effb',borderRadius:'6px',padding:'10px 14px',marginBottom:'14px',color:'#055160',fontSize:'13px'}}>⏳ Loading data...</div>}

          {/* Filter bar */}
          <div style={{background:'white',borderRadius:'6px',padding:'12px 16px',marginBottom:'14px',boxShadow:'0 1px 3px rgba(0,0,0,0.08)',display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}}>
            <select style={inp} value={selectedBranchId} onChange={e=>{setSelectedBranchId(e.target.value);setFilters(p=>({...p,branch:e.target.value||undefined}));}}>
              <option value="">All Branches</option>
              {branches.map(b=><option key={b.branchId} value={b.branchId}>{b.branchName}</option>)}
            </select>
            <select style={inp} value={filters.rating||''} onChange={e=>setFilters(p=>({...p,rating:e.target.value||undefined}))}>
              <option value="">All Ratings</option>
              {['5','4','3','2','1'].map(r=><option key={r} value={r}>{r} Stars</option>)}
            </select>
            <select style={inp} value={filters.serviceType||''} onChange={e=>setFilters(p=>({...p,serviceType:e.target.value||undefined}))}>
              <option value="">All Services</option>
              {['Loans','Savings','Insurance','Leasing'].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <button style={{padding:'7px 16px',borderRadius:'4px',border:'none',background:TEAL,color:'white',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}} onClick={()=>{loadData();loadTrends();loadRatingDist();loadServiceDist();loadFeedback();}}>Apply</button>
            <button style={{padding:'7px 16px',borderRadius:'4px',border:'1px solid #e0e4e8',background:'white',color:'#555',fontSize:'13px',cursor:'pointer',fontFamily:'inherit'}} onClick={()=>{setFilters({});setSearchTerm('');setCurrentPage(1);setSelectedBranchId('');}}>Reset</button>
            <button style={{padding:'7px 16px',borderRadius:'4px',border:'none',background:'#28a745',color:'white',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',marginLeft:'auto'}} onClick={handleExport} disabled={isExporting}>{isExporting?'Exporting...':'⬇ Export CSV'}</button>
          </div>

          {/* KPI Cards */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:'10px',marginBottom:'4px'}}>
            <KpiCard title="Total Feedback" value={summary.totalFeedback.toString()} change={summary.totalFeedbackChange} icon="📝" active={activeCard==='feedback'} onClick={()=>setActiveCard(p=>p==='feedback'?null:'feedback')}/>
            <KpiCard title="Average Rating" value={summary.averageRating>0?`${summary.averageRating.toFixed(1)} / 5`:'—'} change={summary.averageRatingChange} icon="⭐" active={activeCard==='rating'} onClick={()=>setActiveCard(p=>p==='rating'?null:'rating')}/>
            <KpiCard title="NPS Score" value={summary.npsScore!==0?summary.npsScore.toString():'—'} change={summary.npsScoreChange} icon="📊" active={activeCard==='nps'} onClick={()=>setActiveCard(p=>p==='nps'?null:'nps')}/>
            <KpiCard title="Total Responses" value={totalEntries>0?totalEntries.toString():'0'} change={summary.responseRateChange} icon="✅" active={activeCard==='responses'} onClick={()=>setActiveCard(p=>p==='responses'?null:'responses')}/>
          </div>

          {/* Panel 1 — Trends */}
          {activeCard==='feedback'&&(
            <div style={panelStyle}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px',flexWrap:'wrap',gap:'10px'}}>
                <p style={sectionLabel}>📈 Feedback Trends</p>
                <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                  <span style={{fontSize:'12px',color:'#6b7280'}}>From</span>
                  <select style={inp} value={trendFromMonth} onChange={e=>setTrendFromMonth(e.target.value)}>{MONTH_OPTIONS.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}</select>
                  <span style={{fontSize:'12px',color:'#6b7280'}}>To</span>
                  <select style={inp} value={trendToMonth} onChange={e=>setTrendToMonth(e.target.value)}>{MONTH_OPTIONS.filter(m=>m.value>=trendFromMonth).map(m=><option key={m.value} value={m.value}>{m.label}</option>)}</select>
                </div>
              </div>
              {trends.length===0?<EmptyState message="No trend data yet."/>:(
                <div style={{height:250}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f8"/>
                      <XAxis dataKey="month" tick={{fontSize:11}}/>
                      <YAxis domain={[0,5]} tick={{fontSize:11}}/>
                      <Tooltip contentStyle={{borderRadius:'6px',border:'1px solid #e0e4e8',fontFamily:"'Segoe UI',Arial,sans-serif",fontSize:'12px'}}/>
                      <Legend iconType="circle" wrapperStyle={{fontSize:'11px'}}/>
                      <Line type="monotone" dataKey="customerService" name="Customer Service" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false}/>
                      <Line type="monotone" dataKey="branchEnvironment" name="Branch Environment" stroke={CHART_COLORS[1]} strokeWidth={2} dot={false}/>
                      <Line type="monotone" dataKey="recommendation" name="Recommendation" stroke={CHART_COLORS[2]} strokeWidth={2} dot={false}/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Panel 2 — Rating Breakdown */}
          {activeCard==='rating'&&(
            <div style={panelStyle}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px',flexWrap:'wrap',gap:'10px'}}>
                <p style={sectionLabel}>⭐ Rating Breakdown by Question</p>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}><span style={{fontSize:'12px',color:'#6b7280'}}>Filter by branch:</span><BranchSelect branches={branches} value={ratingBranchId} onChange={setRatingBranchId}/></div>
              </div>
              {ratingBranchId&&<div style={{background:'#cff4fc',borderRadius:'4px',padding:'7px 12px',marginBottom:'12px',fontSize:'12px',color:'#055160'}}>📍 Showing: <strong>{branches.find(b=>b.branchId===ratingBranchId)?.branchName}</strong><button onClick={()=>setRatingBranchId('')} style={{marginLeft:10,background:'none',border:'none',color:TEAL,cursor:'pointer',fontSize:'12px',fontWeight:600}}>✕ Clear</button></div>}
              {ratingDist.length===0?<EmptyState message="No rating data yet."/>:(
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'16px'}}>
                  {ratingDist.map(dist=>{const total=getRatingTotal(dist);return(
                    <div key={dist.category} style={{background:'#f4f6f8',borderRadius:'6px',padding:'16px',border:'1px solid #e0e4e8'}}>
                      <p style={{margin:'0 0 12px',fontWeight:600,fontSize:'13px',color:'#2d3748'}}>{dist.category}</p>
                      {[{star:5,count:dist.fiveStar},{star:4,count:dist.fourStar},{star:3,count:dist.threeStar},{star:2,count:dist.twoStar},{star:1,count:dist.oneStar}].map(({star,count})=><RatingBar key={star} star={star} count={count} total={total}/>)}
                      <div style={{marginTop:'10px',paddingTop:'10px',borderTop:'1px solid #e0e4e8',display:'flex',justifyContent:'space-between',fontSize:'12px'}}><span style={{color:'#6b7280'}}>Total responses</span><span style={{fontWeight:700,color:'#2d3748'}}>{total}</span></div>
                    </div>
                  );})}
                </div>
              )}
            </div>
          )}

          {/* Panel 3 — Service Distribution */}
          {activeCard==='nps'&&(
            <div style={panelStyle}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px',flexWrap:'wrap',gap:'10px'}}>
                <p style={sectionLabel}>📊 Feedback by Service Type</p>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}><span style={{fontSize:'12px',color:'#6b7280'}}>Filter by branch:</span><BranchSelect branches={branches} value={npsBranchId} onChange={setNpsBranchId}/></div>
              </div>
              {npsBranchId&&<div style={{background:'#cff4fc',borderRadius:'4px',padding:'7px 12px',marginBottom:'12px',fontSize:'12px',color:'#055160'}}>📍 Showing: <strong>{branches.find(b=>b.branchId===npsBranchId)?.branchName}</strong><button onClick={()=>setNpsBranchId('')} style={{marginLeft:10,background:'none',border:'none',color:TEAL,cursor:'pointer',fontSize:'12px',fontWeight:600}}>✕ Clear</button></div>}
              {serviceDist.length===0?<EmptyState message="No service data yet."/>:(
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px'}}>
                  <div style={{height:230}}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={serviceDist} cx="50%" cy="45%" outerRadius={82} innerRadius={48} dataKey="value" paddingAngle={3}>{serviceDist.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}</Pie><Tooltip contentStyle={{borderRadius:'6px',border:'1px solid #e0e4e8',fontSize:'12px'}}/><Legend iconType="circle" wrapperStyle={{fontSize:'11px'}}/></PieChart></ResponsiveContainer></div>
                  <div style={{display:'flex',flexDirection:'column',justifyContent:'center',gap:'10px'}}>
                    {serviceDist.map((s,i)=>{const total=serviceDist.reduce((sum,x)=>sum+x.value,0);const pct=total>0?Math.round((s.value/total)*100):0;return(<div key={s.name} style={{display:'flex',alignItems:'center',gap:'10px'}}><div style={{width:10,height:10,borderRadius:'50%',background:CHART_COLORS[i%CHART_COLORS.length],flexShrink:0}}/><span style={{fontSize:'13px',color:'#2d3748',flex:1}}>{s.name}</span><span style={{fontSize:'13px',fontWeight:700,color:'#2d3748'}}>{pct}%</span><span style={{fontSize:'12px',color:'#6b7280'}}>({s.value})</span></div>);})}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Panel 4 — Branch Performance + Recent Feedback */}
          {activeCard==='responses'&&(
            <div style={panelStyle}>
              <div style={{marginBottom:'24px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px',flexWrap:'wrap',gap:'10px'}}>
                  <p style={sectionLabel}>🏢 Branch Performance</p>
                  <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
                    <select style={inp} value={performerFilter} onChange={e=>setPerformerFilter(e.target.value as 'all'|'top'|'bottom')}><option value="all">All Branches</option><option value="top">Top Performers</option><option value="bottom">Bottom Performers</option></select>
                    {performerFilter!=='all'&&<select style={inp} value={performerCount} onChange={e=>setPerformerCount(Number(e.target.value))}>{[5,10,20,50].map(n=><option key={n} value={n}>Top {n}</option>)}</select>}
                    <div style={{position:'relative'}}><span style={{position:'absolute',left:'9px',top:'50%',transform:'translateY(-50%)',color:'#aaa',fontSize:12}}>🔍</span><input type="text" placeholder="Search branches..." value={branchTableSearch} onChange={e=>setBranchTableSearch(e.target.value)} style={{...inp,paddingLeft:'28px',width:'180px'}}/></div>
                  </div>
                </div>
                {displayedBranches.length===0?<EmptyState message={branchTableSearch?`No branches matching "${branchTableSearch}"`:' No branch data yet.'}/>:(
                  <div style={{overflowX:'auto',maxHeight:'340px',overflowY:'auto',borderRadius:'6px',border:'1px solid #e0e4e8'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',minWidth:'520px',fontSize:'13px'}}>
                      <thead style={{position:'sticky',top:0,zIndex:10}}>
                        <tr style={{background:NAVY}}>
                          {['Rank','Branch','Responses','Avg Rating','Score %','Performance'].map(h=><th key={h} style={{textAlign:'left',padding:'9px 14px',fontSize:'11px',fontWeight:600,color:'white',textTransform:'uppercase',letterSpacing:'0.4px'}}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {displayedBranches.map((b,i)=>{const gr=sortedBranches.findIndex(x=>x.branchId===b.branchId)+1;const pct=(b.averageRating/5)*100;return(
                          <tr key={b.branchId} style={{borderBottom:'1px solid #f0f0f0',background:i%2===0?'white':'#fafbfc'}} onMouseEnter={e=>e.currentTarget.style.background=TEAL_LIGHT} onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'white':'#fafbfc'}>
                            <td style={{padding:'9px 14px'}}><span style={{width:24,height:24,borderRadius:'50%',background:gr<=3?TEAL:'#e9ecef',color:gr<=3?'white':'#555',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:700}}>{gr}</span></td>
                            <td style={{padding:'9px 14px',fontWeight:500,color:'#2d3748'}}>{b.branchName}</td>
                            <td style={{padding:'9px 14px',color:'#555'}}>{b.totalFeedback}</td>
                            <td style={{padding:'9px 14px'}}><div style={{display:'flex',alignItems:'center',gap:'4px'}}><svg width="11" height="11" viewBox="0 0 24 24" fill="#F4A61D" stroke="#F4A61D" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg><span style={{fontWeight:700,color:'#2d3748'}}>{b.averageRating.toFixed(1)}</span></div></td>
                            <td style={{padding:'9px 14px'}}><div style={{display:'flex',alignItems:'center',gap:'6px'}}><div style={{flex:1,background:'#e9ecef',borderRadius:4,height:6,minWidth:50}}><div style={{width:`${pct}%`,background:pct>=80?'#28a745':pct>=60?TEAL:pct>=40?'#f59e0b':'#dc3545',height:'100%',borderRadius:4}}/></div><span style={{fontSize:'11px',color:'#6b7280',whiteSpace:'nowrap'}}>{Math.round(pct)}%</span></div></td>
                            <td style={{padding:'9px 14px'}}><span style={{...getBadgeStyle(b.averageRating),padding:'2px 9px',borderRadius:'4px',fontSize:'11px',fontWeight:600}}>{getBadgeLabel(b.averageRating)}</span></td>
                          </tr>
                        );})}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div style={{borderTop:'1px solid #e0e4e8',marginBottom:'20px'}}/>

              <div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px',flexWrap:'wrap',gap:'10px'}}>
                  <p style={sectionLabel}>📋 Recent Feedback{totalEntries>0&&<span style={{background:'#cff4fc',color:'#055160',padding:'2px 10px',borderRadius:'4px',fontSize:'11px',fontWeight:600,marginLeft:'10px'}}>{totalEntries} total</span>}</p>
                  <div style={{position:'relative'}}><span style={{position:'absolute',left:'9px',top:'50%',transform:'translateY(-50%)',color:'#aaa',fontSize:12}}>🔍</span><input type="text" placeholder="Search feedback..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={{...inp,paddingLeft:'28px',width:'200px'}}/></div>
                </div>
                {filteredFeedback.length===0?<EmptyState message="No feedback yet. Submit a form at localhost:3000 to see entries here."/>:(
                  <>
                    <div style={{overflowX:'auto',borderRadius:'6px',border:'1px solid #e0e4e8'}}>
                      <table style={{width:'100%',borderCollapse:'collapse',minWidth:'680px',fontSize:'13px'}}>
                        <thead><tr style={{background:NAVY}}>{['Date','Cust. Service','Branch Env.','Recommend.','Overall','Branch','Service','Action'].map(h=><th key={h} style={{textAlign:'left',padding:'9px 14px',fontSize:'11px',fontWeight:600,color:'white',textTransform:'uppercase',letterSpacing:'0.4px'}}>{h}</th>)}</tr></thead>
                        <tbody>
                          {filteredFeedback.map((f,i)=>(
                            <tr key={f.id} style={{borderBottom:'1px solid #f0f0f0',background:i%2===0?'white':'#fafbfc'}} onMouseEnter={e=>e.currentTarget.style.background=TEAL_LIGHT} onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'white':'#fafbfc'}>
                              <td style={{padding:'9px 14px'}}><div style={{fontWeight:600,fontSize:'12px',color:'#2d3748'}}>{f.date}</div><div style={{fontSize:'10px',color:'#bbb'}}>{f.time}</div></td>
                              <td style={{padding:'9px 14px'}}><StarDisplay rating={f.customerService}/></td>
                              <td style={{padding:'9px 14px'}}><StarDisplay rating={f.branchEnvironment}/></td>
                              <td style={{padding:'9px 14px'}}><StarDisplay rating={f.recommendation}/></td>
                              <td style={{padding:'9px 14px'}}><span style={{...getBadgeStyle(f.overallRating),padding:'2px 8px',borderRadius:'4px',fontSize:'11px',fontWeight:600}}>{getBadgeLabel(f.overallRating)}</span></td>
                              <td style={{padding:'9px 14px',fontSize:'12px',color:'#555',fontWeight:500}}>{f.branch}</td>
                              <td style={{padding:'9px 14px',fontSize:'12px',color:'#555'}}>{f.serviceType||'—'}</td>
                              <td style={{padding:'9px 14px'}}><button onClick={()=>setSelectedFeedback(f)} style={{background:TEAL,color:'white',border:'none',borderRadius:'4px',padding:'4px 12px',fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>View</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'12px',flexWrap:'wrap',gap:'8px'}}>
                      <span style={{fontSize:'12px',color:'#6b7280'}}>Showing <strong>{filteredFeedback.length}</strong> of <strong>{totalEntries}</strong> entries</span>
                      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={p=>{setCurrentPage(p);setResponsesPage(p);}}/>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <FeedbackModal feedback={selectedFeedback} onClose={()=>setSelectedFeedback(null)}/>

      <div style={{borderTop:'1px solid #e0e4e8',padding:'12px 24px',textAlign:'center',background:'white'}}>
        <p style={{fontSize:'12px',color:'#9ca3af',margin:0,letterSpacing:'0.3px'}}>2026 Powered By LOLC Technologies Ltd</p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        select { appearance: auto; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #f4f6f8; }
        ::-webkit-scrollbar-thumb { background: #c4cdd6; border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default DashboardPage;
