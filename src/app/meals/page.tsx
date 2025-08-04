"use client";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getDatabase, ref, onValue, push, get, set, child } from "firebase/database";

import { app } from "@/lib/firebase";

// Utility for today's date string
function todayStr() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

type Meal = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export default function MealsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [newMeal, setNewMeal] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: ""
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  // 1. Auth
  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  // 2. Listen for today's meals
  useEffect(() => {
    if (!user) return;
    const db = getDatabase(app);
    const mealsRef = ref(db, `users/${user.uid}/days/${todayStr()}/meals`);
    const unsub = onValue(mealsRef, (snap) => {
      const val = snap.val();
      setMeals(val ? Object.values(val) : []);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // 3. Add meal
  async function handleAddMeal(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const db = getDatabase(app);
    const dayPath = `users/${user.uid}/days/${todayStr()}`;
    const mealsRef = ref(db, `${dayPath}/meals`);
    const meal = {
      name: newMeal.name || "Meal",
      calories: Number(newMeal.calories),
      protein: Number(newMeal.protein),
      carbs: Number(newMeal.carbs),
      fat: Number(newMeal.fat),
    };
  await push(mealsRef, meal);
  const dayRef = ref(db, dayPath);
  const snap = await get(child(dayRef, "meals"));
  let sum = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  if (snap.exists()) {
    Object.values(snap.val()).forEach((m: any) => {
      sum.calories += Number(m.calories) || 0;
      sum.protein += Number(m.protein) || 0;
      sum.carbs += Number(m.carbs) || 0;
      sum.fat += Number(m.fat) || 0;
    });
  }
  // Write summed macros to day root
  await set(dayRef, {
    ...sum,
    meals: snap.exists() ? snap.val() : {},
  });

  setMessage("Meal added!");
  setNewMeal({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  setTimeout(() => setMessage(null), 2000);
}

  // 4. Totals
  const total = meals.reduce(
    (t, m) => ({
      calories: t.calories + m.calories,
      protein: t.protein + m.protein,
      carbs: t.carbs + m.carbs,
      fat: t.fat + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return <div className="p-8">Please log in to view your meals.</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow mt-10">
      <h1 className="text-2xl font-bold mb-4">Today's Meals</h1>
      {/* Add Meal Form */}
      <form onSubmit={handleAddMeal} className="flex flex-wrap gap-2 mb-6">
        <input
          name="name"
          placeholder="Meal name"
          value={newMeal.name}
          onChange={e => setNewMeal(m => ({ ...m, name: e.target.value }))}
          className="border rounded px-3 py-2 flex-1"
        />
        <input
          name="calories"
          placeholder="Calories"
          type="number"
          min={0}
          value={newMeal.calories}
          onChange={e => setNewMeal(m => ({ ...m, calories: e.target.value }))}
          className="border rounded px-3 py-2 w-28"
          required
        />
        <input
          name="protein"
          placeholder="Protein"
          type="number"
          min={0}
          value={newMeal.protein}
          onChange={e => setNewMeal(m => ({ ...m, protein: e.target.value }))}
          className="border rounded px-3 py-2 w-24"
          required
        />
        <input
          name="carbs"
          placeholder="Carbs"
          type="number"
          min={0}
          value={newMeal.carbs}
          onChange={e => setNewMeal(m => ({ ...m, carbs: e.target.value }))}
          className="border rounded px-3 py-2 w-24"
          required
        />
        <input
          name="fat"
          placeholder="Fat"
          type="number"
          min={0}
          value={newMeal.fat}
          onChange={e => setNewMeal(m => ({ ...m, fat: e.target.value }))}
          className="border rounded px-3 py-2 w-24"
          required
        />
        <button type="submit" className="bg-green-500 text-white rounded px-4 py-2 font-semibold">
          Add Meal
        </button>
      </form>
      {message && <div className="text-green-600 mb-4">{message}</div>}

      {/* Meals List */}
      <div className="mb-4">
        {meals.length === 0 ? (
          <div className="text-gray-500">No meals logged yet for today.</div>
        ) : (
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left px-2 py-1">Meal</th>
                <th>Calories</th>
                <th>Protein</th>
                <th>Carbs</th>
                <th>Fat</th>
              </tr>
            </thead>
            <tbody>
              {meals.map((meal, idx) => (
                <tr key={idx} className="even:bg-gray-50">
                  <td className="px-2 py-1">{meal.name}</td>
                  <td className="text-center">{meal.calories}</td>
                  <td className="text-center">{meal.protein}</td>
                  <td className="text-center">{meal.carbs}</td>
                  <td className="text-center">{meal.fat}</td>
                </tr>
              ))}
              {/* Total row */}
              <tr className="font-bold border-t">
                <td className="px-2 py-1">Total</td>
                <td className="text-center">{total.calories}</td>
                <td className="text-center">{total.protein}</td>
                <td className="text-center">{total.carbs}</td>
                <td className="text-center">{total.fat}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
