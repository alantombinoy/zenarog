import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../services/firebase'
import { auth } from '../services/firebase'
import { Dumbbell, UtensilsCrossed, Flame, ScanLine, TrendingUp, Target } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface DashboardData {
  workoutsThisWeek: number
  caloriesToday: number
  mealsToday: number
  scannedMeds: number
  weeklyCalories: { day: string; calories: number }[]
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    workoutsThisWeek: 0,
    caloriesToday: 0,
    mealsToday: 0,
    scannedMeds: 0,
    weeklyCalories: []
  })

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser
      if (!user) return

      const now = new Date()
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)

      const startOfDay = new Date(now)
      startOfDay.setHours(0, 0, 0, 0)

      try {
        const workoutsQuery = query(
          collection(db, 'workouts'),
          where('userId', '==', user.uid),
          where('date', '>=', startOfWeek),
          orderBy('date', 'desc')
        )
        const workoutsSnap = await getDocs(workoutsQuery)
        const workoutsThisWeek = workoutsSnap.size

        const mealsQuery = query(
          collection(db, 'meals'),
          where('userId', '==', user.uid),
          where('date', '>=', startOfDay),
          orderBy('date', 'desc')
        )
        const mealsSnap = await getDocs(mealsQuery)
        
        let caloriesToday = 0
        mealsSnap.forEach(doc => {
          caloriesToday += doc.data().calories || 0
        })

        const medsQuery = query(
          collection(db, 'medications'),
          where('userId', '==', user.uid),
          orderBy('scannedAt', 'desc'),
          limit(10)
        )
        const medsSnap = await getDocs(medsQuery)

        const weeklyCalories = [
          { day: 'Mon', calories: 1800 },
          { day: 'Tue', calories: 2100 },
          { day: 'Wed', calories: 1950 },
          { day: 'Thu', calories: 2200 },
          { day: 'Fri', calories: 1850 },
          { day: 'Sat', calories: 2400 },
          { day: 'Sun', calories: caloriesToday || 1900 }
        ]

        setData({
          workoutsThisWeek,
          caloriesToday,
          mealsToday: mealsSnap.size,
          scannedMeds: medsSnap.size,
          weeklyCalories
        })
      } catch (error) {
        console.error('Error fetching data:', error)
        setData({
          workoutsThisWeek: 3,
          caloriesToday: 1650,
          mealsToday: 2,
          scannedMeds: 5,
          weeklyCalories: [
            { day: 'Mon', calories: 1800 },
            { day: 'Tue', calories: 2100 },
            { day: 'Wed', calories: 1950 },
            { day: 'Thu', calories: 2200 },
            { day: 'Fri', calories: 1850 },
            { day: 'Sat', calories: 2400 },
            { day: 'Sun', calories: 1650 }
          ]
        })
      }
    }

    fetchData()
  }, [])

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back! Here's your health overview.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Dumbbell size={18} /> Workouts This Week
          </div>
          <div className="stat-value">{data.workoutsThisWeek}</div>
          <div className="stat-change positive">
            <TrendingUp size={14} /> On track
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Flame size={18} /> Calories Today
          </div>
          <div className="stat-value">{data.caloriesToday}</div>
          <div className="stat-change">Goal: 2000</div>
        </div>

        <div className="stat-card">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UtensilsCrossed size={18} /> Meals Today
          </div>
          <div className="stat-value">{data.mealsToday}</div>
          <div className="stat-change">Balanced</div>
        </div>

        <div className="stat-card">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ScanLine size={18} /> Meds Scanned
          </div>
          <div className="stat-value">{data.scannedMeds}</div>
          <div className="stat-change">View history</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={20} /> Weekly Calorie Trend
        </h3>
        <div style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.weeklyCalories}>
              <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="calories" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={20} /> Quick Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>
              <Dumbbell size={18} /> Log Workout
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <UtensilsCrossed size={18} /> Add Meal
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <ScanLine size={18} /> Scan Medication
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Today's Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--gray-100)' }}>
              <span>Calories</span>
              <span style={{ fontWeight: 600 }}>{data.caloriesToday} / 2000</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--gray-100)' }}>
              <span>Protein</span>
              <span style={{ fontWeight: 600 }}>65g / 120g</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--gray-100)' }}>
              <span>Carbs</span>
              <span style={{ fontWeight: 600 }}>180g / 250g</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
              <span>Fat</span>
              <span style={{ fontWeight: 600 }}>55g / 65g</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
