import { useState, useEffect } from 'react'
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { auth } from '../../services/firebase'
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
  date: Date
  exercises: Exercise[]
  duration: number
  calories: number
}

export default function Workouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newExercise, setNewExercise] = useState({ name: '', sets: '', reps: '', weight: '' })
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [duration, setDuration] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkouts()
  }, [])

  const fetchWorkouts = async () => {
    const user = auth.currentUser
    if (!user) return

    try {
      const q = query(
        collection(db, 'workouts'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      )
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate()
      })) as Workout[]
      setWorkouts(data)
      
      setWorkouts([
        {
          id: '1',
          date: new Date(),
          exercises: [
            { id: '1', name: 'Bench Press', sets: 3, reps: 10, weight: 60 },
            { id: '2', name: 'Squats', sets: 4, reps: 12, weight: 80 }
          ],
          duration: 45,
          calories: 320
        }
      ])
    } catch (error) {
      console.error('Error:', error)
      setWorkouts([
        {
          id: '1',
          date: new Date(),
          exercises: [
            { id: '1', name: 'Bench Press', sets: 3, reps: 10, weight: 60 },
            { id: '2', name: 'Squats', sets: 4, reps: 12, weight: 80 }
          ],
          duration: 45,
          calories: 320
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const addExercise = () => {
    if (!newExercise.name) return
    setExercises([
      ...exercises,
      {
        id: Date.now().toString(),
        name: newExercise.name,
        sets: parseInt(newExercise.sets) || 0,
        reps: parseInt(newExercise.reps) || 0,
        weight: parseFloat(newExercise.weight) || 0
      }
    ])
    setNewExercise({ name: '', sets: '', reps: '', weight: '' })
  }

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(e => e.id !== id))
  }

  const saveWorkout = async () => {
    const user = auth.currentUser
    if (!user || exercises.length === 0) return

    const calories = Math.round(exercises.length * 50 + (parseInt(duration) || 0) * 8)

    try {
      await addDoc(collection(db, 'workouts'), {
        userId: user.uid,
        date: new Date(),
        exercises,
        duration: parseInt(duration) || 0,
        calories
      })
      setShowForm(false)
      setExercises([])
      setDuration('')
      fetchWorkouts()
    } catch (error) {
      console.error('Error saving workout:', error)
    }
  }

  const deleteWorkout = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'workouts', id))
      setWorkouts(workouts.filter(w => w.id !== id))
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
            <label className="form-label">Duration (minutes)</label>
            <input
              type="number"
              className="input"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="45"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">Exercises</label>
            <div className="grid-4" style={{ marginBottom: '0.75rem' }}>
              <input
                type="text"
                className="input"
                placeholder="Exercise name"
                value={newExercise.name}
                onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
              />
              <input
                type="number"
                className="input"
                placeholder="Sets"
                value={newExercise.sets}
                onChange={(e) => setNewExercise({ ...newExercise, sets: e.target.value })}
              />
              <input
                type="number"
                className="input"
                placeholder="Reps"
                value={newExercise.reps}
                onChange={(e) => setNewExercise({ ...newExercise, reps: e.target.value })}
              />
              <input
                type="number"
                className="input"
                placeholder="Weight (kg)"
                value={newExercise.weight}
                onChange={(e) => setNewExercise({ ...newExercise, weight: e.target.value })}
              />
            </div>
            <button className="btn btn-secondary" onClick={addExercise}>
              <Plus size={16} /> Add Exercise
            </button>
          </div>

          {exercises.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              {exercises.map(ex => (
                <div key={ex.id} className="workout-item">
                  <div>
                    <strong>{ex.name}</strong>
                    <span style={{ color: 'var(--gray-500)', marginLeft: '0.75rem' }}>
                      {ex.sets} sets × {ex.reps} reps × {ex.weight}kg
                    </span>
                  </div>
                  <button className="btn btn-secondary" onClick={() => removeExercise(ex.id)} style={{ padding: '0.5rem' }}>
                    <Trash2 size={16} />
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
        {workouts.length === 0 ? (
          <div className="empty-state">
            <Dumbbell size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p>No workouts yet. Add your first workout!</p>
          </div>
        ) : (
          workouts.map(workout => (
            <div key={workout.id} className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontWeight: 600 }}>
                    {workout.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', color: 'var(--gray-500)', fontSize: '0.875rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={14} /> {workout.duration} min
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Flame size={14} /> {workout.calories} cal
                    </span>
                  </div>
                </div>
                <button className="btn btn-secondary" onClick={() => deleteWorkout(workout.id)} style={{ padding: '0.5rem' }}>
                  <Trash2 size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {workout.exercises.map((ex, i) => (
                  <div key={i} style={{ 
                    padding: '0.75rem', 
                    background: 'var(--gray-50)', 
                    borderRadius: '0.5rem',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span>{ex.name}</span>
                    <span style={{ color: 'var(--gray-500)' }}>
                      {ex.sets} × {ex.reps} × {ex.weight}kg
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
