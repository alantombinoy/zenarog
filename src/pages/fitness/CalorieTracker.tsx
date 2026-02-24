import { useState, useEffect, useCallback } from 'react'
import { collection, addDoc, query, where, doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../../services/firebase'
import { Flame, TrendingUp, Plus, Minus } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface DailyLog {
  id: string
  userId: string
  caloriesIn: number
  caloriesOut: number
  goal: number
  date: any
}

function getUserId(): string {
  return auth.currentUser?.uid || 'demo-user'
}

export default function CalorieTracker() {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null)
  const [dailyGoal, setDailyGoal] = useState(2000)
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

    const q = query(collection(db, 'calorieLogs'), where('userId', '==', userId))
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map(d => {
          const docData = d.data()
          return {
            id: d.id,
            userId: docData.userId,
            caloriesIn: docData.caloriesIn || 0,
            caloriesOut: docData.caloriesOut || 0,
            goal: docData.goal || 2000,
            date: docData.date
          } as DailyLog
        }).sort((a, b) => {
          const dateA = a.date?.toDate?.()?.getTime() || 0
          const dateB = b.date?.toDate?.()?.getTime() || 0
          return dateB - dateA
        }).slice(0, 7)
        setLogs(data)
        
        const today = data.find(l => {
          const logDate = l.date?.toDate?.()
          return logDate?.toDateString() === new Date().toDateString()
        })
        setTodayLog(today || null)
        
        if (today?.goal) {
          setDailyGoal(today.goal)
        }
        
        setLoading(false)
      },
      (error) => {
        console.error('CalorieTracker snapshot error:', error)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [userId])

  const saveLog = useCallback(async (updates: Partial<DailyLog>) => {
    if (!auth.currentUser) {
      alert('Please log in to track calories')
      return
    }
    
    const currentUserId = auth.currentUser.uid
    
    if (todayLog?.id) {
      await updateDoc(doc(db, 'calorieLogs', todayLog.id), updates)
    } else {
      const newDoc = await addDoc(collection(db, 'calorieLogs'), { 
        userId: currentUserId, 
        date: serverTimestamp(), 
        caloriesIn: 0, 
        caloriesOut: 0, 
        goal: dailyGoal, 
        ...updates 
      })
      setTodayLog({ 
        id: newDoc.id, 
        userId: currentUserId,
        caloriesIn: 0, 
        caloriesOut: 0, 
        goal: dailyGoal, 
        ...updates,
        date: new Date()
      } as DailyLog)
    }
  }, [todayLog, dailyGoal])

  const addCalories = async (amount: number) => {
    const val = (todayLog?.caloriesIn || 0) + amount
    setTodayLog(prev => prev ? { ...prev, caloriesIn: val } : { 
      id: '', 
      userId, 
      caloriesIn: val, 
      caloriesOut: 0, 
      goal: dailyGoal,
      date: new Date()
    })
    await saveLog({ caloriesIn: val })
  }

  const addExercise = async (amount: number) => {
    const val = (todayLog?.caloriesOut || 0) + amount
    setTodayLog(prev => prev ? { ...prev, caloriesOut: val } : { 
      id: '', 
      userId, 
      caloriesIn: 0, 
      caloriesOut: val, 
      goal: dailyGoal,
      date: new Date()
    })
    await saveLog({ caloriesOut: val })
  }

  const updateGoal = async () => {
    await saveLog({ goal: dailyGoal })
  }

  const chartData = logs.slice(0, 7).reverse().map(l => ({ 
    date: l.date?.toDate?.()?.toLocaleDateString('en-US', { weekday: 'short' }) || '', 
    caloriesIn: l.caloriesIn || 0, 
    caloriesOut: l.caloriesOut || 0 
  }))

  const remaining = dailyGoal - (todayLog?.caloriesIn || 0) + (todayLog?.caloriesOut || 0)

  if (loading) {
    return (
      <div className="empty-state">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Calorie Tracker</h1>
        <p className="page-subtitle">Monitor your daily calories</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label"><Flame size={18}/> In</div>
          <div className="stat-value">{todayLog?.caloriesIn || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><TrendingUp size={18}/> Burned</div>
          <div className="stat-value">{todayLog?.caloriesOut || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Net</div>
          <div className="stat-value">{(todayLog?.caloriesIn || 0) - (todayLog?.caloriesOut || 0)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Remaining</div>
          <div className="stat-value">{remaining}</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: '1.5rem' }}>
        <div className="card">
          <h3>Quick Add</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => addCalories(100)}>
              <Plus size={16}/> 100
            </button>
            <button className="btn btn-primary" onClick={() => addCalories(250)}>
              <Plus size={16}/> 250
            </button>
            <button className="btn btn-primary" onClick={() => addCalories(500)}>
              <Plus size={16}/> 500
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => addExercise(100)}>
              <Minus size={16}/> -100
            </button>
            <button className="btn btn-secondary" onClick={() => addExercise(250)}>
              <Minus size={16}/> -250
            </button>
          </div>
        </div>
        <div className="card">
          <h3>Set Goal</h3>
          <input 
            type="number" 
            className="input" 
            value={dailyGoal} 
            onChange={e => setDailyGoal(parseInt(e.target.value) || 2000)} 
          />
          <button className="btn btn-primary" style={{ marginTop: '0.5rem' }} onClick={updateGoal}>
            Save Goal
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3>Weekly Trend</h3>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12}/>
              <YAxis stroke="#9ca3af" fontSize={12}/>
              <Tooltip/>
              <Line type="monotone" dataKey="caloriesIn" stroke="#10b981" strokeWidth={2}/>
              <Line type="monotone" dataKey="caloriesOut" stroke="#ef4444" strokeWidth={2}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
