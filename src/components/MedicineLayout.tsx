import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { 
  ScanLine, 
  History, 
  LogOut,
  Heart,
  Pill,
  Calendar,
  LayoutDashboard
} from 'lucide-react'

export default function MedicineLayout() {
  const navigate = useNavigate()

  const handleLogout = () => {
    navigate('/')
  }

  return (
    <div className="app-container medicine-theme">
      <aside className="sidebar">
        <div className="logo">
          <Heart size={24} />
          Zenarog
        </div>

        <nav>
          <div className="nav-section">
            <div className="nav-label">Overview</div>
            <NavLink to="/medicine" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
              <LayoutDashboard size={20} />
              Dashboard
            </NavLink>
          </div>

          <div className="nav-section">
            <div className="nav-label">Medicine</div>
            <NavLink to="/medicine/scan" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ScanLine size={20} />
              Scan
            </NavLink>
            <NavLink to="/medicine/table" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Pill size={20} />
              My Meds
            </NavLink>
            <NavLink to="/medicine/calendar" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Calendar size={20} />
              Calendar
            </NavLink>
            <NavLink to="/medicine/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <History size={20} />
              History
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
