"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getDatabase, ref, get } from "firebase/database";
import { app } from "@/lib/firebase";
import RecipeComments from "@/components/RecipeComments";

type Ingredient = {
  name: string;
  amount: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
};
type Recipe = {
  title: string;
  description: string;
  image: string;
  calories: number;
  macros: { carbs: number; protein: number; fat: number };
  ingredients: Ingredient[];
  instructions: string[];
};

function sumMacros(ingredients: Ingredient[]) {
  return ingredients.reduce(
    (totals, ing) => ({
      calories: totals.calories + (ing.calories || 0),
      carbs: totals.carbs + (ing.carbs || 0),
      protein: totals.protein + (ing.protein || 0),
      fat: totals.fat + (ing.fat || 0)
    }),
    { calories: 0, carbs: 0, protein: 0, fat: 0 }
  );
}

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    const db = getDatabase(app);
    const recipeRef = ref(db, `recipes/${id}`);
    get(recipeRef).then((snap) => {
      if (snap.exists()) setRecipe(snap.val());
    });
  }, [id]);

  if (!recipe) return <div className="p-8">Loading...</div>;

  const ingredientMacroTotal = recipe.ingredients ? sumMacros(recipe.ingredients) : null;

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-2xl shadow-lg mt-8">
      <img src={recipe.image} alt={recipe.title} className="w-full h-64 object-cover rounded-xl mb-6" />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">{recipe.title}</h1>
        <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full font-semibold text-lg">
          {recipe.calories} kcal
        </span>
      </div>
      <div className="flex gap-4 mb-6">
        <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded">Carbs: {recipe.macros.carbs}g</span>
        <span className="bg-yellow-100 text-yellow-600 px-2 py-1 rounded">Protein: {recipe.macros.protein}g</span>
        <span className="bg-pink-100 text-pink-600 px-2 py-1 rounded">Fat: {recipe.macros.fat}g</span>
      </div>
      <p className="text-gray-700 mb-6">{recipe.description}</p>
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
          {recipe.ingredients.map((ing, idx) => (
            <tr key={idx}>
              <td>{ing.name}</td>
              <td>{ing.amount}</td>
              <td className="text-center">{ing.calories}</td>
              <td className="text-center">{ing.carbs}</td>
              <td className="text-center">{ing.protein}</td>
              <td className="text-center">{ing.fat}</td>
            </tr>
          ))}
          {ingredientMacroTotal && (
            <tr className="font-bold border-t">
              <td colSpan={2}>Total</td>
              <td className="text-center">{ingredientMacroTotal.calories}</td>
              <td className="text-center">{ingredientMacroTotal.carbs}</td>
              <td className="text-center">{ingredientMacroTotal.protein}</td>
              <td className="text-center">{ingredientMacroTotal.fat}</td>
            </tr>
          )}
        </tbody>
      </table>
      <h2 className="text-xl font-semibold mb-2">Instructions</h2>
      <ol className="list-decimal ml-8">
        {recipe.instructions.map((step, idx) => <li key={idx} className="mb-2">{step}</li>)}
      </ol>
      <RecipeComments recipeId={id as string} />
    </div>
  );
}
