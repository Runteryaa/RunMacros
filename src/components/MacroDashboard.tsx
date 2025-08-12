"use client";
import { useEffect, useState, useCallback } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";
import { app } from "@/lib/firebase";
import MacroDonut from "@/components/MacroDonut";

/* ---------- utils: robust local date helpers ---------- */
function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function parseYMD(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date();
  dt.setFullYear(y, (m ?? 1) - 1, d ?? 1);
  dt.setHours(0, 0, 0, 0);
  return dt;
}
function addDays(ymd: string, delta: number) {
  const d = parseYMD(ymd);
  d.setDate(d.getDate() + delta);
  return toYMD(d);
}
function formatDateLabel(ymd: string) {
  const d = parseYMD(ymd);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ---------- Date bar ---------- */
function DateBar({
  date,
  onChangeDate,
}: {
  date: string;
  onChangeDate: (val: string) => void;
}) {
  const today = toYMD(new Date());
  const isToday = date === today;

  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      <button
        type="button"
        onClick={() => onChangeDate(addDays(date, -1))}
        className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300"
        aria-label="Previous day"
      >
        ◀
      </button>

      <span className="font-semibold select-none">{formatDateLabel(date)}</span>

      <button
        type="button"
        onClick={() => !isToday && onChangeDate(addDays(date, 1))}
        className={`px-3 py-2 rounded bg-gray-200 ${
          isToday ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-300"
        }`}
        aria-label="Next day"
        disabled={isToday}
      >
        ▶
      </button>
    </div>
  );
}

/* ---------- macro config ---------- */
const MACROS = [
  { key: "calories", label: "Calories", color: "#2563eb", unit: "" },
  { key: "carbs", label: "Carbs", color: "#f472b6", unit: "g" },
  { key: "protein", label: "Protein", color: "#22d3ee", unit: "g" },
  { key: "fat", label: "Fat", color: "#facc15", unit: "g" },
] as const;

type Totals = { calories: number; carbs: number; protein: number; fat: number };

export default function MacroDashboard() {
  const [date, setDate] = useState<string>(toYMD(new Date()));
  const [macroData, setMacroData] = useState<Record<string, { value: number; target: number }> | null>(null);
  const [loading, setLoading] = useState(true);

  const loadForDate = useCallback(async (uid: string, ymd: string) => {
    const db = getDatabase(app);

    // goals
    const goalsSnap = await get(ref(db, `users/${uid}/goals`));
    const goals: Totals = {
      calories: Number(goalsSnap.child("calories").val() ?? 2000),
      carbs: Number(goalsSnap.child("carbs").val() ?? 250),
      protein: Number(goalsSnap.child("protein").val() ?? 150),
      fat: Number(goalsSnap.child("fat").val() ?? 65),
    };

    // sum nested meals -> categories -> foods -> macros
    const mealsSnap = await get(ref(db, `users/${uid}/days/${ymd}/meals`));
    const totals: Totals = { calories: 0, carbs: 0, protein: 0, fat: 0 };

    if (mealsSnap.exists()) {
      const categories = mealsSnap.val() as Record<
        string,
        Record<string, { macros?: Partial<Totals> }>
      >;
      for (const cat of Object.keys(categories || {})) {
        const foods = categories[cat] || {};
        for (const foodName of Object.keys(foods)) {
          const m = foods[foodName]?.macros || {};
          totals.calories += Number(m.calories ?? 0);
          totals.carbs += Number(m.carbs ?? 0);
          totals.protein += Number(m.protein ?? 0);
          totals.fat += Number(m.fat ?? 0);
        }
      }
    } else {
      // legacy fallback: flat totals at day root
      const daySnap = await get(ref(db, `users/${uid}/days/${ymd}`));
      totals.calories = Number(daySnap.child("calories").val() ?? 0);
      totals.carbs = Number(daySnap.child("carbs").val() ?? 0);
      totals.protein = Number(daySnap.child("protein").val() ?? 0);
      totals.fat = Number(daySnap.child("fat").val() ?? 0);
    }

    return {
      calories: { value: totals.calories, target: goals.calories },
      carbs: { value: totals.carbs, target: goals.carbs },
      protein: { value: totals.protein, target: goals.protein },
      fat: { value: totals.fat, target: goals.fat },
    };
  }, []);

  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setLoading(true);
      const data = await loadForDate(user.uid, date);
      setMacroData(data);
      setLoading(false);
    });
    return () => unsub();
  }, [date, loadForDate]);

  if (loading || !macroData) {
    return (
      <div className="w-full">
        <DateBar date={date} onChangeDate={setDate} />
        <div className="flex justify-center items-center h-[240px] w-full">
          <span className="animate-pulse text-gray-500">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <DateBar date={date} onChangeDate={setDate} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full justify-items-center">
        {MACROS.map(({ key, label, color, unit }) => (
          <MacroDonut
            key={key}
            value={(macroData as any)[key].value}
            target={(macroData as any)[key].target}
            label={label}
            color={color}
            unit={unit}
          />
        ))}
      </div>
    </div>
  );
}
