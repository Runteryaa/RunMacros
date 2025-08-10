// components/RecipeGenerator.tsx
"use client";
import { useState, useMemo } from "react";
import { getDatabase, ref, set } from "firebase/database";
import { app } from "@/lib/firebase";

type Ingredient = {
  name: string;
  amount: string;
  calories: string | number;
  carbs: string | number;
  protein: string | number;
  fat: string | number;
};

function toNum(n: string | number) {
  const v = typeof n === "number" ? n : parseFloat(String(n).replace(",", "."));
  return Number.isFinite(v) ? v : 0;
}
function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function RecipeGenerator() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(""); // optional url
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: "", amount: "", calories: "", carbs: "", protein: "", fat: "" },
  ]);
  const [instructions, setInstructions] = useState<string>(""); // newline separated
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const totals = useMemo(() => {
    return ingredients.reduce(
      (t, i) => ({
        calories: t.calories + toNum(i.calories),
        carbs: t.carbs + toNum(i.carbs),
        protein: t.protein + toNum(i.protein),
        fat: t.fat + toNum(i.fat),
      }),
      { calories: 0, carbs: 0, protein: 0, fat: 0 }
    );
  }, [ingredients]);

  function updateIngredient(idx: number, key: keyof Ingredient, val: string) {
    setIngredients((arr) => {
      const copy = [...arr];
      copy[idx] = { ...copy[idx], [key]: val };
      return copy;
    });
  }

  function addRow() {
    setIngredients((arr) => [
      ...arr,
      { name: "", amount: "", calories: "", carbs: "", protein: "", fat: "" },
    ]);
  }

  function removeRow(i: number) {
    setIngredients((arr) => arr.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setMsg(null);
    if (!title.trim()) {
      setMsg("Please enter a title.");
      return;
    }

    // Build exactly your DB shape
    const recipeId = slugify(title) || `recipe-${Date.now()}`;
    const data = {
      title: title.trim(),
      description: description.trim(),
      image:
        image.trim() ||
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=60",
      calories: Math.round(totals.calories),
      macros: {
        carbs: Math.round(totals.carbs),
        protein: Math.round(totals.protein),
        fat: Math.round(totals.fat),
      },
      ingredients: ingredients
        .filter((i) => i.name.trim() || i.amount.trim())
        .map((i) => ({
          name: i.name.trim(),
          amount: i.amount.trim(),
          calories: toNum(i.calories),
          carbs: toNum(i.carbs),
          protein: toNum(i.protein),
          fat: toNum(i.fat),
        })),
      instructions: instructions
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      // comments will be added by the comments component later
    };

    setSaving(true);
    try {
      const db = getDatabase(app);
      await set(ref(db, `recipes/${recipeId}`), data);
      setMsg(`Saved ✅ (id: ${recipeId})`);
    } catch (e: any) {
      setMsg(`Save failed: ${e?.message || e}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow">
      <h2 className="text-2xl font-bold mb-4">Create Recipe</h2>

      {/* Basics */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 mb-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Title</label>
          <input
            className="border rounded px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Classic Omelette"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Image URL (optional)</label>
          <input
            className="border rounded px-3 py-2"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://…"
          />
        </div>
      </div>

      <div className="flex flex-col mb-6">
        <label className="text-sm font-medium mb-1">Description</label>
        <textarea
          className="border rounded px-3 py-2"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description of your recipe…"
        />
      </div>

      {/* Ingredients */}
      <h3 className="text-xl font-semibold mb-2">Ingredients</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border mb-3">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-2 py-2">Name</th>
              <th className="text-left px-2 py-2">Amount</th>
              <th className="px-2 py-2">Calories</th>
              <th className="px-2 py-2">Carbs</th>
              <th className="px-2 py-2">Protein</th>
              <th className="px-2 py-2">Fat</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ing, idx) => (
              <tr key={idx} className="even:bg-gray-50">
                <td className="px-2 py-1">
                  <input
                    className="border rounded px-2 py-1 w-full"
                    value={ing.name}
                    onChange={(e) => updateIngredient(idx, "name", e.target.value)}
                    placeholder="Eggs"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    className="border rounded px-2 py-1 w-full"
                    value={ing.amount}
                    onChange={(e) => updateIngredient(idx, "amount", e.target.value)}
                    placeholder="3 large"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-24 text-center"
                    value={String(ing.calories)}
                    onChange={(e) => updateIngredient(idx, "calories", e.target.value)}
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-20 text-center"
                    value={String(ing.carbs)}
                    onChange={(e) => updateIngredient(idx, "carbs", e.target.value)}
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-20 text-center"
                    value={String(ing.protein)}
                    onChange={(e) => updateIngredient(idx, "protein", e.target.value)}
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-20 text-center"
                    value={String(ing.fat)}
                    onChange={(e) => updateIngredient(idx, "fat", e.target.value)}
                  />
                </td>
                <td className="px-2 py-1">
                  <button
                    type="button"
                    className="text-red-600 hover:underline"
                    onClick={() => removeRow(idx)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            <tr className="font-semibold border-t">
              <td className="px-2 py-2" colSpan={2}>
                Totals
              </td>
              <td className="text-center px-2 py-2">{Math.round(totals.calories)}</td>
              <td className="text-center px-2 py-2">{Math.round(totals.carbs)}</td>
              <td className="text-center px-2 py-2">{Math.round(totals.protein)}</td>
              <td className="text-center px-2 py-2">{Math.round(totals.fat)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={addRow}
        className="mb-6 inline-flex items-center rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
      >
        + Add ingredient
      </button>

      {/* Instructions */}
      <div className="flex flex-col mb-6">
        <label className="text-sm font-medium mb-1">Instructions (one per line)</label>
        <textarea
          className="border rounded px-3 py-2"
          rows={6}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder={"Beat eggs with milk.\nMelt butter.\nCook and fold the omelette."}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-green-600 text-white rounded px-4 py-2 font-semibold disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save to DB"}
      </button>

      {msg && <div className="mt-3 text-sm">{msg}</div>}
    </div>
  );
}
