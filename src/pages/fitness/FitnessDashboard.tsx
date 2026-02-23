import { Dumbbell, UtensilsCrossed, Flame, TrendingUp, Target, ScanLine } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'

const weeklyData = [
  { day: 'Mon', calories: 1800 },
  { day: 'Tue', calories: 2100 },
  { day: 'Wed', calories: 1950 },
  { day: 'Thu', calories: 2200 },
  { day: 'Fri', calories: 1850 },
  { day: 'Sat', calories: 2400 },
  { day: 'Sun', calories: 1650 }
]

export default function FitnessDashboard() {
  const navigate = useNavigate()

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Fitness Dashboard</h1>
        <p className="page-subtitle">Track your workouts and nutrition</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Dumbbell size={18} /> Workouts
          </div>
          <div className="stat-value">3</div>
          <div className="stat-change positive">This week</div>
        </div>

        <div className="stat-card">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Flame size={18} /> Calories
          </div>
          <div className="stat-value">1650</div>
          <div className="stat-change">Today</div>
        </div>

        <div className="stat-card">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UtensilsCrossed size={18} /> Meals
          </div>
          <div className="stat-value">2</div>
          <div className="stat-change">Logged</div>
        </div>

        <div className="stat-card">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={18} /> Goal
          </div>
          <div className="stat-value">2000</div>
          <div className="stat-change">Daily cal</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Weekly Calorie Trend</h3>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData}>
              <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="calories" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-3">
        <button className="btn btn-primary" style={{ padding: '1.5rem', justifyContent: 'flex-start' }} onClick={() => navigate('/fitness/workouts')}>
          <Dumbbell size={24} />
          <div style={{ textAlign: 'left' }}>
            <div>Log Workout</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Track exercises</div>
          </div>
        </button>
        <button className="btn btn-secondary" style={{ padding: '1.5rem', justifyContent: 'flex-start' }} onClick={() => navigate('/fitness/meals')}>
          <UtensilsCrossed size={24} />
          <div style={{ textAlign: 'left' }}>
            <div>Add Meal</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Log nutrition</div>
          </div>
        </button>
        <button className="btn btn-secondary" style={{ padding: '1.5rem', justifyContent: 'flex-start' }} onClick={() => navigate('/fitness/calories')}>
          <Flame size={24} />
          <div style={{ textAlign: 'left' }}>
            <div>Calories</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Track intake</div>
          </div>
        </button>
      </div>
    </div>
  )
}
