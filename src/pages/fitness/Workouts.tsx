import { useState, useEffect, useCallback } from 'react'
import { collection, addDoc, query, where, deleteDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../../services/firebase'
import { Plus, Trash2, Dumbbell, Clock, Flame } from 'lucide-react'

interface Exercise {
  id: string
  name: string
  sets: number
  reps: number
  weight: number
}

interface Workout {
  id: string
  userId: string
  exercises: Exercise[]
  duration: number
  calories: number
  createdAt: any
}

function getUserId(): string {
  return auth.currentUser?.uid || 'demo-user'
}

export default function Workouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newExercise, setNewExercise] = useState({ name: '', sets: '', reps: '', weight: '' })
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [duration, setDuration] = useState('')
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>(getUserId())

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserId(user?.uid || 'demo-user')
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!db) {
      setLoading(false)
      return
    }

    const q = query(collection(db, 'workouts'), where('userId', '==', userId))
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map(d => {
          const docData = d.data()
          return {
            id: d.id,
            userId: docData.userId,
            exercises: docData.exercises || [],
            duration: docData.duration || 0,
            calories: docData.calories || 0,
            createdAt: docData.createdAt
          } as Workout
        }).sort((a, b) => {
          const dateA = a.createdAt?.toDate?.()?.getTime() || 0
          const dateB = b.createdAt?.toDate?.()?.getTime() || 0
          return dateB - dateA
        })
        setWorkouts(data)
        setLoading(false)
      },
      (error) => {
        console.error('Workouts snapshot error:', error)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [userId])

  const addExercise = () => {
    if (!newExercise.name) return
    setExercises([...exercises, { 
      id: Date.now().toString(), 
      name: newExercise.name, 
      sets: parseInt(newExercise.sets) || 0, 
      reps: parseInt(newExercise.reps) || 0, 
      weight: parseFloat(newExercise.weight) || 0 
    }])
    setNewExercise({ name: '', sets: '', reps: '', weight: '' })
  }

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(e => e.id !== id))
  }

  const saveWorkout = useCallback(async () => {
    if (exercises.length === 0) {
      alert('Add at least one exercise')
      return
    }
    if (!auth.currentUser) {
      alert('Please log in to save workouts')
      return
    }
    
    const currentUserId = auth.currentUser.uid
    const calories = Math.round(exercises.length * 50 + (parseInt(duration) || 0) * 8)
    try {
      await addDoc(collection(db, 'workouts'), { 
        userId: currentUserId, 
        exercises, 
        duration: parseInt(duration) || 0, 
        calories, 
        createdAt: serverTimestamp() 
      })
      setShowForm(false)
      setExercises([])
      setDuration('')
    } catch (error) {
      console.error('Error saving workout:', error)
      alert('Failed to save workout')
    }
  }, [exercises, duration])

  const deleteWorkout = async (id: string) => { 
    try {
      await deleteDoc(doc(db, 'workouts', id))
    } catch (error) {
      console.error('Error deleting workout:', error)
    }
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Workouts</h1>
          <p className="page-subtitle">Track your exercise sessions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> Add Workout
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>New Workout</h3>
          <div className="form-group">
            <label className="form-label">Duration (min)</label>
            <input 
              type="number" 
              className="input" 
              value={duration} 
              onChange={e => setDuration(e.target.value)} 
              placeholder="45" 
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">Exercises</label>
            <div className="grid-4" style={{ marginBottom: '0.75rem' }}>
              <input type="text" className="input" placeholder="Name" value={newExercise.name} onChange={e => setNewExercise({...newExercise, name: e.target.value})} />
              <input type="number" className="input" placeholder="Sets" value={newExercise.sets} onChange={e => setNewExercise({...newExercise, sets: e.target.value})} />
              <input type="number" className="input" placeholder="Reps" value={newExercise.reps} onChange={e => setNewExercise({...newExercise, reps: e.target.value})} />
              <input type="number" className="input" placeholder="Weight(kg)" value={newExercise.weight} onChange={e => setNewExercise({...newExercise, weight: e.target.value})} />
            </div>
            <button className="btn btn-secondary" onClick={addExercise}>
              <Plus size={16} /> Add
            </button>
          </div>
          {exercises.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              {exercises.map(ex => (
                <div key={ex.id} className="workout-item">
                  <span><strong>{ex.name}</strong> {ex.sets}x{ex.reps}x{ex.weight}kg</span>
                  <button className="btn btn-secondary" onClick={() => removeExercise(ex.id)}>
                    <Trash2 size={16}/>
                  </button>
                </div>
              ))}
            </div>
          )}
          <button className="btn btn-primary" onClick={saveWorkout} disabled={exercises.length === 0}>
            Save Workout
          </button>
        </div>
      )}

      <div>
        {loading ? (
          <div className="empty-state">
            <p>Loading...</p>
          </div>
        ) : workouts.length === 0 ? (
          <div className="empty-state">
            <Dumbbell size={48} style={{opacity: 0.3}}/>
            <p>No workouts yet</p>
          </div>
        ) : (
          workouts.map(w => (
            <div key={w.id} className="card" style={{marginBottom: '1rem'}}>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <div>
                  <h3>{w.createdAt?.toDate ? w.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString()}</h3>
                  <span>
                    <Clock size={14}/> {w.duration} min | <Flame size={14}/> {w.calories} cal
                  </span>
                </div>
                <button className="btn btn-secondary" onClick={() => deleteWorkout(w.id)}>
                  <Trash2 size={16}/>
                </button>
              </div>
              {w.exercises && w.exercises.length > 0 && (
                <div style={{ marginTop: '0.75rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {w.exercises.map(e => e.name).join(', ')}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
