import { useState, useEffect, useCallback } from 'react'
import { collection, addDoc, query, where, deleteDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../../services/firebase'
import { Plus, Trash2, UtensilsCrossed } from 'lucide-react'

interface FoodItem { 
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  quantity: number 
}

interface Meal { 
  id: string
  userId: string
  type: string
  foods: FoodItem[]
  totalCalories: number
  date: any
}

const commonFoods = [
  { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: 'Rice (1 cup)', calories: 206, protein: 4, carbs: 45, fat: 0.4 },
  { name: 'Eggs (2)', calories: 156, protein: 12, carbs: 1, fat: 10 },
  { name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0.4 },
  { name: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fat: 3 },
  { name: 'Salmon', calories: 208, protein: 20, carbs: 0, fat: 13 },
  { name: 'Broccoli', calories: 55, protein: 4, carbs: 11, fat: 0.6 },
  { name: 'Greek Yogurt', calories: 100, protein: 17, carbs: 6, fat: 0.7 }
]

function getUserId(): string {
  return auth.currentUser?.uid || 'demo-user'
}

export default function Meals() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [mealType, setMealType] = useState('lunch')
  const [selectedFoods, setSelectedFoods] = useState<FoodItem[]>([])
  const [customFood, setCustomFood] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', quantity: '1' })
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

    const q = query(collection(db, 'meals'), where('userId', '==', userId))
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => { 
        const data = snapshot.docs.map(d => {
          const docData = d.data()
          return {
            id: d.id,
            userId: docData.userId,
            type: docData.type,
            foods: docData.foods || [],
            totalCalories: docData.totalCalories || 0,
            date: docData.date
          } as Meal
        }).sort((a, b) => {
          const dateA = a.date?.toDate?.()?.getTime() || 0
          const dateB = b.date?.toDate?.()?.getTime() || 0
          return dateB - dateA
        })
        setMeals(data)
        setLoading(false)
      },
      (error) => {
        console.error('Meals snapshot error:', error)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [userId])

  const addCommonFood = (food: typeof commonFoods[0]) => {
    setSelectedFoods([...selectedFoods, { ...food, id: Date.now().toString(), quantity: 1 }])
  }

  const addCustomFood = () => { 
    if (!customFood.name || !customFood.calories) return
    setSelectedFoods([...selectedFoods, { 
      id: Date.now().toString(), 
      name: customFood.name, 
      calories: parseInt(customFood.calories) || 0, 
      protein: parseInt(customFood.protein) || 0, 
      carbs: parseInt(customFood.carbs) || 0, 
      fat: parseFloat(customFood.fat) || 0, 
      quantity: parseInt(customFood.quantity) || 1 
    }])
    setCustomFood({ name: '', calories: '', protein: '', carbs: '', fat: '', quantity: '1' })
  }

  const removeFood = (id: string) => {
    setSelectedFoods(selectedFoods.filter(f => f.id !== id))
  }

  const saveMeal = useCallback(async () => {
    if (selectedFoods.length === 0) return
    if (!auth.currentUser) {
      alert('Please log in to save meals')
      return
    }
    
    const currentUserId = auth.currentUser.uid
    const totalCalories = selectedFoods.reduce((sum, f) => sum + f.calories * f.quantity, 0)
    try {
      await addDoc(collection(db, 'meals'), { 
        userId: currentUserId, 
        date: serverTimestamp(), 
        type: mealType, 
        foods: selectedFoods, 
        totalCalories 
      })
      setShowForm(false)
      setSelectedFoods([])
    } catch (error) {
      console.error('Error saving meal:', error)
      alert('Failed to save meal')
    }
  }, [selectedFoods, mealType])

  const deleteMeal = async (id: string) => { 
    try {
      await deleteDoc(doc(db, 'meals', id))
    } catch (error) {
      console.error('Error deleting meal:', error)
    }
  }

  const totalCaloriesToday = meals.reduce((sum, m) => {
    const mealDate = m.date?.toDate?.()
    if (mealDate?.toDateString() === new Date().toDateString()) {
      return sum + (m.totalCalories || 0)
    }
    return sum
  }, 0)

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Meals</h1>
          <p className="page-subtitle">Today: {totalCaloriesToday} cal</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> Add Meal
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3>Add Meal</h3>
          <div className="form-group">
            <label className="form-label">Meal Type</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['breakfast', 'lunch', 'dinner', 'snack'].map(t => (
                <button 
                  key={t} 
                  className={`btn ${mealType === t ? 'btn-primary' : 'btn-secondary'}`} 
                  onClick={() => setMealType(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Quick Add</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {commonFoods.map(f => (
                <button 
                  key={f.name} 
                  className="btn btn-secondary" 
                  onClick={() => addCommonFood(f)} 
                  style={{ fontSize: '0.8rem' }}
                >
                  {f.name} ({f.calories})
                </button>
              ))}
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Custom Food</label>
            <div className="grid-3">
              <input type="text" className="input" placeholder="Name" value={customFood.name} onChange={e => setCustomFood({...customFood, name: e.target.value})} />
              <input type="number" className="input" placeholder="Cal" value={customFood.calories} onChange={e => setCustomFood({...customFood, calories: e.target.value})} />
              <input type="number" className="input" placeholder="Qty" value={customFood.quantity} onChange={e => setCustomFood({...customFood, quantity: e.target.value})} />
            </div>
            <button className="btn btn-secondary" onClick={addCustomFood} style={{ marginTop: '0.5rem' }}>
              <Plus size={16}/> Add
            </button>
          </div>

          {selectedFoods.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              {selectedFoods.map(f => (
                <div key={f.id} className="meal-item">
                  <span><strong>{f.name}</strong> x{f.quantity} = {f.calories * f.quantity} cal</span>
                  <button className="btn btn-secondary" onClick={() => removeFood(f.id)}>
                    <Trash2 size={14}/>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <button className="btn btn-primary" onClick={saveMeal} disabled={selectedFoods.length === 0}>
            Save Meal
          </button>
        </div>
      )}

      <div>
        {loading ? (
          <div className="empty-state">
            <p>Loading...</p>
          </div>
        ) : meals.length === 0 ? (
          <div className="empty-state">
            <UtensilsCrossed size={48} style={{opacity: 0.3}}/>
            <p>No meals logged yet</p>
          </div>
        ) : (
          meals.map(m => (
            <div key={m.id} className="card" style={{marginBottom: '1rem'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                <div>
                  <span className="badge badge-success">{m.type}</span>
                  <span style={{marginLeft: '0.5rem', color: 'var(--gray-500)'}}>
                    {m.date?.toDate?.()?.toLocaleDateString() || ''}
                  </span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                  <span style={{fontWeight: 600}}>{m.totalCalories} cal</span>
                  <button className="btn btn-secondary" onClick={() => deleteMeal(m.id)}>
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
              {m.foods && m.foods.length > 0 && (
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {m.foods.map((food, idx) => (
                    <span key={idx} style={{ display: 'inline-block', marginRight: '0.75rem', marginBottom: '0.25rem' }}>
                      {food.name} {food.quantity > 1 && `x${food.quantity}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
