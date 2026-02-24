import { BrowserRouter, Routes, Route } from 'react-router-dom'
import EntryPage from './pages/EntryPage'
import FitnessLayout from './components/FitnessLayout'
import MedicineLayout from './components/MedicineLayout'
import FitnessDashboard from './pages/fitness/FitnessDashboard'
import Workouts from './pages/fitness/Workouts'
import Meals from './pages/fitness/Meals'
import CalorieTracker from './pages/fitness/CalorieTracker'
import MedicineDashboard from './pages/medicine/MedicineDashboard'
import MedScanner from './pages/medscan/MedScanner'
import MedTable from './pages/medicine/MedTable'
import MedCalendar from './pages/medicine/MedCalendar'
import MedTracker from './pages/medicine/MedTracker'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EntryPage />} />
        
        <Route path="/fitness" element={<FitnessLayout />}>
          <Route index element={<FitnessDashboard />} />
          <Route path="workouts" element={<Workouts />} />
          <Route path="meals" element={<Meals />} />
          <Route path="calories" element={<CalorieTracker />} />
        </Route>

        <Route path="/medicine" element={<MedicineLayout />}>
          <Route index element={<MedicineDashboard />} />
          <Route path="scan" element={<MedScanner />} />
          <Route path="table" element={<MedTable />} />
          <Route path="calendar" element={<MedCalendar />} />
          <Route path="tracker" element={<MedTracker />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
