"use client";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { app } from "@/lib/firebase";
import MacroDashboard from "@/components/MacroDashboard";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  const caloriesTaken = 1230;
  const caloriesGoal = 2000;

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, u => setUser(u));
    return () => unsubscribe();
  }, []);

  if (!user) {
    return <div>Not logged in...</div>;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold">Welcome, {user.displayName || user.email || "User"}!</h1>
      {user.photoURL && (
        <img
          src={user.photoURL}
          alt="Profile"
          className="w-20 h-20 rounded-full border-2 border-blue-600"
        />
      )}
      <p className="text-gray-700">This is your dashboard.</p>
      < MacroDashboard />
    </div>
  );
}
