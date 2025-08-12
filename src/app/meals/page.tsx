"use client";
import { useEffect, useMemo, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getDatabase, ref, onValue, set, get, child, remove } from "firebase/database";
import { app } from "@/lib/firebase";

function todayStr() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

type Macros = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type FoodItem = {
  macros: Macros;
  portion?: number;
};

const DEFAULT_CATEGORIES = ["Breakfast", "Lunch", "Dinner", "Snack"];

export default function MealsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [meals, setMeals] = useState<Record<string, Record<string, FoodItem>>>({});
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [foodName, setFoodName] = useState("");
  const [macros, setMacros] = useState<Macros>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [portion, setPortion] = useState("1");

  useEffect(() => {
    const auth = getAuth(app);
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const db = getDatabase(app);
    const mealsRef = ref(db, `users/${user.uid}/days/${todayStr()}/meals`);
    return onValue(mealsRef, (snap) => {
      setMeals(snap.val() || {});
      setLoading(false);
    });
  }, [user]);

  async function handleAddFood(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !foodName.trim()) return;

    const db = getDatabase(app);
    const p = parseFloat(portion) || 1;

    const scaledMacros = {
      calories: Math.round(macros.calories * p),
      protein: Math.round(macros.protein * p),
      carbs: Math.round(macros.carbs * p),
      fat: Math.round(macros.fat * p),
    };

    await set(
      ref(db, `users/${user.uid}/days/${todayStr()}/meals/${category}/${foodName}`),
      {
        macros: scaledMacros,
        portion: p,
      }
    );

    setFoodName("");
    setMacros({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    setPortion("1");
  }

  const groupedTotals = useMemo(() => {
    const totals: Record<string, Macros> = {};
    for (const cat in meals) {
      totals[cat] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      for (const food in meals[cat]) {
        const m = meals[cat][food].macros;
        totals[cat].calories += m.calories || 0;
        totals[cat].protein += m.protein || 0;
        totals[cat].carbs += m.carbs || 0;
        totals[cat].fat += m.fat || 0;
      }
    }
    return totals;
  }, [meals]);

  const overallTotal = useMemo(() => {
    return Object.values(groupedTotals).reduce(
      (acc, t) => ({
        calories: acc.calories + t.calories,
        protein: acc.protein + t.protein,
        carbs: acc.carbs + t.carbs,
        fat: acc.fat + t.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [groupedTotals]);

  if (!user) return <div className="p-8">Please log in</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow mt-6">
      <h1 className="text-2xl font-bold mb-6">Today’s Meals ({todayStr()})</h1>

      {/* Add food form */}
      <form onSubmit={handleAddFood} className="flex flex-wrap gap-3 mb-8">
  <div className="flex flex-col">
    <label className="mb-1 text-sm font-medium">Category</label>
    <select
      value={category}
      onChange={(e) => setCategory(e.target.value)}
      className="border rounded px-3 py-2"
    >
      {categories.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  </div>

  <div className="flex flex-col flex-1">
    <label className="mb-1 text-sm font-medium">Food Name</label>
    <input
      type="text"
      value={foodName}
      onChange={(e) => setFoodName(e.target.value)}
      className="border rounded px-3 py-2"
      required
    />
  </div>

  <div className="flex flex-col w-24">
    <label className="mb-1 text-sm font-medium">Calories</label>
    <input
      type="number"
      value={macros.calories}
      onChange={(e) => setMacros(m => ({ ...m, calories: Number(e.target.value) }))}
      className="border rounded px-3 py-2"
      required
    />
  </div>

  <div className="flex flex-col w-24">
    <label className="mb-1 text-sm font-medium">Protein (g)</label>
    <input
      type="number"
      value={macros.protein}
      onChange={(e) => setMacros(m => ({ ...m, protein: Number(e.target.value) }))}
      className="border rounded px-3 py-2"
      required
    />
  </div>

  <div className="flex flex-col w-24">
    <label className="mb-1 text-sm font-medium">Carbs (g)</label>
    <input
      type="number"
      value={macros.carbs}
      onChange={(e) => setMacros(m => ({ ...m, carbs: Number(e.target.value) }))}
      className="border rounded px-3 py-2"
      required
    />
  </div>

  <div className="flex flex-col w-24">
    <label className="mb-1 text-sm font-medium">Fat (g)</label>
    <input
      type="number"
      value={macros.fat}
      onChange={(e) => setMacros(m => ({ ...m, fat: Number(e.target.value) }))}
      className="border rounded px-3 py-2"
      required
    />
  </div>

  <div className="flex flex-col w-20">
    <label className="mb-1 text-sm font-medium">Portion</label>
    <input
      type="number"
      value={portion}
      onChange={(e) => setPortion(e.target.value)}
      className="border rounded px-3 py-2"
    />
  </div>

  <div className="flex flex-col justify-end">
    <button
      type="submit"
      className="bg-green-600 text-white px-4 py-2 rounded"
    >
      Add
    </button>
  </div>
</form>


      {loading ? (
        <div>Loading meals…</div>
      ) : (
        <>
          {Object.keys(meals).length === 0 ? (
            <div>No meals yet.</div>
          ) : (
            <>
              {Object.entries(meals).map(([cat, foods]) => (
                <div key={cat} className="mb-6">
                  <h2 className="font-semibold mb-2">{cat} — kcal: {groupedTotals[cat].calories}</h2>
                  <table className="w-full text-sm border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left px-2 py-1">Food</th>
                        <th>Calories</th>
                        <th>Protein</th>
                        <th>Carbs</th>
                        <th>Fat</th>
                        <th>Portion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(foods).map(([foodName, data]) => (
                        <tr key={foodName} className="even:bg-gray-50">
                          <td className="px-2 py-1">{foodName}</td>
                          <td className="text-center">{data.macros.calories}</td>
                          <td className="text-center">{data.macros.protein}</td>
                          <td className="text-center">{data.macros.carbs}</td>
                          <td className="text-center">{data.macros.fat}</td>
                          <td className="text-center">{data.portion ?? 1}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              {/* Overall total */}
              <div className="border-t pt-4 text-right text-sm">
                <strong>Daily Total:</strong> kcal {overallTotal.calories} | P {overallTotal.protein}g | C {overallTotal.carbs}g | F {overallTotal.fat}g
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
