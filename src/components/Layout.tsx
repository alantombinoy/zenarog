import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Dumbbell, 
  UtensilsCrossed, 
  Flame, 
  ScanLine, 
  History,
  LogOut,
  Heart
} from 'lucide-react'
export default function Layout() {
  const navigate = useNavigate()

  const handleLogout = () => {
    navigate('/auth')
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo">
          <Heart size={24} />
          Zenarog
        </div>

        <nav>
          <div className="nav-section">
            <div className="nav-label">Overview</div>
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
              <LayoutDashboard size={20} />
              Dashboard
            </NavLink>
          </div>

          <div className="nav-section">
            <div className="nav-label">Fitness</div>
            <NavLink to="/workouts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Dumbbell size={20} />
              Workouts
            </NavLink>
            <NavLink to="/meals" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <UtensilsCrossed size={20} />
              Meals
            </NavLink>
            <NavLink to="/calories" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Flame size={20} />
              Calories
            </NavLink>
          </div>

          <div className="nav-section">
            <div className="nav-label">MedScan</div>
            <NavLink to="/medscan" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ScanLine size={20} />
              Scan
            </NavLink>
            <NavLink to="/medhistory" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <History size={20} />
              History
            </NavLink>
          </div>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <button onClick={handleLogout} className="nav-link" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}>
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
