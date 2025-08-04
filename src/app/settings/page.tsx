"use client";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getDatabase, ref, get, set } from "firebase/database";
import { app } from "@/lib/firebase";

const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very: 1.9,
};

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [goals, setGoals] = useState({
    calories: "",
    carbs: "",
    fat: "",
    protein: "",
  });
  const [settings, setSettings] = useState({
    sex: "male",
    age: "",
    height: "",
    weight: "",
    activity: "moderate",
    goalType: "maintain",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  // Load user and both settings/goals from DB
  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const db = getDatabase(app);

    // Load goals
    const goalsRef = ref(db, `users/${user.uid}/goals`);
    get(goalsRef).then((snap) => {
      if (snap.exists()) {
        setGoals({
          calories: snap.val().calories?.toString() ?? "",
          carbs: snap.val().carbs?.toString() ?? "",
          fat: snap.val().fat?.toString() ?? "",
          protein: snap.val().protein?.toString() ?? "",
        });
      }
    });

    // Load settings (sex, age, etc)
    const settingsRef = ref(db, `users/${user.uid}/settings`);
    get(settingsRef).then((snap) => {
      if (snap.exists()) {
        setSettings({
          sex: snap.val().sex || "male",
          age: snap.val().age?.toString() ?? "",
          height: snap.val().height?.toString() ?? "",
          weight: snap.val().weight?.toString() ?? "",
          activity: snap.val().activity || "moderate",
          goalType: snap.val().goalType || "maintain",
        });
      }
      setLoading(false);
    });
  }, [user]);

  // Form change handlers
  function handleGoalsChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setGoals((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }
  function handleSettingsChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setSettings((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }

  // Macro calculator: uses settings state!
  function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    const { sex, age, height, weight, activity } = settings;
    if (!sex || !age || !height || !weight) {
      setMessage("Please fill all calculator fields!");
      return;
    }
    const w = Number(weight);
    const h = Number(height);
    const a = Number(age);
    const factor = ACTIVITY_FACTORS[activity as keyof typeof ACTIVITY_FACTORS];
    let bmr = 10 * w + 6.25 * h - 5 * a + (sex === "male" ? 5 : -161);
    let calories = Math.round(bmr * factor);
    if (settings.goalType === "lose") calories -= 500;
    if (settings.goalType === "gain") calories += 350;
    const protein = Math.round((calories * 0.3) / 4);
    const carbs = Math.round((calories * 0.4) / 4);
    const fat = Math.round((calories * 0.3) / 9);
    setGoals({
      ...goals,
      calories: String(calories),
      protein: String(protein),
      carbs: String(carbs),
      fat: String(fat),
      
    });
    setMessage("Calculated based on your data! You can tweak these numbers below.");
    setTimeout(() => setMessage(null), 2500);
  }

  // Save both goals and settings to DB
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const db = getDatabase(app);

    // Save goals
    const goalsRef = ref(db, `users/${user.uid}/goals`);
    const newGoals = {
      calories: Number(goals.calories),
      carbs: Number(goals.carbs),
      fat: Number(goals.fat),
      protein: Number(goals.protein),
    };
    await set(goalsRef, newGoals);

    // Save settings
    const settingsRef = ref(db, `users/${user.uid}/settings`);
    const newSettings = {
      sex: settings.sex,
      age: Number(settings.age),
      height: Number(settings.height),
      weight: Number(settings.weight),
      activity: settings.activity,
      goalType: settings.goalType,
    };
    await set(settingsRef, newSettings);

    setMessage("Goals and profile settings updated successfully!");
    setTimeout(() => setMessage(null), 2000);
  }

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return <div className="p-8">Please log in to change your settings.</div>;

  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded-xl shadow mt-10">
      <h1 className="text-2xl font-bold mb-6">Edit Your Nutrition Goals</h1>
      {/* Calculator and profile info */}
      <form className="flex flex-col gap-4 mb-8" onSubmit={handleCalculate}>
        <h2 className="font-semibold text-lg mb-1">Profile & Macro Calculator</h2>
        <div className="flex flex-wrap gap-3">
          <select name="sex" value={settings.sex} onChange={handleSettingsChange} className="border rounded px-3 py-2" required>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <input name="age" value={settings.age} onChange={handleSettingsChange} placeholder="Age" type="number" min={10} max={120} className="border rounded px-3 py-2" required />
          <input name="height" value={settings.height} onChange={handleSettingsChange} placeholder="Height (cm)" type="number" min={100} max={250} className="border rounded px-3 py-2" required />
          <input name="weight" value={settings.weight} onChange={handleSettingsChange} placeholder="Weight (kg)" type="number" min={30} max={250} className="border rounded px-3 py-2" required />
          <select name="activity" value={settings.activity} onChange={handleSettingsChange} className="border rounded px-3 py-2">
            <option value="sedentary">Sedentary</option>
            <option value="light">Lightly active</option>
            <option value="moderate">Moderately active</option>
            <option value="active">Very active</option>
            <option value="very">Super active</option>
          </select>
          <select name="goalType" value={settings.goalType} onChange={handleSettingsChange} className="border rounded px-3 py-2">
            <option value="lose">Lose weight</option>
            <option value="maintain">Maintain</option>
            <option value="gain">Gain weight</option>
          </select>
        </div>
        <button
          type="submit"
          className="mt-2 px-6 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition font-semibold"
        >
          Calculate Macros
        </button>
      </form>
      {/* Settings form */}
      <form className="flex flex-col gap-4" onSubmit={handleSave}>
        <label className="flex flex-col">
          <span>Calorie Target (kcal)</span>
          <input name="calories" type="number" min={100} max={10000} value={goals.calories} onChange={handleGoalsChange} className="border rounded px-3 py-2 mt-1" required />
        </label>
        <label className="flex flex-col">
          <span>Carbohydrate Target (g)</span>
          <input name="carbs" type="number" min={0} max={1000} value={goals.carbs} onChange={handleGoalsChange} className="border rounded px-3 py-2 mt-1" required />
        </label>
        <label className="flex flex-col">
          <span>Protein Target (g)</span>
          <input name="protein" type="number" min={0} max={1000} value={goals.protein} onChange={handleGoalsChange} className="border rounded px-3 py-2 mt-1" required />
        </label>
        <label className="flex flex-col">
          <span>Fat Target (g)</span>
          <input name="fat" type="number" min={0} max={1000} value={goals.fat} onChange={handleGoalsChange} className="border rounded px-3 py-2 mt-1" required />
        </label>
        <button
          type="submit"
          className="mt-4 px-6 py-3 rounded bg-green-500 text-white hover:bg-green-600 transition font-semibold"
        >
          Save Changes
        </button>
      </form>
      {message && <div className="mt-4 text-green-600">{message}</div>}
    </div>
  );
}
