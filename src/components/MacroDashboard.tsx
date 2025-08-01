"use client";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";
import { app } from "@/lib/firebase";
import MacroDonut from "@/components/MacroDonut";

const MACROS = [
  { key: "calories", label: "Calories", color: "#2563eb", unit: "" },
  { key: "carbs", label: "Carbs", color: "#facc15", unit: "g" },
  { key: "protein", label: "Protein", color: "#22d3ee", unit: "g" },
  { key: "fat", label: "Fat", color: "#f472b6", unit: "g" }
];

export default function MacroDashboard() {
  const [macroData, setMacroData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const db = getDatabase(app);
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const today = new Date().toISOString().slice(0, 10);
      // Get all macros and goals
      const dayRef = ref(db, `users/${user.uid}/days/${today}`);
      const goalsRef = ref(db, `users/${user.uid}/goals`);
      const [daySnap, goalsSnap] = await Promise.all([get(dayRef), get(goalsRef)]);
      setMacroData({
        calories: {
          value: daySnap.child("calories").exists() ? daySnap.child("calories").val() : 0,
          target: goalsSnap.child("calories").exists() ? goalsSnap.child("calories").val() : 2000
        },
        carbs: {
          value: daySnap.child("carbs").exists() ? daySnap.child("carbs").val() : 0,
          target: goalsSnap.child("carbs").exists() ? goalsSnap.child("carbs").val() : 250
        },
        protein: {
          value: daySnap.child("protein").exists() ? daySnap.child("protein").val() : 0,
          target: goalsSnap.child("protein").exists() ? goalsSnap.child("protein").val() : 150
        },
        fat: {
          value: daySnap.child("fat").exists() ? daySnap.child("fat").val() : 0,
          target: goalsSnap.child("fat").exists() ? goalsSnap.child("fat").val() : 65
        }
      });
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading || !macroData)
    return <div className="flex justify-center items-center h-[240px] w-full">Loading...</div>;

  return (
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
  );
}
