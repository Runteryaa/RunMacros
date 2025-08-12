"use client";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getDatabase, ref, get, set } from "firebase/database";
import { app } from "@/lib/firebase";

/* ---------------- Types ---------------- */
type Settings = {
  // App settings
  mealCategories: string[];
  waterGoalL: number; // liters
  rounding: { enabled: boolean; decimals: number };
  defaultPortionStep: number;
  theme: "system" | "light" | "dark";
  language: "en" | "tr";
  // Profile (stored in /settings too, like your old page)
  sex: "male" | "female";
  age: string;    // keep as string in UI, cast to number on save
  height: string; // cm
  weight: string; // kg
  activity: "sedentary" | "light" | "moderate" | "active" | "very";
  goalType: "lose" | "maintain" | "gain";
};

type GoalsForm = {
  calories: string;
  carbs: string;
  fat: string;
  protein: string;
};

/* --------------- Defaults --------------- */
const DEFAULT_SETTINGS: Settings = {
  mealCategories: ["Breakfast", "Lunch", "Dinner", "Snack"],
  waterGoalL: 2.5,
  rounding: { enabled: true, decimals: 0 },
  defaultPortionStep: 1,
  theme: "system",
  language: "en",

  sex: "male",
  age: "",
  height: "",
  weight: "",
  activity: "moderate",
  goalType: "maintain",
};

const DEFAULT_GOALS: GoalsForm = {
  calories: "",
  carbs: "",
  fat: "",
  protein: "",
};

const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very: 1.9,
} as const;

/* --------------- Component --------------- */
export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [goals, setGoals] = useState<GoalsForm>(DEFAULT_GOALS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  /* Auth */
  useEffect(() => {
    const auth = getAuth(app);
    return onAuthStateChanged(auth, setUser);
  }, []);

  /* Load settings + goals */
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const db = getDatabase(app);

      const [settingsSnap, goalsSnap] = await Promise.all([
        get(ref(db, `users/${user.uid}/settings`)),
        get(ref(db, `users/${user.uid}/goals`)),
      ]);

      if (settingsSnap.exists()) {
        // Merge to keep future-safe defaults
        setSettings({ ...DEFAULT_SETTINGS, ...settingsSnap.val() });
      } else {
        setSettings(DEFAULT_SETTINGS);
      }

      if (goalsSnap.exists()) {
        const g = goalsSnap.val();
        setGoals({
          calories: g.calories?.toString() ?? "",
          carbs: g.carbs?.toString() ?? "",
          fat: g.fat?.toString() ?? "",
          protein: g.protein?.toString() ?? "",
        });
      } else {
        setGoals(DEFAULT_GOALS);
      }

      setLoading(false);
    })();
  }, [user]);

  /* --------- Save all --------- */
  async function saveAll() {
    if (!user) return;
    setSaving(true);
    const db = getDatabase(app);

    // Save goals (numbers)
    const goalsPayload = {
      calories: Number(goals.calories || 0),
      carbs: Number(goals.carbs || 0),
      fat: Number(goals.fat || 0),
      protein: Number(goals.protein || 0),
    };
    await set(ref(db, `users/${user.uid}/goals`), goalsPayload);

    // Save settings (coerce numeric strings)
    const settingsPayload = {
      ...settings,
      age: settings.age,         // keep string in DB if you prefer; or Number(settings.age)
      height: settings.height,   // same note as above
      weight: settings.weight,
    };
    await set(ref(db, `users/${user.uid}/settings`), settingsPayload);

    setSaving(false);
    setMsg("Settings saved");
    setTimeout(() => setMsg(null), 1500);
  }

  /* --------- Macro calculator --------- */
  function calculateFromProfile(e: React.FormEvent) {
    e.preventDefault();
    const { sex, age, height, weight, activity, goalType } = settings;
    if (!sex || !age || !height || !weight) {
      setMsg("Please fill all calculator fields!");
      setTimeout(() => setMsg(null), 2000);
      return;
    }
    const w = Number(weight);
    const h = Number(height);
    const a = Number(age);
    const factor = ACTIVITY_FACTORS[activity];

    let bmr = 10 * w + 6.25 * h - 5 * a + (sex === "male" ? 5 : -161);
    let calories = Math.round(bmr * factor);
    if (goalType === "lose") calories -= 500;
    if (goalType === "gain") calories += 350;

    const protein = Math.round((calories * 0.3) / 4);
    const carbs = Math.round((calories * 0.4) / 4);
    const fat = Math.round((calories * 0.3) / 9);

    setGoals({
      calories: String(Math.max(0, calories)),
      protein: String(Math.max(0, protein)),
      carbs: String(Math.max(0, carbs)),
      fat: String(Math.max(0, fat)),
    });

    setMsg("Calculated based on your data! You can tweak the numbers below.");
    setTimeout(() => setMsg(null), 2000);
  }

  /* --------- Meal categories helpers --------- */
  function addCategory() {
    const name = prompt("New meal category name:");
    if (!name) return;
    setSettings(s => ({
      ...s,
      mealCategories: [...s.mealCategories, name.trim()].filter(Boolean),
    }));
  }
  function removeCategory(idx: number) {
    setSettings(s => ({
      ...s,
      mealCategories: s.mealCategories.filter((_, i) => i !== idx),
    }));
  }
  function renameCategory(idx: number, val: string) {
    setSettings(s => {
      const arr = [...s.mealCategories];
      arr[idx] = val;
      return { ...s, mealCategories: arr };
    });
  }
  function moveCategory(idx: number, dir: -1 | 1) {
    setSettings(s => {
      const arr = [...s.mealCategories];
      const to = idx + dir;
      if (to < 0 || to >= arr.length) return s;
      [arr[idx], arr[to]] = [arr[to], arr[idx]];
      return { ...s, mealCategories: arr };
    });
  }

  if (!user) return <div className="p-8">Please log in</div>;
  if (loading) return <div className="p-8">Loading settings…</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-[var(--bg)] text-[var(--text)] rounded-2xl shadow-[var(--border)] mt-6 space-y-8">
      {/* Header / Save */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <button
          onClick={saveAll}
          disabled={saving}
          className={`px-4 py-2 rounded text-white ${saving ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}`}
        >
          {saving ? "Saving…" : "Apply"}
        </button>
      </div>
      {msg && <div className="text-green-600">{msg}</div>}

      {/* Profile & Macro Calculator */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Profile & Macro Calculator</h2>
        <form className="flex flex-wrap gap-3" onSubmit={calculateFromProfile}>
          <label className="flex flex-col">
            <span className="mb-1 text-sm font-medium">Gender</span>
            <select
              value={settings.sex}
              onChange={e => setSettings(s => ({ ...s, sex: e.target.value as Settings["sex"] }))}
              className="border rounded px-3 py-2 card"
              required
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>

          <label className="flex flex-col">
            <span className="mb-1 text-sm font-medium">Age</span>
            <input
              value={settings.age}
              onChange={e => setSettings(s => ({ ...s, age: e.target.value }))}
              placeholder="Age"
              type="number"
              min={10}
              max={120}
              className="border rounded px-3 py-2 w-32 card"
              required
            />
          </label>

          <label className="flex flex-col">
            <span className="mb-1 text-sm font-medium">Height (cm)</span>
            <input
              value={settings.height}
              onChange={e => setSettings(s => ({ ...s, height: e.target.value }))}
              placeholder="Height (cm)"
              type="number"
              min={100}
              max={250}
              className="border rounded px-3 py-2 w-36"
              required
            />
          </label>

          <label className="flex flex-col">
            <span className="mb-1 text-sm font-medium">Weight (kg)</span>
            <input
              value={settings.weight}
              onChange={e => setSettings(s => ({ ...s, weight: e.target.value }))}
              placeholder="Weight (kg)"
              type="number"
              min={30}
              max={250}
              className="border rounded px-3 py-2 w-36"
              required
            />
          </label>

          <label className="flex flex-col">
            <span className="mb-1 text-sm font-medium">Activity</span>
            <select
              value={settings.activity}
              onChange={e => setSettings(s => ({ ...s, activity: e.target.value as Settings["activity"] }))}
              className="border rounded px-3 py-2"
            >
              <option value="sedentary">Sedentary</option>
              <option value="light">Lightly active</option>
              <option value="moderate">Moderately active</option>
              <option value="active">Very active</option>
              <option value="very">Super active</option>
            </select>
          </label>

          <label className="flex flex-col">
            <span className="mb-1 text-sm font-medium">Goal</span>
            <select
              value={settings.goalType}
              onChange={e => setSettings(s => ({ ...s, goalType: e.target.value as Settings["goalType"] }))}
              className="border rounded px-3 py-2"
            >
              <option value="lose">Lose weight</option>
              <option value="maintain">Maintain</option>
              <option value="gain">Gain weight</option>
            </select>
          </label>

          <button
            type="submit"
            className="mt-2 px-6 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition font-semibold"
          >
            Calculate Macros
          </button>
        </form>
      </section>

      {/* Goals (manual tweak & save) */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Macro Targets</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <label className="flex flex-col">
            <span className="mb-1 text-sm font-medium">Calories (kcal)</span>
            <input
              name="calories"
              type="number"
              min={100}
              max={10000}
              value={goals.calories}
              onChange={(e) => setGoals(g => ({ ...g, calories: e.target.value }))}
              className="border rounded px-3 py-2"
              required
            />
          </label>
          <label className="flex flex-col">
            <span className="mb-1 text-sm font-medium">Carbs (g)</span>
            <input
              name="carbs"
              type="number"
              min={0}
              max={1000}
              value={goals.carbs}
              onChange={(e) => setGoals(g => ({ ...g, carbs: e.target.value }))}
              className="border rounded px-3 py-2"
              required
            />
          </label>
          <label className="flex flex-col">
            <span className="mb-1 text-sm font-medium">Protein (g)</span>
            <input
              name="protein"
              type="number"
              min={0}
              max={1000}
              value={goals.protein}
              onChange={(e) => setGoals(g => ({ ...g, protein: e.target.value }))}
              className="border rounded px-3 py-2"
              required
            />
          </label>
          <label className="flex flex-col">
            <span className="mb-1 text-sm font-medium">Fat (g)</span>
            <input
              name="fat"
              type="number"
              min={0}
              max={1000}
              value={goals.fat}
              onChange={(e) => setGoals(g => ({ ...g, fat: e.target.value }))}
              className="border rounded px-3 py-2"
              required
            />
          </label>
        </div>
      </section>

      {/* App Settings */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">App Settings</h2>

        {/* Meal Categories */}
        <div>
          <h3 className="font-semibold mb-2">Meal Categories</h3>
          <p className="text-sm text-gray-600 mb-3">These show up when adding foods in the Meals page.</p>
          <div className="space-y-2">
            {settings.mealCategories.map((cat, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  className="border rounded px-3 py-2 flex-1"
                  value={cat}
                  onChange={(e) => renameCategory(idx, e.target.value)}
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveCategory(idx, -1)}
                    className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
                    title="Move up"
                  >↑</button>
                  <button
                    type="button"
                    onClick={() => moveCategory(idx, 1)}
                    className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
                    title="Move down"
                  >↓</button>
                  <button
                    type="button"
                    onClick={() => removeCategory(idx)}
                    className="px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                    title="Remove"
                  >✕</button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addCategory}
            className="mt-3 px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Add category
          </button>
        </div>

        {/* Water Goal (liters) */}
        <div>
          <h3 className="font-semibold mb-2">Water Goal</h3>
          <div className="flex items-end gap-3">
            <label className="flex flex-col">
              <span className="mb-1 text-sm font-medium">Daily Goal (liters)</span>
              <input
                type="number"
                step="0.25"
                min={0}
                className="border rounded px-3 py-2 w-40"
                value={settings.waterGoalL}
                onChange={(e) =>
                  setSettings(s => ({ ...s, waterGoalL: Math.max(0, Number(e.target.value || 0)) }))
                }
              />
            </label>
          </div>
        </div>

        {/* Portion step */}
        <div>
          <h3 className="font-semibold mb-2">Portion</h3>
          <div className="flex items-end gap-3">
            <label className="flex flex-col">
              <span className="mb-1 text-sm font-medium">Default Portion Step</span>
              <input
                type="number"
                step="0.5"
                min={0.5}
                className="border rounded px-3 py-2 w-32"
                value={settings.defaultPortionStep}
                onChange={(e) =>
                  setSettings(s => ({ ...s, defaultPortionStep: Math.max(0.1, Number(e.target.value || 0.1)) }))
                }
              />
            </label>
          </div>
        </div>

        {/* Theme & Language */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <label className="flex flex-col">
            <span className="mb-1 text-sm font-medium">Theme</span>
            <select
              className="border rounded px-3 py-2"
              value={settings.theme}
              onChange={(e) => setSettings(s => ({ ...s, theme: e.target.value as Settings["theme"] }))}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
            <span className="text-xs text-gray-500 mt-1">You can tie this to an HTML class toggle.</span>
          </label>

          <label className="flex flex-col">
            <span className="mb-1 text-sm font-medium">Language</span>
            <select
              className="border rounded px-3 py-2"
              value={settings.language}
              onChange={(e) => setSettings(s => ({ ...s, language: e.target.value as Settings["language"] }))}
            >
              <option value="en">English</option>
              <option value="tr">Türkçe</option>
            </select>
          </label>
        </div>
      </section>
    </div>
  );
}
