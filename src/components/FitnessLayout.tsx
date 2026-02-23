import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { 
  Dumbbell, 
  UtensilsCrossed, 
  Flame, 
  LogOut,
  Heart,
  LayoutDashboard
} from 'lucide-react'

export default function FitnessLayout() {
  const navigate = useNavigate()

  const handleLogout = () => {
    navigate('/')
  }

  return (
    <div className="app-container fitness-theme">
      <aside className="sidebar">
        <div className="logo">
          <Heart size={24} />
          Zenarog
        </div>

        <nav>
          <div className="nav-section">
            <div className="nav-label">Overview</div>
            <NavLink to="/fitness" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
              <LayoutDashboard size={20} />
              Dashboard
            </NavLink>
          </div>

          <div className="nav-section">
            <div className="nav-label">Fitness</div>
            <NavLink to="/fitness/workouts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Dumbbell size={20} />
              Workouts
            </NavLink>
            <NavLink to="/fitness/meals" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <UtensilsCrossed size={20} />
              Meals
            </NavLink>
            <NavLink to="/fitness/calories" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Flame size={20} />
              Calories
            </NavLink>
          </div>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <button onClick={handleLogout} className="nav-link" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}>
            <LogOut size={20} />
            Exit
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
