"use client";
import { useEffect, useState } from "react";
import { getDatabase, ref, onValue, push } from "firebase/database";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";

/** REST helper (for Cloudflare Pages write fallback) */
async function rtdbRestPost(path: string, value: any) {
  const base = process.env.NEXT_PUBLIC_FIREBASE_DB_URL;
  if (!base) throw new Error("Missing NEXT_PUBLIC_FIREBASE_DB_URL");

  const auth = getAuth(app);
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : "";

  const url = `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}.json${token ? `?auth=${token}` : ""}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
  if (!res.ok) throw new Error(`REST write failed (${res.status})`);
  return res.json();
}

type Comment = {
  uid: string;
  displayName?: string | null;
  photoURL?: string | null;
  text: string;
  createdAt: number;
};

export default function RecipeComments({ recipeId }: { recipeId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // live reads (if CF streaming breaks, user will at least see current snapshot)
  useEffect(() => {
    const db = getDatabase(app);
    const commentsRef = ref(db, `recipes/${recipeId}/comments`);
    const off = onValue(
      commentsRef,
      (snap) => {
        const val = snap.val() || {};
        const arr = Object.values(val) as Comment[];
        // sort by createdAt asc
        arr.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        setComments(arr);
      },
      () => {
        // swallow transport errors, keep UI alive
      }
    );
    return () => off();
  }, [recipeId]);

  async function send() {
    setError(null);
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) {
      setError("Please log in to comment.");
      return;
    }
    if (!text.trim()) return;

    const payload: Comment = {
      uid: user.uid,
      displayName: user.displayName ?? user.email ?? "Anonymous",
      photoURL: user.photoURL ?? null,
      text: text.trim(),
      createdAt: Date.now(),
    };

    setSending(true);
    try {
      // Try normal SDK first
      const db = getDatabase(app);
      await push(ref(db, `recipes/${recipeId}/comments`), payload);
      setText("");
    } catch {
      // Fallback to REST (helps on Cloudflare Pages)
      try {
        await rtdbRestPost(`recipes/${recipeId}/comments`, payload);
        setText("");
      } catch (e: any) {
        setError(e?.message || "Failed to send comment.");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-3">Comments</h3>

      <div className="space-y-3 mb-4">
        {comments.length === 0 ? (
          <div className="text-sm text-gray-500">No comments yet.</div>
        ) : (
          comments.map((c, i) => (
            <div key={i} className="flex gap-3 items-start">
              <img
                src={c.photoURL || "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBA=="} // 1px noop
                alt=""
                className="w-8 h-8 rounded-full border border-gray-200 object-cover"
              />
              <div>
                <div className="text-sm font-medium">{c.displayName || "User"}</div>
                <div className="text-sm">{c.text}</div>
                <div className="text-xs text-gray-500">
                  {new Date(c.createdAt || Date.now()).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          className="border rounded card px-3 py-2 flex-1"
          placeholder="Write a comment…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          onClick={send}
          disabled={sending}
          className={`px-3 py-2 btn rounded text-white ${sending ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </div>

      {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
    </div>
  );
}
