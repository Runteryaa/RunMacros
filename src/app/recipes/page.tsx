"use client"
import RecipesList from "@/components/RecipesList";

export default function RecipesPage() {
  return (
    <div className="px-6 py-4">
      <h1 className="text-3xl font-bold mb-6">Recipes</h1>
      <RecipesList />
    </div>
  );
}
