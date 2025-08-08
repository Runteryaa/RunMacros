import type { Metadata } from "next";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import RouteLoader from "@/components/RouteLoader";
import Head from "@/components/Head";
import "./globals.css";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>< Head /></head>
      <body className="flex min-h-screen">
        < RouteLoader />
        < Sidebar />
        <main className="flex-1 bg-gray-100 p-6">{children}</main>
      </body>
    </html>
  );
}
