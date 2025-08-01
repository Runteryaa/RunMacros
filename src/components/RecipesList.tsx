"use client";
import { useEffect, useState } from "react";
import { getDatabase, ref, get } from "firebase/database";
import { app } from "@/lib/firebase";
import RecipeCard from "./RecipeCard";

type Recipe = {
  title: string;
  description: string;
  image: string;
  calories: number;
};

export default function RecipesList() {
  const [recipes, setRecipes] = useState<Record<string, Recipe>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase(app);
    const recipesRef = ref(db, "recipes");
    get(recipesRef).then(snapshot => {
      if (snapshot.exists()) setRecipes(snapshot.val());
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading recipes...</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 py-4">
      {Object.entries(recipes).map(([id, recipe]) => (
        <RecipeCard key={id} id={id} {...recipe} />
      ))}
    </div>
  );
}
