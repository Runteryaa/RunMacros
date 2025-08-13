"use client";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, push, onValue, serverTimestamp } from "firebase/database";
import { app } from "@/lib/firebase";

type Comment = {
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  timestamp: number;
};

export default function RecipeComments({ recipeId }: { recipeId: string }) {
  const [user, setUser] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  // Listen for auth state
  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  // Listen for comments
  useEffect(() => {
    if (!recipeId) return;
    const db = getDatabase(app);
    const commentsRef = ref(db, `recipes/${recipeId}/comments`);
    const unsubscribe = onValue(commentsRef, (snap) => {
    const val = snap.val();
    const arr: Comment[] = val
    ? (Object.values(val) as Comment[]).sort((a, b) => b.timestamp - a.timestamp)
    : [];

      setComments(arr);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [recipeId]);

  // Add comment
  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !text.trim()) return;
    const db = getDatabase(app);
    const commentsRef = ref(db, `recipes/${recipeId}/comments`);
    await push(commentsRef, {
      userId: user.uid,
      userName: user.displayName || user.email || "User",
      userPhoto: user.photoURL || "",
      text: text.trim(),
      timestamp: Date.now()
    });
    setText("");
  }

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold mb-2">Comments</h2>
      {user ? (
        <form onSubmit={submitComment} className="flex gap-2 mb-4">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            className="flex-1 border rounded px-3 py-2 card"
            placeholder="Leave a comment..."
            maxLength={300}
            required
          />
          <button type="submit" className="card btn text-white rounded px-4 py-2">Send</button>
        </form>
      ) : (
        <div className="mb-4 text-gray-500">Sign in to comment.</div>
      )}
      {loading ? (
        <div>Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-gray-500">No comments yet.</div>
      ) : (
        <ul className="space-y-4">
          {comments.map((c, idx) => (
            <li key={idx} className="flex items-start gap-3 card rounded-xl px-4 py-3">
              <img
                src={c.userPhoto || "https://ui-avatars.com/api/?name=" + encodeURIComponent(c.userName)}
                alt={c.userName}
                className="w-8 h-8 rounded-full border"
              />
              <div>
                <div className="font-semibold">{c.userName}</div>
                <div className="text-gray-700">{c.text}</div>
                <div className="text-xs text-gray-500">
                  {c.timestamp && new Date(c.timestamp).toLocaleString()}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
