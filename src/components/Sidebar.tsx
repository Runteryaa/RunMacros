"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Menu, X } from "lucide-react";

export default function Sidebar() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const menuItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/meals", label: "Meals" },
    { href: "/recipes", label: "Recipes" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <>
      {/* Mobile open button (only when closed) */}
      {!open && (
        <button
          className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded bg-gray-900 text-white"
          onClick={() => setOpen(true)}
        >
          <Menu size={20} />
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 h-full lg:h-auto w-56 bg-gray-900 text-white p-4 flex flex-col transform transition-transform duration-300 z-40
        ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Header inside sidebar */}
        <div className="flex items-center justify-between mb-8">
          <div className="font-bold text-lg">RunMacros</div>
          {/* Close button inside sidebar */}
          <button
            className="lg:hidden p-1 rounded hover:bg-gray-800"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:bg-gray-800 px-2 py-1 rounded"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 mt-4 hover:bg-gray-800 px-2 py-1 rounded"
              onClick={() => setOpen(false)}
            >
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="h-8 rounded-full border-2 border-blue-600"
                />
              )}
              {user.displayName || user.email}
            </Link>
          ) : (
            <Link
              href="/profile"
              className="mt-4 hover:bg-gray-800 px-2 py-1 rounded"
              onClick={() => setOpen(false)}
            >
              Login
            </Link>
          )}
        </nav>
      </aside>
    </>
  );
}
