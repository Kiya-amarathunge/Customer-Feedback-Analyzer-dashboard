import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// ── Design tokens matching LOLC Digital ME ─────────────────────
const C = {
  navy:       '#0d1b2a',
  navyLight:  '#1a2a3a',
  teal:       '#17a2b8',
  tealDark:   '#138496',
  tealLight:  '#e8f7fa',
  white:      '#ffffff',
  bg:         '#f4f6f8',
  border:     '#e0e4e8',
  text:       '#2d3748',
  textLight:  '#6b7280',
  success:    '#17a2b8',
  warning:    '#fd7e14',
  danger:     '#dc3545',
  pending:    '#6c757d',
};

interface FeedbackLink {
  id: number;
  employeeNumber: string;
  employeeName: string;
  branchName: string;
  customerMobile: string;
  status: string;
  smsError: string;
  createdAt: string;
  sentAt: string;
  openedAt: string;
  completedAt: string;
}

interface Summary {
  totalSent: number;
  opened: number;
  completed: number;
  failed: number;
  pending: number;
  openRate: number;
  completionRate: number;
}

interface Employee {
  id: number;
  employeeNumber: string;
  fullName: string;
  branchName: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  PENDING:   { bg: '#e9ecef', color: '#495057',   label: 'Pending'   },
  SENT:      { bg: '#cff4fc', color: '#055160',   label: 'Sent'      },
  OPENED:    { bg: '#d1ecf1', color: '#0c5460',   label: 'Opened'    },
  COMPLETED: { bg: '#d4edda', color: '#155724',   label: 'Completed' },
  FAILED:    { bg: '#f8d7da', color: '#721c24',   label: 'Failed'    },
};

const Badge = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
};

const SendLinksPage: React.FC = () => {
  const [links, setLinks]         = useState<FeedbackLink[]>([]);
  const [summary, setSummary]     = useState<Summary | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const [statusFilter, setStatus] = useState('');
  const [empFilter, setEmpFilter] = useState('');
  const [search, setSearch]       = useState('');
  const [expanded, setExpanded]   = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS = 10;

  const [empNumber, setEmpNumber]   = useState('');
  const [custMobile, setCustMobile] = useState('');
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  const [showAddEmp, setShowAddEmp] = useState(false);
  const [newEmp, setNewEmp]         = useState({ employeeNumber: '', fullName: '', email: '', phone: '', branchName: '' });
  const [addEmpMsg, setAddEmpMsg]   = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (empFilter)    params.append('employeeNumber', empFilter);
      const [s, l, e] = await Promise.all([
        fetch(`${API_BASE}/api/admin/feedback-links/summary`).then(r => r.json()),
        fetch(`${API_BASE}/api/admin/feedback-links?${params}`).then(r => r.json()),
        fetch(`${API_BASE}/api/admin/employees`).then(r => r.json()),
      ]);
      setSummary(s); setLinks(l); setEmployees(e);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [statusFilter, empFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSend = async () => {
    if (!empNumber.trim() || !custMobile.trim()) { setSendResult({ success: false, message: 'Please fill in both fields.' }); return; }
    setSending(true); setSendResult(null);
    try {
      const res  = await fetch(`${API_BASE}/api/admin/send-link`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employeeNumber: empNumber, customerMobile: custMobile }) });
      const data = await res.json();
      setSendResult({ success: data.success, message: data.message });
      if (data.success) { setEmpNumber(''); setCustMobile(''); fetchAll(); }
    } catch { setSendResult({ success: false, message: 'Network error.' }); }
    finally { setSending(false); }
  };

  const handleAddEmployee = async () => {
    try {
      const res  = await fetch(`${API_BASE}/api/admin/employees`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newEmp) });
      const data = await res.json();
      if (data.success) { setAddEmpMsg('Employee added successfully.'); setNewEmp({ employeeNumber: '', fullName: '', email: '', phone: '', branchName: '' }); fetchAll(); }
      else setAddEmpMsg(data.message);
    } catch { setAddEmpMsg('Network error.'); }
  };

  const filtered = links.filter(l =>
    !search || l.customerMobile?.includes(search) ||
    l.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
    l.employeeNumber?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS));
  const paginated  = filtered.slice((currentPage - 1) * ROWS, currentPage * ROWS);

  const inp: React.CSSProperties = { width: '100%', padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: '4px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: C.text, background: C.white };
  const sel: React.CSSProperties = { ...inp, width: 'auto', minWidth: 140 };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "'Segoe UI', Arial, sans-serif" }}>

      <div style={{ padding: '20px 24px' }}>

        {/* Page title */}
        <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, color: C.text }}>Send Feedback Links</h2>

        {/* Summary Cards */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Total Sent',  value: summary.totalSent,  color: C.teal    },
              { label: 'Opened',      value: summary.opened,     color: '#6f42c1' },
              { label: 'Completed',   value: summary.completed,  color: '#28a745' },
              { label: 'Failed',      value: summary.failed,     color: '#dc3545' },
              { label: 'Pending',     value: summary.pending,    color: '#fd7e14' },
            ].map(c => (
              <div key={c.label} style={{ background: C.white, borderRadius: '6px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderTop: `3px solid ${c.color}` }}>
                <p style={{ margin: '0 0 6px', fontSize: '12px', color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</p>
                <p style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: C.text }}>{c.value}</p>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>

          {/* Send Link Form */}
          <div style={{ background: C.white, borderRadius: '6px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 700, color: C.text, borderBottom: `2px solid ${C.teal}`, paddingBottom: '8px' }}>
              Send Feedback Link via SMS
            </h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: C.textLight, marginBottom: '4px', textTransform: 'uppercase' }}>Employee Number *</label>
              <input value={empNumber} onChange={e => setEmpNumber(e.target.value)} placeholder="e.g. EMP001" style={inp} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: C.textLight, marginBottom: '4px', textTransform: 'uppercase' }}>Customer Mobile Number *</label>
              <input value={custMobile} onChange={e => setCustMobile(e.target.value)} placeholder="e.g. 0771234567" style={inp} />
            </div>
            {sendResult && (
              <div style={{ padding: '8px 12px', borderRadius: '4px', marginBottom: '12px', fontSize: '13px', background: sendResult.success ? '#d4edda' : '#f8d7da', color: sendResult.success ? '#155724' : '#721c24', border: `1px solid ${sendResult.success ? '#c3e6cb' : '#f5c6cb'}` }}>
                {sendResult.message}
              </div>
            )}
            <button onClick={handleSend} disabled={sending}
              style={{ padding: '8px 20px', borderRadius: '4px', border: 'none', background: sending ? '#6c757d' : C.teal, color: C.white, fontSize: '13px', fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {sending ? 'Sending...' : 'Send Link'}
            </button>
          </div>

          {/* Add Employee */}
          <div style={{ background: C.white, borderRadius: '6px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${C.teal}`, paddingBottom: '8px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: C.text }}>
                {showAddEmp ? 'Add New Employee' : `Employees (${employees.length})`}
              </h3>
              <button onClick={() => setShowAddEmp(!showAddEmp)}
                style={{ padding: '4px 12px', borderRadius: '4px', border: `1px solid ${C.teal}`, background: showAddEmp ? C.teal : C.white, color: showAddEmp ? C.white : C.teal, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                {showAddEmp ? '← Back to List' : '+ Add Employee'}
              </button>
            </div>

            {showAddEmp ? (
              <>
                {[
                  { field: 'employeeNumber', label: 'Employee Number *', placeholder: 'e.g. EMP001' },
                  { field: 'fullName',       label: 'Full Name *',       placeholder: 'Full name'   },
                  { field: 'email',          label: 'Email',             placeholder: 'Email'       },
                  { field: 'phone',          label: 'Phone',             placeholder: 'Phone'       },
                  { field: 'branchName',     label: 'Branch',            placeholder: 'Branch name' },
                ].map(f => (
                  <div key={f.field} style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: C.textLight, marginBottom: '3px', textTransform: 'uppercase' }}>{f.label}</label>
                    <input value={(newEmp as any)[f.field]} onChange={e => setNewEmp(p => ({ ...p, [f.field]: e.target.value }))} placeholder={f.placeholder} style={inp} />
                  </div>
                ))}
                {addEmpMsg && <p style={{ fontSize: '12px', color: addEmpMsg.includes('success') ? '#155724' : '#721c24', margin: '0 0 8px' }}>{addEmpMsg}</p>}
                <button onClick={handleAddEmployee} style={{ padding: '7px 18px', borderRadius: '4px', border: 'none', background: '#28a745', color: C.white, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Add Employee
                </button>
              </>
            ) : (
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {employees.length === 0 ? (
                  <p style={{ color: C.textLight, fontSize: '13px', margin: 0 }}>No employees added yet.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: C.bg }}>
                        {['Emp No', 'Name', 'Branch'].map(h => (
                          <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: C.textLight, textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map(e => (
                        <tr key={e.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: '6px 10px', color: C.teal, fontWeight: 600 }}>{e.employeeNumber}</td>
                          <td style={{ padding: '6px 10px', color: C.text }}>{e.fullName}</td>
                          <td style={{ padding: '6px 10px', color: C.textLight }}>{e.branchName || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{ background: C.white, borderRadius: '6px', padding: '12px 16px', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: C.textLight, fontSize: 13 }}>🔍</span>
            <input placeholder="Search by mobile, employee name..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              style={{ ...inp, paddingLeft: 28 }} />
          </div>
          <select value={statusFilter} onChange={e => { setStatus(e.target.value); setCurrentPage(1); }} style={sel}>
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="SENT">Sent</option>
            <option value="OPENED">Opened</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
          </select>
          <select value={empFilter} onChange={e => { setEmpFilter(e.target.value); setCurrentPage(1); }} style={sel}>
            <option value="">All Employees</option>
            {employees.map(e => <option key={e.id} value={e.employeeNumber}>{e.employeeNumber} — {e.fullName}</option>)}
          </select>
          <button onClick={fetchAll} style={{ padding: '7px 16px', borderRadius: '4px', border: 'none', background: C.teal, color: C.white, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Search</button>
          <button onClick={() => { setSearch(''); setStatus(''); setEmpFilter(''); setCurrentPage(1); }} style={{ padding: '7px 16px', borderRadius: '4px', border: `1px solid ${C.border}`, background: C.white, color: C.text, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Reset</button>
        </div>

        {/* Table */}
        <div style={{ background: C.white, borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: C.navy }}>
                {['Employee No', 'Employee Name', 'Branch', 'Customer Mobile', 'Sent At', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: C.white, fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>Loading...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>No records found.</td></tr>
              ) : paginated.map((l, i) => (
                <React.Fragment key={l.id}>
                  <tr style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : '#fafbfc' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.tealLight}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? C.white : '#fafbfc'}>
                    <td style={{ padding: '10px 14px', color: C.teal, fontWeight: 600 }}>{l.employeeNumber}</td>
                    <td style={{ padding: '10px 14px', color: C.text, fontWeight: 500 }}>{l.employeeName}</td>
                    <td style={{ padding: '10px 14px', color: C.textLight }}>{l.branchName || '—'}</td>
                    <td style={{ padding: '10px 14px', color: C.text }}>{l.customerMobile}</td>
                    <td style={{ padding: '10px 14px', color: C.textLight }}>{l.sentAt || l.createdAt || '—'}</td>
                    <td style={{ padding: '10px 14px' }}><Badge status={l.status} /></td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => setExpanded(expanded === l.id ? null : l.id)}
                        style={{ padding: '4px 12px', borderRadius: '4px', border: 'none', background: C.teal, color: C.white, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {expanded === l.id ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                  {expanded === l.id && (
                    <tr>
                      <td colSpan={7} style={{ background: '#f0f9fb', padding: '14px 24px', borderBottom: `1px solid ${C.border}` }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          {[
                            { label: 'Created',   value: l.createdAt   },
                            { label: 'Sent',      value: l.sentAt      },
                            { label: 'Opened',    value: l.openedAt    },
                            { label: 'Completed', value: l.completedAt },
                          ].map(item => (
                            <div key={item.label}>
                              <p style={{ margin: '0 0 2px', fontSize: '11px', color: C.textLight, textTransform: 'uppercase', fontWeight: 600 }}>{item.label}</p>
                              <p style={{ margin: 0, fontSize: '13px', color: C.text }}>{item.value || '—'}</p>
                            </div>
                          ))}
                        </div>
                        {l.smsError && <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#721c24', background: '#f8d7da', padding: '6px 10px', borderRadius: '4px', display: 'inline-block' }}>⚠ SMS Error: {l.smsError}</p>}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: C.textLight }}>
            <span>Total {filtered.length} items</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                style={{ padding: '4px 10px', borderRadius: '4px', border: `1px solid ${C.border}`, background: currentPage === 1 ? C.bg : C.white, cursor: currentPage === 1 ? 'default' : 'pointer', color: C.text }}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setCurrentPage(p)}
                  style={{ padding: '4px 10px', borderRadius: '4px', border: `1px solid ${currentPage === p ? C.teal : C.border}`, background: currentPage === p ? C.teal : C.white, color: currentPage === p ? C.white : C.text, cursor: 'pointer', fontWeight: currentPage === p ? 700 : 400 }}>{p}</button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                style={{ padding: '4px 10px', borderRadius: '4px', border: `1px solid ${C.border}`, background: currentPage === totalPages ? C.bg : C.white, cursor: currentPage === totalPages ? 'default' : 'pointer', color: C.text }}>›</button>
              <span style={{ marginLeft: 8 }}>{ROWS} / page</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendLinksPage;
