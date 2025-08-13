"use client";
import { useState } from "react";
import RecipeList from "@/components/RecipesList";
import RecipeGenerator from "@/components/RecipeGenerator";

export default function RecipesPage() {
  const [showGen, setShowGen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">My Recipes</h1>
        <button
          onClick={() => setShowGen(v => !v)}
          className={`px-4 py-2 btn rounded ${showGen ? "bg-gray-200 text-gray-800" : "bg-green-600 text-white hover:bg-green-700"}`}
        >
          {showGen ? "Close Generator" : "Create Recipe"}
        </button>
      </div>

      {/* Generator (toggle) */}
      {showGen && (
        <div className="mb-6">
          <RecipeGenerator />
        </div>
      )}

      {/* List */}
      <RecipeList />
    </div>
  );
}
