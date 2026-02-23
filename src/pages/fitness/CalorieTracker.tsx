import { useState, useEffect } from 'react'
import { collection, addDoc, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { auth } from '../../services/firebase'
import { Flame, Target, TrendingUp, Plus, Minus } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface DailyLog {
  id: string
  date: Date
  caloriesIn: number
  caloriesOut: number
  protein: number
  carbs: number
  fat: number
  goal: number
}

const COLORS = ['#10b981', '#6366f1', '#f59e0b']

export default function CalorieTracker() {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [dailyGoal, setDailyGoal] = useState(2000)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    const user = auth.currentUser
    if (!user) return

    try {
      const q = query(
        collection(db, 'calorieLogs'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc'),
        limit(7)
      )
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate()
      })) as DailyLog[]
      setLogs(data)

      const todayData = data.find(l => l.date.toDateString() === new Date().toDateString())
      setTodayLog(todayData || null)
    } catch (error) {
      console.error('Error:', error)
      const mockData = [
        { id: '1', date: new Date(), caloriesIn: 1800, caloriesOut: 400, protein: 65, carbs: 180, fat: 55, goal: 2000 },
        { id: '2', date: new Date(Date.now() - 86400000), caloriesIn: 2100, caloriesOut: 350, protein: 80, carbs: 200, fat: 60, goal: 2000 },
        { id: '3', date: new Date(Date.now() - 172800000), caloriesIn: 1950, caloriesOut: 420, protein: 70, carbs: 190, fat: 52, goal: 2000 },
      ]
      setLogs(mockData)
      setTodayLog(mockData[0])
    } finally {
      setLoading(false)
    }
  }

  const addCalories = (amount: number) => {
    if (!todayLog) {
      const newLog: DailyLog = {
        id: Date.now().toString(),
        date: new Date(),
        caloriesIn: amount,
        caloriesOut: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        goal: dailyGoal
      }
      setTodayLog(newLog)
    } else {
      setTodayLog({ ...todayLog, caloriesIn: todayLog.caloriesIn + amount })
    }
  }

  const addExercise = (calories: number) => {
    if (!todayLog) {
      const newLog: DailyLog = {
        id: Date.now().toString(),
        date: new Date(),
        caloriesIn: 0,
        caloriesOut: calories,
        protein: 0,
        carbs: 0,
        fat: 0,
        goal: dailyGoal
      }
      setTodayLog(newLog)
    } else {
      setTodayLog({ ...todayLog, caloriesOut: todayLog.caloriesOut + calories })
    }
  }

  const chartData = logs.slice(0, 7).reverse().map(log => ({
    date: log.date.toLocaleDateString('en-US', { weekday: 'short' }),
    caloriesIn: log.caloriesIn,
    caloriesOut: log.caloriesOut,
    goal: log.goal
  }))

  const pieData = todayLog ? [
    { name: 'Protein', value: todayLog.protein || 65 },
    { name: 'Carbs', value: todayLog.carbs || 180 },
    { name: 'Fat', value: todayLog.fat || 55 }
  ] : []

  const remaining = todayLog ? dailyGoal - todayLog.caloriesIn + todayLog.caloriesOut : dailyGoal

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Calorie Tracker</h1>
          <p className="page-subtitle">Monitor your daily calorie balance</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowGoalModal(true)}>
          <Target size={18} /> Goal: {dailyGoal} cal
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Flame size={18} /> Calories In
          </div>
          <div className="stat-value">{todayLog?.caloriesIn || 0}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} /> Burned
          </div>
          <div className="stat-value">{todayLog?.caloriesOut || 0}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Net Calories</div>
          <div className="stat-value" style={{ color: remaining >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {todayLog ? todayLog.caloriesIn - todayLog.caloriesOut : 0}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Remaining</div>
          <div className="stat-value" style={{ color: remaining >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
            {remaining}
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Quick Add</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            <button className="btn btn-primary" onClick={() => addCalories(100)}>
              <Plus size={16} /> 100 cal
            </button>
            <button className="btn btn-primary" onClick={() => addCalories(250)}>
              <Plus size={16} /> 250 cal
            </button>
            <button className="btn btn-primary" onClick={() => addCalories(500)}>
              <Plus size={16} /> 500 cal
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => addExercise(100)}>
              <Minus size={16} /> Exercise 100
            </button>
            <button className="btn btn-secondary" onClick={() => addExercise(250)}>
              <Minus size={16} /> Exercise 250
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Macros</h3>
          {pieData.length > 0 ? (
            <div style={{ height: 150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}g`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
              No data yet
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Weekly Trend</h3>
        <div style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Line type="monotone" dataKey="caloriesIn" stroke="#10b981" strokeWidth={2} name="In" />
              <Line type="monotone" dataKey="caloriesOut" stroke="#ef4444" strokeWidth={2} name="Out" />
              <Line type="monotone" dataKey="goal" stroke="#6366f1" strokeWidth={1} strokeDasharray="5 5" name="Goal" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {showGoalModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowGoalModal(false)}>
          <div className="card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '1rem' }}>Set Daily Goal</h3>
            <div className="form-group">
              <label className="form-label">Calories</label>
              <input
                type="number"
                className="input"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(parseInt(e.target.value) || 2000)}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button className="btn btn-primary" onClick={() => setShowGoalModal(false)}>
                Save
              </button>
              <button className="btn btn-secondary" onClick={() => setShowGoalModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
