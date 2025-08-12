import type { Metadata } from "next";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import RouteLoader from "@/components/RouteLoader";
import Head from "@/components/Head";
import ThemeClient from "@/components/ThemeClient";
import "./globals.css";

function InlineThemeScript() {
  // This runs before React hydrates, so no mismatch.
  const code = `
(function() {
  try {
    var stored = localStorage.getItem('theme'); // "light" | "dark" | "system" | null
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var mode = (stored === 'dark') ? 'dark'
             : (stored === 'light') ? 'light'
             : (prefersDark ? 'dark' : 'light');

    var root = document.documentElement;
    if (mode === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    root.setAttribute('data-theme', mode);
  } catch (e) {}
})();
`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        < Head />
        <InlineThemeScript />
      </head>
      <body className="flex min-h-screen">
        < ThemeClient />
        < RouteLoader />
        < Sidebar />
        <main className="flex-1 bg-[var(--bg)] text-[var(--text)] p-6">{children}</main>
      </body>
    </html>
  );
}
