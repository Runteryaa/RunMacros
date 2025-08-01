"use client";
import { PieChart, Pie, Cell } from "recharts";

type Props = {
  value: number;
  target: number;
  label: string;
  color?: string; // main color
  unit?: string;
};

export default function MacroDonut({ value, target, label, color = "#22c55e", unit = "" }: Props) {
  const percent = Math.min(value / target, 1);
  const data = [
    { name: "Taken", value },
    { name: "Left", value: Math.max(target - value, 0) }
  ];
  const COLORS = [color, "#e5e7eb"]; // main, gray

  return (
    <div className="flex flex-col items-center justify-center">
      <PieChart width={160} height={160}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={48}
          outerRadius={72}
          startAngle={90}
          endAngle={-270}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, idx) => (
            <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Pie>
        {/* Centered number */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={22}
          fontWeight={700}
          fill="#111"
        >
          {value}{unit}
        </text>
        <text
          x="50%"
          y="62%"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          fill="#666"
        >
          / {target}{unit}
        </text>
      </PieChart>
      <div className="mt-1 text-base font-semibold">{label}</div>
      <div className="text-xs text-gray-600">{Math.round(percent * 100)}% of goal</div>
    </div>
  );
}
