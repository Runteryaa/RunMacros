"use client";
import { useEffect, useMemo, useState } from "react";
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

type Ingredient = {
  name: string;
  amount?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
};

type Recipe = {
  id: string;
  title?: string;
  description?: string;
  image?: string;
  calories?: number;
  macros?: { protein?: number; carbs?: number; fat?: number };
  ingredients?: Ingredient[];
};

type SearchItem = {
  id: string;
  title: string;
  totals: { calories: number; protein: number; carbs: number; fat: number };
  description: string;
};

export default function MealsPage() {
  const [user, setUser] = useState<User | null>(null);

  // Meals state
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [newMeal, setNewMeal] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });
  const [portion, setPortion] = useState("1");

  // For portion auto-update
  const [lastMacros, setLastMacros] = useState({
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  const [message, setMessage] = useState<string | null>(null);

  // Search (from recipes)
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [foodQuery, setFoodQuery] = useState("");
  const [foodResults, setFoodResults] = useState<SearchItem[]>([]);

  // --- helpers ---
  function fix(val: string | undefined) {
    if (!val) return "";
    const num = Number(val.replace(",", "."));
    return isNaN(num) ? "" : String(Math.round(num));
  }

  function totalFromRecipe(r: Recipe): { calories: number; protein: number; carbs: number; fat: number } {
    // Prefer explicit macros & calories
    const baseCalories =
      typeof r.calories === "number"
        ? r.calories
        : (r.ingredients || []).reduce((sum, ing) => sum + (Number(ing.calories) || 0), 0);

    const protein =
      r.macros?.protein ??
      (r.ingredients || []).reduce((sum, ing) => sum + (Number(ing.protein) || 0), 0);

    const carbs =
      r.macros?.carbs ??
      (r.ingredients || []).reduce((sum, ing) => sum + (Number(ing.carbs) || 0), 0);

    const fat =
      r.macros?.fat ??
      (r.ingredients || []).reduce((sum, ing) => sum + (Number(ing.fat) || 0), 0);

    return {
      calories: Math.round(baseCalories || 0),
      protein: Math.round(protein || 0),
      carbs: Math.round(carbs || 0),
      fat: Math.round(fat || 0),
    };
  }

  function buildDescription(t: { calories: number; protein: number; carbs: number; fat: number }) {
    return `Calories: ${t.calories} kcal | Protein: ${t.protein}g | Carbs: ${t.carbs}g | Fat: ${t.fat}g`;
  }

  // --- auth ---
  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  // --- load today's meals ---
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

  // --- load recipes once ---
  useEffect(() => {
    const db = getDatabase(app);
    const rRef = ref(db, "recipes");
    const unsub = onValue(rRef, (snap) => {
      const val = snap.val() || {};
      const arr: Recipe[] = Object.entries(val)
        .map(([id, v]: [string, any]) => ({
          id,
          title: typeof v === "object" ? v.title : undefined,
          description: v?.description,
          image: v?.image,
          calories: v?.calories,
          macros: v?.macros,
          ingredients: v?.ingredients,
        }))
        // filter out completely empty entries
        .filter((r) => r.title || r.ingredients || r.calories || r.macros);
      setRecipes(arr);
    });
    return () => unsub();
  }, []);

  // --- filter recipes on query ---
  useEffect(() => {
    if (!foodQuery.trim()) {
      setFoodResults([]);
      return;
    }
    const q = foodQuery.toLowerCase();
    const matches = recipes
      .filter((r) => {
        const inTitle = (r.title || "").toLowerCase().includes(q);
        const inIngs = (r.ingredients || []).some((ing) => (ing.name || "").toLowerCase().includes(q));
        return inTitle || inIngs;
      })
      .slice(0, 25)
      .map((r) => {
        const title = r.title || r.id.replace(/[_-]/g, " ");
        const totals = totalFromRecipe(r);
        return {
          id: r.id,
          title,
          totals,
          description: buildDescription(totals),
        };
      });
    setFoodResults(matches);
  }, [foodQuery, recipes]);

  // --- pick from recipes ---
  function handlePickFood(item: SearchItem) {
    setFoodQuery("");
    setFoodResults([]);
    const { totals } = item;
    const newMacros = {
      calories: String(totals.calories),
      protein: String(totals.protein),
      carbs: String(totals.carbs),
      fat: String(totals.fat),
    };
    setNewMeal({
      name: item.title,
      ...newMacros,
    });
    setLastMacros(newMacros);
    setPortion("1");
  }

  // --- auto update by portion ---
  useEffect(() => {
    if (!lastMacros.calories) return; // nothing selected yet
    const p = parseFloat(portion.replace(",", ".")) || 1;
    setNewMeal((meal) => ({
      ...meal,
      calories: fix((Number(lastMacros.calories) * p).toString()),
      protein: fix((Number(lastMacros.protein) * p).toString()),
      carbs: fix((Number(lastMacros.carbs) * p).toString()),
      fat: fix((Number(lastMacros.fat) * p).toString()),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portion]);

  // --- add meal ---
  async function handleAddMeal(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const db = getDatabase(app);
    const dayPath = `users/${user.uid}/days/${todayStr()}`;
    const mealsRef = ref(db, `${dayPath}/meals`);

    const meal: Meal = {
      name: newMeal.name || "Meal",
      calories: Math.round(Number(newMeal.calories)),
      protein: Math.round(Number(newMeal.protein)),
      carbs: Math.round(Number(newMeal.carbs)),
      fat: Math.round(Number(newMeal.fat)),
      portion: parseFloat(portion.replace(",", ".")) || 1,
    };

    await push(mealsRef, meal);

    // recompute daily totals
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
    await set(dayRef, { ...sum, meals: snap.exists() ? snap.val() : {} });

    setMessage("Meal added!");
    setNewMeal({ name: "", calories: "", protein: "", carbs: "", fat: "" });
    setLastMacros({ calories: "", protein: "", carbs: "", fat: "" });
    setPortion("1");
    setTimeout(() => setMessage(null), 2000);
  }

  // daily totals
  const total = useMemo(
    () =>
      meals.reduce(
        (t, m) => ({
          calories: t.calories + m.calories,
          protein: t.protein + m.protein,
          carbs: t.carbs + m.carbs,
          fat: t.fat + m.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      ),
    [meals]
  );

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return <div className="p-8">Please log in to view your meals.</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow mt-10">
      <h1 className="text-2xl font-bold mb-4">Today's Meals</h1>

      {/* Recipe search (from DB) */}
      <div className="mb-4">
        <label className="mb-1 text-sm font-medium" htmlFor="food-search">
          Recipe Search (from DB)
        </label>
        <input
          id="food-search"
          type="text"
          placeholder="🔎 Search recipes (e.g. omelette, chicken, tomato...)"
          value={foodQuery}
          onChange={(e) => setFoodQuery(e.target.value)}
          className="border rounded px-3 py-2 w-full"
          autoComplete="off"
        />
        {foodResults.length > 0 && (
          <ul className="bg-white border rounded shadow mt-2 max-h-60 overflow-y-auto z-10">
            {foodResults.slice(0, 10).map((item) => (
              <li
                key={item.id}
                className="px-3 py-2 cursor-pointer hover:bg-green-100"
                onClick={() => handlePickFood(item)}
              >
                <span className="font-medium">{item.title}</span>
                <span className="ml-2 text-xs text-gray-600">{item.description}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add Meal Form */}
      <form onSubmit={handleAddMeal} className="flex flex-wrap gap-2 mb-6">
        <div className="flex flex-col flex-1 min-w-[120px]">
          <label className="mb-1 text-sm font-medium" htmlFor="meal-name">
            Meal Name
          </label>
          <input
            id="meal-name"
            name="name"
            placeholder="Meal name"
            value={newMeal.name}
            onChange={(e) => setNewMeal((m) => ({ ...m, name: e.target.value }))}
            className="border rounded px-3 py-2"
            autoComplete="off"
          />
        </div>

        <div className="flex flex-col w-28">
          <label className="mb-1 text-sm font-medium" htmlFor="calories">
            Calories
          </label>
          <input
            id="calories"
            name="calories"
            type="number"
            min={0}
            value={newMeal.calories}
            onChange={(e) => setNewMeal((m) => ({ ...m, calories: e.target.value }))}
            className="border rounded px-3 py-2"
            required
          />
        </div>

        <div className="flex flex-col w-24">
          <label className="mb-1 text-sm font-medium" htmlFor="protein">
            Protein (g)
          </label>
          <input
            id="protein"
            name="protein"
            type="number"
            min={0}
            value={newMeal.protein}
            onChange={(e) => setNewMeal((m) => ({ ...m, protein: e.target.value }))}
            className="border rounded px-3 py-2"
            required
          />
        </div>

        <div className="flex flex-col w-24">
          <label className="mb-1 text-sm font-medium" htmlFor="carbs">
            Carbs (g)
          </label>
          <input
            id="carbs"
            name="carbs"
            type="number"
            min={0}
            value={newMeal.carbs}
            onChange={(e) => setNewMeal((m) => ({ ...m, carbs: e.target.value }))}
            className="border rounded px-3 py-2"
            required
          />
        </div>

        <div className="flex flex-col w-24">
          <label className="mb-1 text-sm font-medium" htmlFor="fat">
            Fat (g)
          </label>
          <input
            id="fat"
            name="fat"
            type="number"
            min={0}
            value={newMeal.fat}
            onChange={(e) => setNewMeal((m) => ({ ...m, fat: e.target.value }))}
            className="border rounded px-3 py-2"
            required
          />
        </div>

        <div className="flex flex-col w-20">
          <label className="mb-1 text-sm font-medium" htmlFor="portion">
            Portion
          </label>
          <input
            id="portion"
            name="portion"
            placeholder="e.g. 1, 1.5"
            type="number"
            step="0.01"
            min={0.1}
            value={portion}
            onChange={(e) => setPortion(e.target.value.replace(",", "."))}
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
