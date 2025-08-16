"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getDatabase, ref, onValue, off } from "firebase/database";
import { app } from "@/lib/firebase";

// Shape aligned to your DB: top-level calories, macros object with carbs/fat/protein
type RecipeRecord = {
  title?: string;
  description?: string;
  image?: string;
  calories?: number; // <- exists in your DB
  macros?: {
    carbs?: number;
    fat?: number;
    protein?: number;
  };
  ingredients?: Array<{
    name?: string;
    amount?: string;
    calories?: number;
    carbs?: number;
    protein?: number;
    fat?: number;
  }>;
  instructions?: string[];
  comments?: Record<string, unknown>;
};

type RecipeListItem = { id: string; data: RecipeRecord };

export default function RecipesList() {
  const [items, setItems] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase(app);
    const recipesRef = ref(db, "recipes");

    const unsub = onValue(
      recipesRef,
      (snap) => {
        if (!snap.exists()) {
          setItems([]);
          setLoading(false);
          return;
        }
        const val = snap.val() as Record<string, RecipeRecord>;
        const arr: RecipeListItem[] = Object.entries(val).map(([id, data]) => ({ id, data }));
        // newest first by key roughly; tweak if you store timestamps
        arr.reverse();
        setItems(arr);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => {
      off(recipesRef, "value", unsub);
    };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 bg-white rounded shadow animate-pulse">
            <div className="h-40 bg-gray-200 rounded mb-3" />
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <div className="text-gray-600">No recipes yet.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map(({ id, data }) => {
        const title = data?.title || "Untitled Recipe";
        const img = data?.image || "/placeholder.png";

        // Safely read numbers with fallbacks
        const calories = String(data?.calories ?? "x");

        const carbs = String(data?.macros?.carbs ?? "x");
        const protein = String(data?.macros?.protein ?? "x");
        const fat = String(data?.macros?.fat ?? "x");

        return (
          <Link
            key={id}
            href={`/recipes/${encodeURIComponent(id)}`}
            className="block card rounded-xl shadow hover:shadow-md transition overflow-hidden border"
          >
            <div className="w-full h-40 card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{title}</h3>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  {calories} kcal
                </span>
              </div>

              {/* Don’t render the macros object directly—render text */}
              <div className="text-sm mt-2">
                Macros: <span className="font-medium">P{protein}</span>{" / "}
                <span className="font-medium">C{carbs}</span>{" / "}
                <span className="font-medium">F{fat}</span>
              </div>

              {data?.description && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                  {data.description}
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
