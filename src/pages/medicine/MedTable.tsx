import { useState, useEffect } from 'react'
import { Pill, Calendar, Clock, Trash2, Plus, Check } from 'lucide-react'
import { db } from '../../services/firebase'
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, where } from 'firebase/firestore'
import { auth } from '../../services/firebase'

interface Medication {
  id: string
  name?: string
  dosage?: string
  frequency?: 'daily' | 'twice_daily' | 'weekly' | 'as_needed'
  times?: string[]
  startDate?: string
  endDate?: string
  notes?: string
  addedToCalendar?: boolean
  // Scanned medication fields
  brandName?: string
  genericName?: string | string[]
  strength?: string
  dosageForm?: string
  manufacturer?: string
  uses?: string[]
  warnings?: string[]
  sideEffects?: string[]
  riskLevel?: string
  requiresPrescription?: boolean
  scannedAt?: Date
  imageUrl?: string
}

const frequencies = {
  daily: 'Once daily',
  twice_daily: 'Twice daily',
  weekly: 'Once a week',
  as_needed: 'As needed'
}

export default function MedTable() {
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    frequency: 'daily' as Medication['frequency'],
    times: ['08:00'],
    startDate: new Date().toISOString().split('T')[0],
    notes: ''
  })

  useEffect(() => {
    if (!db) {
      console.error('Firestore not initialized')
      setLoading(false)
      return
    }
    
    const userId = auth.currentUser?.uid || 'demo-user'
    const q = query(collection(db, 'medications'), where('userId', '==', userId))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const meds = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Medication[]
      setMedications(meds)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching medications:', error)
      alert(`Error fetching: ${error.message}`)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const addMedication = async () => {
    if (!newMed.name || !newMed.dosage) {
      alert('Please enter medication name and dosage')
      return
    }

    try {
      const userId = auth.currentUser?.uid || 'demo-user'
      const medData = {
        userId,
        ...newMed,
        addedToCalendar: false,
        createdAt: new Date().toISOString()
      }

      await addDoc(collection(db, 'medications'), medData)

      setNewMed({
        name: '',
        dosage: '',
        frequency: 'daily',
        times: ['08:00'],
        startDate: new Date().toISOString().split('T')[0],
        notes: ''
      })
      setShowForm(false)
      alert('Medication added successfully!')
    } catch (error: any) {
      console.error('Error adding medication:', error)
      alert(`Error: ${error.message}`)
    }
  }

  const deleteMedication = async (id: string) => {
    await deleteDoc(doc(db, 'medications', id))
  }

  const addToCalendar = (med: Medication) => {
    if (!med.times || med.times.length === 0) {
      alert('No times set for this medication')
      return
    }
    const calendarEvents = med.times.map(time => {
      return {
        title: `${med.name} - ${med.dosage}`,
        start: new Date(`${med.startDate}T${time}`),
        end: new Date(`${med.startDate}T${time}`),
        description: med.notes
      }
    })

    console.log('Adding to calendar:', calendarEvents)
    setMedications(medications.map(m =>
      m.id === med.id ? { ...m, addedToCalendar: true } : m
    ))
    alert(`Added ${med.name} to calendar!\n\nTimes: ${med.times.join(', ')}`)
  }

  const addTime = () => {
    setNewMed({ ...newMed, times: [...newMed.times, '12:00'] })
  }

  const removeTime = (index: number) => {
    setNewMed({ ...newMed, times: newMed.times.filter((_, i) => i !== index) })
  }

  const updateTime = (index: number, value: string) => {
    const updated = [...newMed.times]
    updated[index] = value
    setNewMed({ ...newMed, times: updated })
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">My Medications</h1>
          <p className="page-subtitle">Track and manage your medicines</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> Add Medication
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Add New Medication</h3>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Medication Name</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., Paracetamol"
                value={newMed.name}
                onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Dosage</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., 500mg"
                value={newMed.dosage}
                onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Frequency</label>
              <select
                className="input"
                value={newMed.frequency}
                onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value as Medication['frequency'] })}
              >
                <option value="daily">Once daily</option>
                <option value="twice_daily">Twice daily</option>
                <option value="weekly">Once a week</option>
                <option value="as_needed">As needed</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="input"
                value={newMed.startDate}
                onChange={(e) => setNewMed({ ...newMed, startDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Times</label>
            {newMed.times.map((time, index) => (
              <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="time"
                  className="input"
                  value={time}
                  onChange={(e) => updateTime(index, e.target.value)}
                  style={{ width: '150px' }}
                />
                {newMed.times.length > 1 && (
                  <button className="btn btn-secondary" onClick={() => removeTime(index)}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            {newMed.frequency !== 'as_needed' && (
              <button className="btn btn-secondary" onClick={addTime}>
                <Plus size={16} /> Add Time
              </button>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Take with food"
              value={newMed.notes}
              onChange={(e) => setNewMed({ ...newMed, notes: e.target.value })}
            />
          </div>

          <button className="btn btn-primary" onClick={addMedication}>
            Add Medication
          </button>
        </div>
      )}

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Medication</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Times</th>
                <th>Start Date</th>
                <th>Calendar</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {medications.map(med => {
                const isScanned = !!med.brandName
                return (
                <tr key={med.id}>
                  <td>
                    <strong>{med.name || med.brandName || 'Unknown'}</strong>
                    {med.genericName && med.genericName.length > 0 && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        {Array.isArray(med.genericName) ? med.genericName.join(', ') : med.genericName}
                      </p>
                    )}
                    {med.notes && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{med.notes}</p>}
                  </td>
                  <td>{med.dosage || med.strength || '-'}</td>
                  <td>
                    {isScanned ? (
                      <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                        Scanned
                      </span>
                    ) : (
                      <span className="badge badge-success">
                        {med.frequency ? (frequencies[med.frequency] || med.frequency) : 'N/A'}
                      </span>
                    )}
                  </td>
                  <td>
<<<<<<< HEAD
                    {isScanned ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>-</span>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {(med.times || []).map((time: string, i: number) => (
                          <span key={i} className="badge" style={{ background: 'var(--gray-100)', color: 'var(--text-secondary)' }}>
                            <Clock size={12} style={{ marginRight: '0.25rem' }} />
                            {time}
                          </span>
                        ))}
                      </div>
                    )}
=======
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {(med.times || []).map((time, i) => (
                        <span key={i} className="badge" style={{ background: 'var(--gray-100)', color: 'var(--text-secondary)' }}>
                          <Clock size={12} style={{ marginRight: '0.25rem' }} />
                          {time}
                        </span>
                      ))}
                    </div>
>>>>>>> dae3cce39336175a0382a3f0ef6db949571e4620
                  </td>
                  <td>{med.startDate ? (typeof med.startDate === 'object' ? new Date(med.startDate).toLocaleDateString() : med.startDate) : (med.scannedAt ? new Date(med.scannedAt).toLocaleDateString() : '-')}</td>
                  <td>
                    {med.addedToCalendar ? (
                      <span className="badge badge-success">
                        <Check size={12} style={{ marginRight: '0.25rem' }} />
                        Added
                      </span>
                    ) : (
                      <button
                        className="add-calendar-btn"
                        onClick={() => addToCalendar(med)}
                      >
                        <Calendar size={14} />
                        Add to Calendar
                      </button>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      onClick={() => deleteMedication(med.id)}
                      style={{ padding: '0.5rem' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Loading medications...</p>
          </div>
        ) : medications.length === 0 ? (
          <div className="empty-state">
            <Pill size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p>No medications added yet</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
