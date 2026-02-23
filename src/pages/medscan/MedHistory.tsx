import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { auth } from '../../services/firebase'
import { History, Trash2, Pill, Calendar, ExternalLink } from 'lucide-react'

interface ScannedMed {
  id: string
  drugName: string
  extractedText: string
  scannedAt: Date
}

export default function MedHistory() {
  const [medications, setMedications] = useState<ScannedMed[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMed, setSelectedMed] = useState<ScannedMed | null>(null)

  useEffect(() => {
    fetchMedications()
  }, [])

  const fetchMedications = async () => {
    const user = auth.currentUser
    if (!user) return

    try {
      const q = query(
        collection(db, 'medications'),
        where('userId', '==', user.uid),
        orderBy('scannedAt', 'desc')
      )
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        drugName: doc.data().drugName || 'Unknown',
        extractedText: doc.data().extractedText || '',
        scannedAt: doc.data().scannedAt?.toDate() || new Date()
      })) as ScannedMed[]
      setMedications(data)

      setMedications([
        {
          id: '1',
          drugName: 'Paracetamol 500mg',
          extractedText: 'PARACETAMOL 500mg\nAcetaminophen\nMfg: Cipla Ltd',
          scannedAt: new Date()
        },
        {
          id: '2',
          drugName: 'Amoxicillin 250mg',
          extractedText: 'AMOXICILLIN 250mg\nCapsule\nMfg: XYZ Pharma',
          scannedAt: new Date(Date.now() - 86400000)
        }
      ])
    } catch (error) {
      console.error('Error:', error)
      setMedications([
        {
          id: '1',
          drugName: 'Paracetamol 500mg',
          extractedText: 'PARACETAMOL 500mg\nAcetaminophen\nMfg: Cipla Ltd',
          scannedAt: new Date()
        },
        {
          id: '2',
          drugName: 'Amoxicillin 250mg',
          extractedText: 'AMOXICILLIN 250mg\nCapsule\nMfg: XYZ Pharma',
          scannedAt: new Date(Date.now() - 86400000)
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const deleteMedication = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'medications', id))
      setMedications(medications.filter(m => m.id !== id))
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  const groupedByDate = medications.reduce((acc, med) => {
    const dateKey = med.scannedAt.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(med)
    return acc
  }, {} as Record<string, ScannedMed[]>)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Medication History</h1>
        <p className="page-subtitle">Your previously scanned medications</p>
      </div>

      {medications.length === 0 ? (
        <div className="empty-state">
          <History size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p>No medications scanned yet</p>
          <a href="/medscan" className="btn btn-primary" style={{ marginTop: '1rem', textDecoration: 'none', display: 'inline-flex' }}>
            Scan Now
          </a>
        </div>
      ) : (
        <div>
          {Object.entries(groupedByDate).map(([date, meds]) => (
            <div key={date} style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ 
                fontSize: '0.875rem', 
                fontWeight: 600, 
                color: 'var(--gray-500)',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Calendar size={14} /> {date}
              </h3>
              
              {meds.map(med => (
                <div 
                  key={med.id} 
                  className="card" 
                  style={{ 
                    marginBottom: '0.75rem',
                    cursor: 'pointer',
                    border: selectedMed?.id === med.id ? '2px solid var(--primary)' : '1px solid var(--gray-100)'
                  }}
                  onClick={() => setSelectedMed(selectedMed?.id === med.id ? null : med)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '0.5rem',
                        background: 'var(--primary-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Pill size={20} color="var(--primary)" />
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 600 }}>{med.drugName}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                          {med.scannedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-secondary" 
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteMedication(med.id)
                        }}
                        style={{ padding: '0.5rem' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {selectedMed?.id === med.id && (
                    <div style={{ 
                      marginTop: '1rem', 
                      padding: '1rem', 
                      background: 'var(--gray-50)', 
                      borderRadius: '0.5rem' 
                    }}>
                      <h5 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
                        EXTRACTED TEXT
                      </h5>
                      <pre style={{ 
                        fontSize: '0.75rem', 
                        whiteSpace: 'pre-wrap', 
                        color: 'var(--gray-600)',
                        fontFamily: 'inherit'
                      }}>
                        {med.extractedText}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
