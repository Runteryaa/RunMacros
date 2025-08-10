"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getDatabase, onValue, ref } from "firebase/database";
import { app } from "@/lib/firebase";

type Recipe = {
  title: string;
  servings: number;
  diet?: string;
  nutritionPerServing?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  createdAt?: number;
};

export default function RecipeList() {
  const [user, setUser] = useState<User | null>(null);
  const [recipes, setRecipes] = useState<{ id: string; data: Recipe }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  useEffect(() => {
    if (!user) {
      setRecipes([]);
      setLoading(false);
      return;
    }
    const db = getDatabase(app);
    const r = ref(db, `/recipes`);
    const unsub = onValue(r, (snap) => {
      const val = snap.val() || {};
      const list = Object.entries(val).map(([id, data]) => ({ id, data: data as Recipe }));
      // newest first
      list.sort((a, b) => (b.data.createdAt || 0) - (a.data.createdAt || 0));
      setRecipes(list);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);


  if (loading) {
    return <div className="text-gray-600">Loading recipes…</div>;
  }

  if (recipes.length === 0) {
    return <div className="text-gray-600">No recipes yet. Generate one to get started!</div>;
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {recipes.map(({ id, data }) => (
        <Link
          key={id}
          href={`/recipes/${id}`}
          className="block rounded-xl border bg-white hover:shadow transition p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-lg">{data.title || "Untitled Recipe"}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
              {data.diet || "none"}
            </span>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Servings: {data.servings ?? 1}
          </div>
          {data.nutritionPerServing && (
            <div className="mt-2 text-xs text-gray-700 grid grid-cols-4 gap-2">
              <div><b>{data.nutritionPerServing.calories ?? 0}</b> kcal</div>
              <div><b>{data.nutritionPerServing.protein ?? 0}</b> P</div>
              <div><b>{data.nutritionPerServing.carbs ?? 0}</b> C</div>
              <div><b>{data.nutritionPerServing.fat ?? 0}</b> F</div>
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
