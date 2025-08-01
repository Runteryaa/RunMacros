export const runtime = 'edge';

import RecipeDetailClient from "@/components/RecipeDetailClient";

type PageProps = { params: { id: string } };

export default function RecipeDetailPage({ params }: PageProps) {
  return <RecipeDetailClient recipeId={params.id} />;
}
