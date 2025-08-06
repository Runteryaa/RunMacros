"use client";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getDatabase, ref, onValue, push, get, set, child } from "firebase/database";
import { app } from "@/lib/firebase";

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
  portion?: number;
};

type FatSecretFood = {
  food_id: string;
  food_name: string;
  food_description: string; // macros in string!
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
  const [portion, setPortion] = useState("1"); // <-- Portion
  const [lastMacros, setLastMacros] = useState({calories: "", protein: "", carbs: "", fat: ""}); // Oto güncelleme için
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  // --- Food search state ---
  const [foodQuery, setFoodQuery] = useState("");
  const [foodResults, setFoodResults] = useState<FatSecretFood[]>([]);
  const [searching, setSearching] = useState(false);

  // Auth
  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  // Listen for today's meals
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

  // Food search
  useEffect(() => {
    if (!foodQuery) {
      setFoodResults([]);
      return;
    }
    setSearching(true);
    fetch(`/api/food-search?q=${encodeURIComponent(foodQuery)}`)
      .then(r => r.json())
      .then(data => setFoodResults(Array.isArray(data) ? data : []))
      .finally(() => setSearching(false));
  }, [foodQuery]);

  // --- Makroları yuvarlayarak ve virgülü nokta yaparak doldur ---
  function fix(val: string | undefined) {
    if (!val) return "";
    let num = Number(val.replace(",", "."));
    return isNaN(num) ? "" : String(Math.round(num));
  }

  // FatSecret seçiminde otomatik doldurma + son makro hafızası
  async function handlePickFood(food: FatSecretFood) {
    setFoodQuery("");
    setFoodResults([]);
    const macros = parseMacrosFromDescription(food.food_description);
    const newMacros = {
      calories: fix(macros.calories),
      protein: fix(macros.protein),
      carbs: fix(macros.carbs),
      fat: fix(macros.fat),
    };
    setNewMeal({
      name: food.food_name,
      ...newMacros,
    });
    setLastMacros(newMacros); // Portion çarpımı için orijinal değerleri hatırlıyoruz
    setPortion("1");
  }

  // Portion değişince makrolar otomatik güncellenir (eğer kullanıcı override etmediyse)
  useEffect(() => {
    // Son search'ten gelmediyse bozma
    if (!lastMacros.calories) return;
    const p = parseFloat(portion.replace(",", ".")) || 1;
    setNewMeal(meal => ({
      ...meal,
      calories: fix((Number(lastMacros.calories) * p).toString()),
      protein: fix((Number(lastMacros.protein) * p).toString()),
      carbs: fix((Number(lastMacros.carbs) * p).toString()),
      fat: fix((Number(lastMacros.fat) * p).toString()),
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portion]);

  // Makroları parsing
  function parseMacrosFromDescription(desc: string) {
    const regex = /Calories:\s*([\d.,]+)kcal.*Fat:\s*([\d.,]+)g.*Carbs:\s*([\d.,]+)g.*Protein:\s*([\d.,]+)g/i;
    const m = desc.match(regex);
    if (!m) return {};
    return {
      calories: m[1],
      fat: m[2],
      carbs: m[3],
      protein: m[4],
    };
  }

  // Yemek ekle
  async function handleAddMeal(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const db = getDatabase(app);
    const dayPath = `users/${user.uid}/days/${todayStr()}`;
    const mealsRef = ref(db, `${dayPath}/meals`);
    const meal = {
      name: newMeal.name || "Meal",
      calories: Math.round(Number(newMeal.calories)),
      protein: Math.round(Number(newMeal.protein)),
      carbs: Math.round(Number(newMeal.carbs)),
      fat: Math.round(Number(newMeal.fat)),
      portion: parseFloat(portion.replace(",", ".")) || 1,
    };
    await push(mealsRef, meal);

    // Günlük makro güncelle
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
    await set(dayRef, {
      ...sum,
      meals: snap.exists() ? snap.val() : {},
    });

    setMessage("Meal added!");
    setNewMeal({ name: "", calories: "", protein: "", carbs: "", fat: "" });
    setLastMacros({calories: "", protein: "", carbs: "", fat: ""});
    setPortion("1");
    setTimeout(() => setMessage(null), 2000);
  }

  // Günlük total
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
      {/* FatSecret Food Search */}
      <div className="mb-4">
        <label className="mb-1 text-sm font-medium" htmlFor="food-search">Food Search</label>
        <input
          id="food-search"
          type="text"
          placeholder="🔎 Search food database (e.g. domates, yumurta, yogurt...)"
          value={foodQuery}
          onChange={e => setFoodQuery(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />
        {searching && <div className="text-sm text-gray-500">Searching...</div>}
        {foodResults.length > 0 && (
          <ul className="bg-white border rounded shadow mt-2 max-h-60 overflow-y-auto z-10">
            {foodResults.slice(0, 10).map(food => (
              <li
                key={food.food_id}
                className="px-3 py-2 cursor-pointer hover:bg-green-100"
                onClick={() => handlePickFood(food)}
              >
                <span className="font-medium">{food.food_name}</span>
                <span className="ml-2 text-xs text-gray-600">{food.food_description}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Add Meal Form */}
      <form onSubmit={handleAddMeal} className="flex flex-wrap gap-2 mb-6">
        <div className="flex flex-col flex-1 min-w-[120px]">
          <label className="mb-1 text-sm font-medium" htmlFor="meal-name">Meal Name</label>
          <input
            id="meal-name"
            name="name"
            placeholder="Meal name"
            value={newMeal.name}
            onChange={e => setNewMeal(m => ({ ...m, name: e.target.value }))}
            className="border rounded px-3 py-2"
            autoComplete="off"
          />
        </div>
        <div className="flex flex-col w-28">
          <label className="mb-1 text-sm font-medium" htmlFor="calories">Calories</label>
          <input
            id="calories"
            name="calories"
            placeholder="Calories"
            type="number"
            min={0}
            value={newMeal.calories}
            onChange={e => setNewMeal(m => ({ ...m, calories: e.target.value }))}
            className="border rounded px-3 py-2"
            required
          />
        </div>
        <div className="flex flex-col w-24">
          <label className="mb-1 text-sm font-medium" htmlFor="protein">Protein (g)</label>
          <input
            id="protein"
            name="protein"
            placeholder="Protein"
            type="number"
            min={0}
            value={newMeal.protein}
            onChange={e => setNewMeal(m => ({ ...m, protein: e.target.value }))}
            className="border rounded px-3 py-2"
            required
          />
        </div>
        <div className="flex flex-col w-24">
          <label className="mb-1 text-sm font-medium" htmlFor="carbs">Carbs (g)</label>
          <input
            id="carbs"
            name="carbs"
            placeholder="Carbs"
            type="number"
            min={0}
            value={newMeal.carbs}
            onChange={e => setNewMeal(m => ({ ...m, carbs: e.target.value }))}
            className="border rounded px-3 py-2"
            required
          />
        </div>
        <div className="flex flex-col w-24">
          <label className="mb-1 text-sm font-medium" htmlFor="fat">Fat (g)</label>
          <input
            id="fat"
            name="fat"
            placeholder="Fat"
            type="number"
            min={0}
            value={newMeal.fat}
            onChange={e => setNewMeal(m => ({ ...m, fat: e.target.value }))}
            className="border rounded px-3 py-2"
            required
          />
        </div>
        <div className="flex flex-col w-20">
          <label className="mb-1 text-sm font-medium" htmlFor="portion">Portion</label>
          <input
            id="portion"
            name="portion"
            placeholder="e.g. 1, 1.5"
            type="number"
            step="0.01"
            min={0.1}
            value={portion}
            onChange={e => setPortion(e.target.value.replace(",", "."))}
            className="border rounded px-3 py-2"
            required
          />
        </div>
        <div className="flex flex-col justify-end">
          <button type="submit" className="bg-green-500 text-white rounded px-4 py-2 font-semibold mt-5">
            Add Meal
          </button>
        </div>
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
                <th>Portion</th>
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
                  <td className="text-center">{meal.portion ?? 1}</td>
                </tr>
              ))}
              {/* Total row */}
              <tr className="font-bold border-t">
                <td className="px-2 py-1">Total</td>
                <td className="text-center">{total.calories}</td>
                <td className="text-center">{total.protein}</td>
                <td className="text-center">{total.carbs}</td>
                <td className="text-center">{total.fat}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
