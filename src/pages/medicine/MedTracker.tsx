import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, updateDoc, addDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { auth } from '../../services/firebase'
import { Pill, Clock, Check, X, TrendingUp, Activity } from 'lucide-react'

interface Medication {
  id: string
  name: string
  dosage: string
  times: string[]
  frequency: string
}

interface MedicationLog {
  id: string
  medId: string
  medName: string
  dosage: string
  scheduledTime: string
  taken: boolean
  date: string
  takenAt?: Date
}

export default function MedTracker() {
  const [medications, setMedications] = useState<Medication[]>([])
  const [logs, setLogs] = useState<MedicationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [todayStats, setTodayStats] = useState({ taken: 0, total: 0, streak: 0 })

  const fetchMedications = () => {
    try {
      const userId = auth.currentUser?.uid || 'demo-user'
      const q = query(collection(db, 'medications'), where('userId', '==', userId))
      
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const meds = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Medication[]
          setMedications(meds)
          setLoading(false)
        },
        (error) => {
          console.error('MedTracker snapshot error:', error)
          setLoading(false)
        }
      )

      return () => unsubscribe()
    } catch (error) {
      console.error('Error fetching medications:', error)
      setLoading(false)
    }
  }

  const generateTodayLogs = () => {
    const userId = auth.currentUser?.uid || 'demo-user'
    const dateStr = selectedDate

    try {
      const logsQuery = query(
        collection(db, 'medication_logs'),
        where('userId', '==', userId),
        where('date', '==', dateStr)
      )
      
      const unsubscribe = onSnapshot(logsQuery, 
        (snapshot) => {
          const existingLogs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            takenAt: doc.data().takenAt?.toDate()
          })) as MedicationLog[]
          
          const newLogs: MedicationLog[] = []
          
          medications.forEach(med => {
            med.times.forEach(time => {
              const existing = existingLogs.find(l => l.medId === med.id && l.scheduledTime === time)
              if (existing) {
                newLogs.push(existing)
              } else {
                newLogs.push({
                  id: `${med.id}-${time}`,
                  medId: med.id,
                  medName: med.name,
                  dosage: med.dosage,
                  scheduledTime: time,
                  taken: false,
                  date: dateStr
                })
              }
            })
          })
          
          setLogs(newLogs.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)))
          updateStats(newLogs)
        },
        (error) => {
          console.error('generateTodayLogs snapshot error:', error)
        }
      )

      return () => unsubscribe()
    } catch (error) {
      console.error('Error generating logs:', error)
    }
  }

  useEffect(() => {
    const cleanup = fetchMedications()
    return () => { 
      if (cleanup && typeof cleanup === 'function') cleanup() 
    }
  }, [auth])

  useEffect(() => {
    let cleanup: (() => void) | undefined
    if (medications.length > 0) {
      cleanup = generateTodayLogs()
    }
    return () => { 
      if (cleanup) cleanup() 
    }
  }, [medications, selectedDate, auth])

  const updateStats = (currentLogs: MedicationLog[]) => {
    const taken = currentLogs.filter(l => l.taken).length
    const total = currentLogs.length
    setTodayStats({ taken, total, streak: Math.floor(taken / Math.max(total, 1) * 7) })
  }

  const toggleTaken = async (log: MedicationLog) => {
    const userId = auth.currentUser?.uid || 'demo-user'
    
    try {
      const logsQuery = query(
        collection(db, 'medication_logs'),
        where('userId', '==', userId),
        where('medId', '==', log.medId),
        where('scheduledTime', '==', log.scheduledTime),
        where('date', '==', log.date)
      )
      
      const snapshot = await getDocs(logsQuery)
      
      if (!snapshot.empty) {
        const docRef = doc(db, 'medication_logs', snapshot.docs[0].id)
        await updateDoc(docRef, {
          taken: !log.taken,
          takenAt: !log.taken ? new Date() : null
        })
      } else {
        await addDoc(collection(db, 'medication_logs'), {
          userId,
          medId: log.medId,
          medName: log.medName,
          dosage: log.dosage,
          scheduledTime: log.scheduledTime,
          taken: true,
          date: log.date,
          takenAt: new Date()
        })
      }
    } catch (error) {
      console.error('Error toggling medication:', error)
    }
  }

  const takenCount = logs.filter(l => l.taken).length
  const totalCount = logs.length
  const progress = totalCount > 0 ? (takenCount / totalCount) * 100 : 0

  if (loading) {
    return <div className="page-header"><p>Loading...</p></div>
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Medication Tracker</h1>
        <p className="page-subtitle">Track your daily medication intake</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} /> Today's Progress
          </div>
          <div className="stat-value">{takenCount}/{totalCount}</div>
          <div className="stat-change">{Math.round(progress)}% completed</div>
        </div>

        <div className="stat-card">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Check size={18} /> Taken
          </div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{takenCount}</div>
          <div className="stat-change positive">doses today</div>
        </div>

        <div className="stat-card">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <X size={18} /> Remaining
          </div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{totalCount - takenCount}</div>
          <div className="stat-change">doses left</div>
        </div>

        <div className="stat-card">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} /> Streak
          </div>
          <div className="stat-value">{todayStats.streak}</div>
          <div className="stat-change">days</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Today's Schedule</h3>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input"
            style={{ width: 'auto' }}
          />
        </div>

        <div style={{ 
          height: '8px', 
          background: 'var(--gray-200)', 
          borderRadius: '4px', 
          marginBottom: '1.5rem',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: progress === 100 ? 'var(--success)' : 'var(--primary)',
            borderRadius: '4px',
            transition: 'width 0.3s ease'
          }} />
        </div>

        {logs.length === 0 ? (
          <div className="empty-state">
            <Pill size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p>No medications scheduled</p>
            <a href="/medicine/table" className="btn btn-primary" style={{ marginTop: '1rem', textDecoration: 'none', display: 'inline-flex' }}>
              Add Medications
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {logs.map((log) => (
              <div 
                key={log.id}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '1rem',
                  background: log.taken ? 'rgba(16, 185, 129, 0.1)' : 'var(--gray-50)',
                  borderRadius: '0.5rem',
                  borderLeft: `4px solid ${log.taken ? 'var(--success)' : 'var(--warning)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => toggleTaken(log)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: log.taken ? 'var(--success)' : 'var(--gray-200)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}>
                    {log.taken ? (
                      <Check size={22} color="white" />
                    ) : (
                      <Clock size={20} color="var(--gray-500)" />
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{log.medName}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {log.dosage}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)' }}>
                      <Clock size={14} />
                      <span style={{ fontSize: '0.875rem' }}>{log.scheduledTime}</span>
                    </div>
                    {log.takenAt && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>
                        Taken at {log.takenAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                  {log.taken ? (
                    <span className="badge badge-success">
                      <Check size={12} style={{ marginRight: '0.25rem' }} />
                      Taken
                    </span>
                  ) : (
                    <span className="badge" style={{ background: 'var(--warning)', color: '#1a1a1a' }}>
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
