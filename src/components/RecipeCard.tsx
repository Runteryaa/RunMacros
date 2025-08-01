"use client";
import Link from "next/link";

type Props = {
  id: string;
  title: string;
  description: string;
  image: string;
  calories: number;
};

export default function RecipeCard({ id, title, description, image, calories }: Props) {
  return (
    <Link href={`/recipes/${id}`} className="hover:scale-[1.03] transition-transform">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col w-80">
        <img src={image} alt={title} className="w-full h-44 object-cover" />
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold">{title}</h3>
            <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold">
              {calories} kcal
            </span>
          </div>
          <p className="text-gray-600 text-sm flex-1">{description}</p>
        </div>
      </div>
    </Link>
  );
}
