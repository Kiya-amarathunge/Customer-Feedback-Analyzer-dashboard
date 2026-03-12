import React, { useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const C = {
  navy:      '#0d1b2a',
  teal:      '#17a2b8',
  tealLight: '#e8f7fa',
  white:     '#ffffff',
  bg:        '#f4f6f8',
  border:    '#e0e4e8',
  text:      '#2d3748',
  textLight: '#6b7280',
};

interface EmployeePerf {
  employeeNumber: string;
  employeeName: string;
  branchName: string;
  totalSent: number;
  totalCompleted: number;
  averageRating: number;
  completionRate: number;
}

const StarDisplay = ({ rating }: { rating: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
    {[1,2,3,4,5].map(s => (
      <svg key={s} width="13" height="13" viewBox="0 0 24 24" fill={rating >= s ? '#f59e0b' : 'none'} stroke={rating >= s ? '#f59e0b' : '#d1d5db'} strokeWidth="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ))}
    <span style={{ fontSize: 12, color: C.textLight, marginLeft: 4 }}>{rating > 0 ? rating.toFixed(1) : '—'}</span>
  </div>
);

const PerfBadge = ({ rating }: { rating: number }) => {
  if (rating === 0) return <span style={{ color: C.textLight, fontSize: 12 }}>No data</span>;
  const cfg =
    rating >= 4.5 ? { bg: '#d4edda', color: '#155724', label: 'Excellent'         } :
    rating >= 3.5 ? { bg: '#cff4fc', color: '#055160', label: 'Good'              } :
    rating >= 2.5 ? { bg: '#fff3cd', color: '#856404', label: 'Average'           } :
                    { bg: '#f8d7da', color: '#721c24', label: 'Needs Improvement'  };
  return <span style={{ padding: '3px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>;
};

const EmployeePerformancePage: React.FC = () => {
  const [data, setData]       = useState<EmployeePerf[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [branch, setBranch]   = useState('');
  const [page, setPage]       = useState(1);
  const ROWS = 10;

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/employee-performance`)
      .then(r => r.json()).then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const branches = Array.from(new Set(data.map(d => d.branchName).filter(Boolean)));

  const filtered = data.filter(d =>
    (!search || d.employeeName?.toLowerCase().includes(search.toLowerCase()) || d.employeeNumber?.toLowerCase().includes(search.toLowerCase())) &&
    (!branch || d.branchName === branch)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS));
  const paginated  = filtered.slice((page - 1) * ROWS, page * ROWS);

  const avgAll  = data.length ? (data.reduce((s, d) => s + d.averageRating, 0) / data.length) : 0;
  const topPerf = data.filter(d => d.averageRating >= 4.5).length;
  const needsImp= data.filter(d => d.averageRating > 0 && d.averageRating < 3).length;

  const inp: React.CSSProperties = { padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: '4px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', color: C.text, background: C.white };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "'Segoe UI', Arial, sans-serif" }}>

      {/* Breadcrumb */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '8px 24px', fontSize: '12px', color: C.textLight }}>
        Home &gt; <span style={{ color: C.teal }}>Analytics</span> &gt; Employee Performance
      </div>

      <div style={{ padding: '20px 24px' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, color: C.text }}>Employee Performance</h2>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Total Employees',    value: data.length,              color: C.teal    },
            { label: 'Average Rating',     value: avgAll > 0 ? `${avgAll.toFixed(1)} / 5` : '—', color: '#f59e0b' },
            { label: 'Top Performers',     value: topPerf,                  color: '#28a745', sub: 'Rating ≥ 4.5' },
            { label: 'Needs Improvement',  value: needsImp,                 color: '#dc3545', sub: 'Rating < 3.0' },
          ].map(c => (
            <div key={c.label} style={{ background: C.white, borderRadius: '6px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderTop: `3px solid ${c.color}` }}>
              <p style={{ margin: '0 0 6px', fontSize: '12px', color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</p>
              <p style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: C.text }}>{c.value}</p>
              {c.sub && <p style={{ margin: '4px 0 0', fontSize: '11px', color: C.textLight }}>{c.sub}</p>}
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div style={{ background: C.white, borderRadius: '6px', padding: '12px 16px', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: C.textLight, fontSize: 13 }}>🔍</span>
            <input placeholder="Search by name or employee number..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ ...inp, width: '100%', paddingLeft: 28, boxSizing: 'border-box' }} />
          </div>
          <select value={branch} onChange={e => { setBranch(e.target.value); setPage(1); }} style={{ ...inp, minWidth: 160 }}>
            <option value="">All Branches</option>
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <button onClick={() => { setSearch(''); setBranch(''); setPage(1); }}
            style={{ padding: '7px 16px', borderRadius: '4px', border: `1px solid ${C.border}`, background: C.white, color: C.text, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Reset
          </button>
        </div>

        {/* Table */}
        <div style={{ background: C.white, borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: C.navy }}>
                {['Rank', 'Employee No', 'Employee Name', 'Branch', 'Links Sent', 'Completed', 'Completion Rate', 'Avg Rating', 'Performance'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: C.white, fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>Loading...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>No employees found.</td></tr>
              ) : paginated.map((emp, i) => {
                const globalRank = filtered.findIndex(e => e.employeeNumber === emp.employeeNumber) + 1;
                return (
                  <tr key={emp.employeeNumber} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : '#fafbfc' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.tealLight}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? C.white : '#fafbfc'}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: globalRank === 1 ? '#f59e0b' : globalRank === 2 ? '#9ca3af' : globalRank === 3 ? '#cd7f32' : C.textLight, fontSize: globalRank <= 3 ? 16 : 13 }}>
                      {globalRank === 1 ? '🥇' : globalRank === 2 ? '🥈' : globalRank === 3 ? '🥉' : `#${globalRank}`}
                    </td>
                    <td style={{ padding: '10px 14px', color: C.teal, fontWeight: 600 }}>{emp.employeeNumber}</td>
                    <td style={{ padding: '10px 14px', color: C.text, fontWeight: 500 }}>{emp.employeeName}</td>
                    <td style={{ padding: '10px 14px', color: C.textLight }}>{emp.branchName || '—'}</td>
                    <td style={{ padding: '10px 14px', color: C.text, textAlign: 'center' }}>{emp.totalSent}</td>
                    <td style={{ padding: '10px 14px', color: C.text, textAlign: 'center' }}>{emp.totalCompleted}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, background: '#e9ecef', borderRadius: 4, height: 6, minWidth: 60 }}>
                          <div style={{ width: `${emp.completionRate}%`, background: C.teal, height: '100%', borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: 12, color: C.textLight, whiteSpace: 'nowrap' }}>{emp.completionRate}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}><StarDisplay rating={emp.averageRating} /></td>
                    <td style={{ padding: '10px 14px' }}><PerfBadge rating={emp.averageRating} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: C.textLight }}>
            <span>Total {filtered.length} items</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '4px 10px', borderRadius: '4px', border: `1px solid ${C.border}`, background: page === 1 ? C.bg : C.white, cursor: page === 1 ? 'default' : 'pointer', color: C.text }}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  style={{ padding: '4px 10px', borderRadius: '4px', border: `1px solid ${page === p ? C.teal : C.border}`, background: page === p ? C.teal : C.white, color: page === p ? C.white : C.text, cursor: 'pointer', fontWeight: page === p ? 700 : 400 }}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: '4px 10px', borderRadius: '4px', border: `1px solid ${C.border}`, background: page === totalPages ? C.bg : C.white, cursor: page === totalPages ? 'default' : 'pointer', color: C.text }}>›</button>
              <span style={{ marginLeft: 8 }}>{ROWS} / page</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeePerformancePage;
