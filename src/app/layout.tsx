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
      <body className="flex min-h-screen">
        < RouteLoader />
        < Sidebar />
        <main className="flex-1 bg-gray-100 p-6">{children}</main>
      </body>
    </html>
  );
}
