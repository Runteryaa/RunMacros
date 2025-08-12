"use client";
import { useEffect, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, onValue, ref } from "firebase/database";
import { app } from "@/lib/firebase";

type Theme = "system" | "light" | "dark";

function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const mode =
    theme === "dark" ? "dark" :
    theme === "light" ? "light" :
    prefersDark ? "dark" : "light";

  const root = document.documentElement;
  if (mode === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  root.setAttribute("data-theme", mode);

  localStorage.setItem("theme", theme);
}

export default function ThemeClient() {
  // 👇 initialize with null, and make the type nullable
  const unsubRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    const auth = getAuth(app);
    const stopAuth = onAuthStateChanged(auth, (user) => {
      // clear previous RTDB listener if any
      unsubRef.current?.();
      unsubRef.current = null;

      if (!user) {
        const t = (localStorage.getItem("theme") as Theme) || "system";
        applyTheme(t);
        return;
      }

      const db = getDatabase(app);
      const settingsRef = ref(db, `users/${user.uid}/settings/theme`);

      // store the unsubscribe in the ref
      const off = onValue(settingsRef, (snap) => {
        const theme = (snap.val() as Theme) || "system";
        applyTheme(theme);
      });
      unsubRef.current = off;

      // react to system theme changes when using "system"
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => {
        const t = (localStorage.getItem("theme") as Theme) || "system";
        if (t === "system") applyTheme("system");
      };
      mql.addEventListener?.("change", onChange);

      // return cleanup for this auth change run
      return () => {
        mql.removeEventListener?.("change", onChange);
      };
    });

    // component unmount cleanup
    return () => {
      unsubRef.current?.();
      stopAuth();
    };
  }, []);

  return null;
}
