import { useState, useEffect } from 'react'
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { auth } from '../../services/firebase'
import { Plus, Trash2, UtensilsCrossed, Clock, Flame } from 'lucide-react'

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
  date: Date
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  foods: FoodItem[]
  totalCalories: number
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

export default function Meals() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch')
  const [selectedFoods, setSelectedFoods] = useState<FoodItem[]>([])
  const [customFood, setCustomFood] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', quantity: '1' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMeals()
  }, [])

  const fetchMeals = async () => {
    const user = auth.currentUser
    if (!user) return

    try {
      const q = query(
        collection(db, 'meals'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      )
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate()
      })) as Meal[]
      setMeals(data)
    } catch (error) {
      console.error('Error:', error)
      setMeals([
        {
          id: '1',
          date: new Date(),
          type: 'breakfast',
          foods: [
            { id: '1', name: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fat: 3, quantity: 1 },
            { id: '2', name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0.4, quantity: 1 }
          ],
          totalCalories: 255
        },
        {
          id: '2',
          date: new Date(),
          type: 'lunch',
          foods: [
            { id: '3', name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, quantity: 1 },
            { id: '4', name: 'Rice (1 cup)', calories: 206, protein: 4, carbs: 45, fat: 0.4, quantity: 1 }
          ],
          totalCalories: 371
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const addCommonFood = (food: typeof commonFoods[0]) => {
    const newFood: FoodItem = {
      id: Date.now().toString(),
      ...food,
      quantity: 1
    }
    setSelectedFoods([...selectedFoods, newFood])
  }

  const addCustomFood = () => {
    if (!customFood.name || !customFood.calories) return
    const newFood: FoodItem = {
      id: Date.now().toString(),
      name: customFood.name,
      calories: parseInt(customFood.calories) || 0,
      protein: parseInt(customFood.protein) || 0,
      carbs: parseInt(customFood.carbs) || 0,
      fat: parseFloat(customFood.fat) || 0,
      quantity: parseInt(customFood.quantity) || 1
    }
    setSelectedFoods([...selectedFoods, newFood])
    setCustomFood({ name: '', calories: '', protein: '', carbs: '', fat: '', quantity: '1' })
  }

  const removeFood = (id: string) => {
    setSelectedFoods(selectedFoods.filter(f => f.id !== id))
  }

  const saveMeal = async () => {
    const user = auth.currentUser
    if (!user || selectedFoods.length === 0) return

    const totalCalories = selectedFoods.reduce((sum, f) => sum + f.calories * f.quantity, 0)

    try {
      await addDoc(collection(db, 'meals'), {
        userId: user.uid,
        date: new Date(),
        type: mealType,
        foods: selectedFoods,
        totalCalories
      })
      setShowForm(false)
      setSelectedFoods([])
      fetchMeals()
    } catch (error) {
      console.error('Error saving meal:', error)
    }
  }

  const deleteMeal = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'meals', id))
      setMeals(meals.filter(m => m.id !== id))
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  const totalCaloriesToday = meals
    .filter(m => m.date.toDateString() === new Date().toDateString())
    .reduce((sum, m) => sum + m.totalCalories, 0)

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Meals</h1>
          <p className="page-subtitle">Track your daily nutrition • Today: {totalCaloriesToday} cal</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> Add Meal
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Add Meal</h3>

          <div className="form-group">
            <label className="form-label">Meal Type</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(type => (
                <button
                  key={type}
                  className={`btn ${mealType === type ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setMealType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Quick Add</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {commonFoods.map(food => (
                <button
                  key={food.name}
                  className="btn btn-secondary"
                  onClick={() => addCommonFood(food)}
                  style={{ fontSize: '0.8rem' }}
                >
                  {food.name} ({food.calories})
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Or add custom food</label>
            <div className="grid-3">
              <input
                type="text"
                className="input"
                placeholder="Food name"
                value={customFood.name}
                onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
              />
              <input
                type="number"
                className="input"
                placeholder="Calories"
                value={customFood.calories}
                onChange={(e) => setCustomFood({ ...customFood, calories: e.target.value })}
              />
              <input
                type="number"
                className="input"
                placeholder="Quantity"
                value={customFood.quantity}
                onChange={(e) => setCustomFood({ ...customFood, quantity: e.target.value })}
              />
            </div>
            <button className="btn btn-secondary" onClick={addCustomFood} style={{ marginTop: '0.5rem' }}>
              <Plus size={16} /> Add Custom
            </button>
          </div>

          {selectedFoods.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Selected Foods</label>
              {selectedFoods.map(food => (
                <div key={food.id} className="meal-item">
                  <div>
                    <strong>{food.name}</strong>
                    <span style={{ color: 'var(--gray-500)', marginLeft: '0.5rem' }}>
                      ×{food.quantity}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span>{food.calories * food.quantity} cal</span>
                    <button className="btn btn-secondary" onClick={() => removeFood(food.id)} style={{ padding: '0.25rem' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              <div style={{ textAlign: 'right', fontWeight: 600, marginTop: '0.5rem' }}>
                Total: {selectedFoods.reduce((sum, f) => sum + f.calories * f.quantity, 0)} calories
              </div>
            </div>
          )}

          <button className="btn btn-primary" onClick={saveMeal} disabled={selectedFoods.length === 0}>
            Save Meal
          </button>
        </div>
      )}

      <div>
        {meals.length === 0 ? (
          <div className="empty-state">
            <UtensilsCrossed size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p>No meals logged yet. Start tracking your nutrition!</p>
          </div>
        ) : (
          meals.map(meal => (
            <div key={meal.id} className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-success">{meal.type}</span>
                    <span style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
                      {meal.date.toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontWeight: 600 }}>{meal.totalCalories} cal</span>
                  <button className="btn btn-secondary" onClick={() => deleteMeal(meal.id)} style={{ padding: '0.5rem' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {meal.foods.map((food, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '0.375rem 0.75rem',
                      background: 'var(--gray-100)',
                      borderRadius: '9999px',
                      fontSize: '0.8rem'
                    }}
                  >
                    {food.name} ×{food.quantity}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
