"use client";
import { useEffect, useState, useCallback } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";
import { app } from "@/lib/firebase";
import MacroDonut from "@/components/MacroDonut";
import { ChevronLeft, ChevronRight } from "lucide-react";

/* ---------- utils: robust local date helpers (no DST skips) ---------- */
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

/* ---------- tiny date bar ---------- */
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
      {/* Backward */}
      <button
        type="button"
        onClick={() => onChangeDate(addDays(date, -1))}
        className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300"
        aria-label="Previous day"
      >
        ◀
      </button>

      <span className="font-semibold select-none">{formatDateLabel(date)}</span>

      {/* Forward */}
      <button
        type="button"
        onClick={() => !isToday && onChangeDate(addDays(date, 1))}
        className={`px-3 py-2 rounded bg-gray-200 ${
          isToday
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-gray-300"
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

export default function MacroDashboard() {
  const [date, setDate] = useState<string>(toYMD(new Date()));
  const [macroData, setMacroData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadForDate = useCallback(async (uid: string, ymd: string) => {
    const db = getDatabase(app);
    const dayRef = ref(db, `users/${uid}/days/${ymd}`);
    const goalsRef = ref(db, `users/${uid}/goals`);
    const [daySnap, goalsSnap] = await Promise.all([get(dayRef), get(goalsRef)]);
    return {
      calories: {
        value: daySnap.child("calories").exists() ? daySnap.child("calories").val() : 0,
        target: goalsSnap.child("calories").exists() ? goalsSnap.child("calories").val() : 2000,
      },
      carbs: {
        value: daySnap.child("carbs").exists() ? daySnap.child("carbs").val() : 0,
        target: goalsSnap.child("carbs").exists() ? goalsSnap.child("carbs").val() : 250,
      },
      protein: {
        value: daySnap.child("protein").exists() ? daySnap.child("protein").val() : 0,
        target: goalsSnap.child("protein").exists() ? goalsSnap.child("protein").val() : 150,
      },
      fat: {
        value: daySnap.child("fat").exists() ? daySnap.child("fat").val() : 0,
        target: goalsSnap.child("fat").exists() ? goalsSnap.child("fat").val() : 65,
      },
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

  if (loading || !macroData)
    return <div className="flex flex-col items-center w-full">
      <DateBar date={date} onChangeDate={setDate} />
      <div className="flex justify-center items-center h-[240px] w-full">Loading...</div>
    </div>;

  return (
    <div className="w-full">
      <DateBar date={date} onChangeDate={setDate} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full justify-items-center">
        {MACROS.map(({ key, label, color, unit }) => (
          <MacroDonut
            key={key}
            value={macroData[key].value}
            target={macroData[key].target}
            label={label}
            color={color}
            unit={unit}
          />
        ))}
      </div>
    </div>
  );
}
