import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, Pill, ChevronLeft, ChevronRight, Heart, Zap } from 'lucide-react'

export default function EntryPage() {
  const [selected, setSelected] = useState<'fitness' | 'medicine'>('medicine')
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const navigate = useNavigate()

  const handleSwipe = (direction: 'left' | 'right') => {
    setIsAnimating(true)
    setTimeout(() => {
      setSelected(direction === 'left' ? 'fitness' : 'medicine')
      setIsAnimating(false)
    }, 200)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX
    const diff = startX.current - endX
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleSwipe('left')
      } else {
        handleSwipe('right')
      }
    }
  }

  const handleContinue = () => {
    if (selected === 'fitness') {
      navigate('/fitness')
    } else {
      navigate('/medicine')
    }
  }

  return (
    <div 
      ref={containerRef}
      className={`entry-container ${selected}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="swipe-hint">
        <ChevronLeft size={20} />
        <span>Swipe</span>
        <ChevronRight size={20} />
      </div>

      <div className={`card-container ${isAnimating ? 'animating' : ''}`}>
        {selected === 'medicine' ? (
          <div className="card medicine-card">
            <div className="card-icon medicine">
              <Pill size={64} />
            </div>
            <h1>Medicine</h1>
            <p>Scan your tablets, track dosages & set reminders</p>
            <div className="feature-tags">
              <span>💊 Scan Pills</span>
              <span>📅 Dosage Calendar</span>
              <span>⚠️ Side Effects</span>
            </div>
          </div>
        ) : (
          <div className="card fitness-card">
            <div className="card-icon fitness">
              <Dumbbell size={64} />
            </div>
            <h1>Fitness</h1>
            <p>Track workouts, meals & calories</p>
            <div className="feature-tags">
              <span>🏋️ Workouts</span>
              <span>🥗 Meals</span>
              <span>🔥 Calories</span>
            </div>
          </div>
        )}
      </div>

      <div className="nav-dots">
        <button 
          className={`dot ${selected === 'medicine' ? 'active' : ''}`}
          onClick={() => handleSwipe('right')}
        />
        <button 
          className={`dot ${selected === 'fitness' ? 'active' : ''}`}
          onClick={() => handleSwipe('left')}
        />
      </div>

      <button className={`continue-btn ${selected}`} onClick={handleContinue}>
        Continue to {selected === 'medicine' ? 'Medicine' : 'Fitness'} 
        <ChevronRight size={20} />
      </button>
    </div>
  )
}
