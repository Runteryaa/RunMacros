"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { app } from "@/lib/firebase";

export default function Sidebar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, u => setUser(u));
    return () => unsubscribe();
  }, []);

  return (
    <aside className="w-56 bg-gray-900 text-white flex flex-col p-4">
      <div className="font-bold text-lg mb-8">RunMacros</div>
      <nav className="flex flex-col gap-2">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/meals">Meals</Link>
        <Link href="/recipes">Recipes</Link>
        <Link href="/settings">Settings</Link>
        <Link href="/">.</Link>
        {user ? (
          <div>
            <Link className="flex  items-center gap-2" href="/dashboard">
                {user.photoURL && (
                    <img
                        src={user.photoURL}
                        alt="Profile"
                        className="h-8 rounded-full border-2 border-blue-600"
                    />
                )}
                {user.displayName || user.email}
            </Link>
          </div>
        ) : (
          <Link href="/profile">Login</Link>
        )}
      </nav>
    </aside>
  );
}
