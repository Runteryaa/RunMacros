import type { Metadata } from "next";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import RouteLoader from "@/components/RouteLoader";
import "./globals.css";


export const metadata: Metadata = {
  title: "RunMacros",
  description: "RunMacros - Your personal macro tracker with AI-powered recipe generation!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9944004180654653"
          crossOrigin="anonymous"
        ></script>
        </head>
      <body className="flex min-h-screen">
        < RouteLoader />
        < Sidebar />
        <main className="flex-1 bg-gray-100 p-6">{children}</main>
      </body>
    </html>
  );
}
