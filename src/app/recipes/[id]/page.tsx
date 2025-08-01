export const runtime = 'edge';

import RecipeDetailClient from "@/components/RecipeDetailClient";

export default function RecipeDetailPage({ params }: any) {
  return <RecipeDetailClient recipeId={params.id} />;
}
