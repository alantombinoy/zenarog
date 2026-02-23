import { useState } from 'react'
import { ChevronLeft, ChevronRight, Pill, Clock } from 'lucide-react'

interface CalendarEvent {
  id: string
  medName: string
  dosage: string
  time: string
  taken: boolean
}

export default function MedCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: '1', medName: 'Paracetamol', dosage: '500mg', time: '08:00', taken: true },
    { id: '2', medName: 'Amoxicillin', dosage: '250mg', time: '08:00', taken: true },
    { id: '3', medName: 'Amoxicillin', dosage: '250mg', time: '20:00', taken: false },
    { id: '4', medName: 'Paracetamol', dosage: '500mg', time: '12:00', taken: false },
  ])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    
    const days = []
    
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    
    return days
  }

  const getEventsForDay = (day: number | null) => {
    if (!day) return []
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => {
      const eventDate = new Date()
      eventDate.setHours(parseInt(e.time.split(':')[0]), parseInt(e.time.split(':')[1]))
      return eventDate.toDateString() === new Date(dateStr).toDateString() || day === new Date().getDate()
    })
  }

  const toggleTaken = (id: string) => {
    setEvents(events.map(e => 
      e.id === id ? { ...e, taken: !e.taken } : e
    ))
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const days = getDaysInMonth(currentDate)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Medication Calendar</h1>
        <p className="page-subtitle">Track your daily medication schedule</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>
            <ChevronLeft size={18} />
          </button>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button className="btn btn-secondary" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
          {dayNames.map(day => (
            <div key={day} style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '0.5rem' }}>
              {day}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
          {days.map((day, index) => {
            const dayEvents = getEventsForDay(day)
            const isToday = day === new Date().getDate() && 
              currentDate.getMonth() === new Date().getMonth() && 
              currentDate.getFullYear() === new Date().getFullYear()
            
            return (
              <div 
                key={index}
                style={{ 
                  minHeight: '80px', 
                  padding: '0.5rem',
                  background: isToday ? 'var(--primary-light)' : 'var(--gray-50)',
                  borderRadius: '0.5rem',
                  border: isToday ? '2px solid var(--primary)' : '1px solid var(--gray-200)'
                }}
              >
                {day && (
                  <>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{day}</div>
                    {dayEvents.slice(0, 2).map(event => (
                      <div 
                        key={event.id}
                        style={{ 
                          fontSize: '0.65rem', 
                          padding: '0.125rem 0.25rem',
                          background: event.taken ? 'var(--success)' : 'var(--warning)',
                          color: event.taken ? 'white' : '#1a1a1a',
                          borderRadius: '0.25rem',
                          marginBottom: '0.125rem',
                          cursor: 'pointer'
                        }}
                        onClick={() => toggleTaken(event.id)}
                      >
                        {event.time} {event.medName}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Today's Schedule</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {events.map(event => (
            <div 
              key={event.id}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '1rem',
                background: event.taken ? 'var(--primary-light)' : 'var(--gray-50)',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
              onClick={() => toggleTaken(event.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: event.taken ? 'var(--success)' : 'var(--gray-300)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Pill size={20} color={event.taken ? 'white' : 'var(--gray-500)'} />
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{event.medName}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {event.dosage}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} />
                <span>{event.time}</span>
                {event.taken && (
                  <span className="badge badge-success">Taken</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
