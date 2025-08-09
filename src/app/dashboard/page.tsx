"use client";
import { useState } from "react";
import MacroDashboard from "@/components/MacroDashboard";

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  return (
    <div>
      <MacroDashboard/>
    </div>
  );
}
