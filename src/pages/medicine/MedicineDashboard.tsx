import { Pill, ScanLine, Calendar, Clock, Check, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const todayMeds = [
  { name: 'Paracetamol', dosage: '500mg', time: '08:00', taken: true },
  { name: 'Amoxicillin', dosage: '250mg', time: '08:00', taken: true },
  { name: 'Amoxicillin', dosage: '250mg', time: '20:00', taken: false },
]

export default function MedicineDashboard() {
  const navigate = useNavigate()

  const takenCount = todayMeds.filter(m => m.taken).length
  const totalCount = todayMeds.length

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Medicine Dashboard</h1>
        <p className="page-subtitle">Manage your medications</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Pill size={18} /> Active Meds
          </div>
          <div className="stat-value">2</div>
          <div className="stat-change">In your list</div>
        </div>

        <div className="stat-card">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Check size={18} /> Taken Today
          </div>
          <div className="stat-value">{takenCount}/{totalCount}</div>
          <div className="stat-change positive">Doses completed</div>
        </div>

        <div className="stat-card">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} /> Pending
          </div>
          <div className="stat-value">{totalCount - takenCount}</div>
          <div className="stat-change">Doses left</div>
        </div>

        <div className="stat-card">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} /> Next Dose
          </div>
          <div className="stat-value">20:00</div>
          <div className="stat-change">In 4 hours</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Today's Schedule</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {todayMeds.map((med, i) => (
            <div 
              key={i}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '1rem',
                background: med.taken ? 'rgba(6, 182, 212, 0.1)' : 'var(--gray-50)',
                borderRadius: '0.5rem',
                borderLeft: `4px solid ${med.taken ? '#06b6d4' : '#f59e0b'}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: med.taken ? '#06b6d4' : '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Pill size={20} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{med.name}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {med.dosage}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} />
                <span>{med.time}</span>
                {med.taken && (
                  <span className="badge badge-success">Taken</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-3">
        <button className="btn btn-primary" style={{ padding: '1.5rem', justifyContent: 'flex-start' }} onClick={() => navigate('/medicine/scan')}>
          <ScanLine size={24} />
          <div style={{ textAlign: 'left' }}>
            <div>Scan Pills</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Identify medication</div>
          </div>
        </button>
        <button className="btn btn-secondary" style={{ padding: '1.5rem', justifyContent: 'flex-start' }} onClick={() => navigate('/medicine/table')}>
          <Pill size={24} />
          <div style={{ textAlign: 'left' }}>
            <div>My Meds</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>View table</div>
          </div>
        </button>
        <button className="btn btn-secondary" style={{ padding: '1.5rem', justifyContent: 'flex-start' }} onClick={() => navigate('/medicine/calendar')}>
          <Calendar size={24} />
          <div style={{ textAlign: 'left' }}>
            <div>Calendar</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>View schedule</div>
          </div>
        </button>
      </div>
    </div>
  )
}
