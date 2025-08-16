"use client";
import { useEffect, useMemo, useState } from "react";
import { getDatabase, ref, get } from "firebase/database";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";
import RecipeComments from "@/components/RecipeComments";

/** ---------- Types ---------- */
type Ingredient = {
  name: string;
  amount: string;
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
};

type Recipe = {
  title?: string;
  description?: string;
  image?: string;
  calories?: number;
  macros?: { carbs?: number; protein?: number; fat?: number };
  ingredients?: Ingredient[];
  instructions?: string[];
  // allow extra fields
  [k: string]: any;
};

/** Tiny inline placeholder so we never 404 on /placeholder.png */
const FALLBACK_DATA_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='600'>
      <rect width='100%' height='100%' fill='#e5e7eb'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
        font-family='sans-serif' font-size='32' fill='#6b7280'>No Image</text>
    </svg>`
  );

/** RTDB REST fallback (Cloudflare sometimes breaks WebChannel). */
async function rtdbRestGet<T>(path: string): Promise<T | null> {
  // You must set this in your env: NEXT_PUBLIC_FIREBASE_DB_URL
  // e.g. https://<your-db>.firebaseio.com OR https://<your-db>-default-rtdb.firebaseio.com
  const base = process.env.NEXT_PUBLIC_FIREBASE_DB_URL;
  if (!base) return null;

  const auth = getAuth(app);
  const user = auth.currentUser;
  let token = "";
  try {
    token = user ? await user.getIdToken() : "";
  } catch {}

  const url = `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}.json${token ? `?auth=${token}` : ""}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** safe number helper */
function n(v: any, d = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : d;
}

export default function RecipeDetailClient({ recipeId }: { recipeId: string }) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);

      // 1) Try SDK
      try {
        const db = getDatabase(app);
        const snap = await get(ref(db, `recipes/${recipeId}`));
        if (mounted && snap.exists()) {
          setRecipe(snap.val() as Recipe);
          setLoading(false);
          return;
        }
      } catch {
        // fall through to REST
      }

      // 2) REST fallback (works well on Cloudflare Pages)
      const viaRest = await rtdbRestGet<Recipe>(`recipes/${recipeId}`);
      if (mounted) {
        setRecipe(viaRest ?? null);
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [recipeId]);

  const safeMacros = {
    carbs: n(recipe?.macros?.carbs),
    protein: n(recipe?.macros?.protein),
    fat: n(recipe?.macros?.fat),
  };

  const hasIngredients = Array.isArray(recipe?.ingredients) && recipe!.ingredients!.length > 0;

  const ingredientTotals = useMemo(() => {
    if (!hasIngredients) return { calories: 0, carbs: 0, protein: 0, fat: 0 };
    return (recipe!.ingredients as Ingredient[]).reduce(
      (acc, ing) => ({
        calories: acc.calories + n(ing.calories),
        carbs: acc.carbs + n(ing.carbs),
        protein: acc.protein + n(ing.protein),
        fat: acc.fat + n(ing.fat),
      }),
      { calories: 0, carbs: 0, protein: 0, fat: 0 }
    );
  }, [hasIngredients, recipe]);

  if (loading) return <div className="p-8">Loading…</div>;
  if (!recipe) return <div className="p-8">Recipe not found.</div>;

  const title = recipe.title || "Untitled Recipe";
  const description = recipe.description || "";
  const img = recipe.image || FALLBACK_DATA_URL;
  const calories = n(recipe.calories);
  const instructions: string[] = Array.isArray(recipe.instructions) ? recipe.instructions : [];

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-2xl shadow-lg mt-8">
      <img
        src={img}
        alt={title}
        className="w-full h-64 object-cover rounded-xl mb-6"
        onError={(e) => ((e.currentTarget.src = FALLBACK_DATA_URL))}
      />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">{title}</h1>
        <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full font-semibold text-lg">
          {calories} kcal
        </span>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Carbs: {safeMacros.carbs}g</span>
        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Protein: {safeMacros.protein}g</span>
        <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded">Fat: {safeMacros.fat}g</span>
      </div>

      {description && <p className="text-gray-700 mb-6">{description}</p>}

      {hasIngredients && (
        <>
          <h2 className="text-xl font-semibold mb-2">Ingredients & Macros</h2>
          <table className="w-full text-sm mb-6">
            <thead>
              <tr>
                <th className="text-left">Ingredient</th>
                <th className="text-left">Amount</th>
                <th>Calories</th>
                <th>Carbs</th>
                <th>Protein</th>
                <th>Fat</th>
              </tr>
            </thead>
            <tbody>
              {recipe!.ingredients!.map((ing, idx) => (
                <tr key={idx} className="even:bg-gray-50">
                  <td>{ing.name}</td>
                  <td>{ing.amount}</td>
                  <td className="text-center">{n(ing.calories)}</td>
                  <td className="text-center">{n(ing.carbs)}</td>
                  <td className="text-center">{n(ing.protein)}</td>
                  <td className="text-center">{n(ing.fat)}</td>
                </tr>
              ))}
              <tr className="font-bold border-t">
                <td colSpan={2}>Total</td>
                <td className="text-center">{ingredientTotals.calories}</td>
                <td className="text-center">{ingredientTotals.carbs}</td>
                <td className="text-center">{ingredientTotals.protein}</td>
                <td className="text-center">{ingredientTotals.fat}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {instructions.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-2">Instructions</h2>
          <ol className="list-decimal ml-8">
            {instructions.map((step, idx) => (
              <li key={idx} className="mb-2">
                {step}
              </li>
            ))}
          </ol>
        </>
      )}

      {/* RTDB-based comments (also hardened below) */}
      <RecipeComments recipeId={recipeId} />
    </div>
  );
}
