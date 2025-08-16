"use client";
import { useEffect, useState, useCallback } from "react";
import { PieChart, Pie, Cell } from "recharts";

type Props = {
  value: number;
  target: number;
  label: string;
  color?: string;
  unit?: string;
};

function useThemeAttr(attr: string = "data-theme") {
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    const html = document.documentElement;

    const update = () => setValue(html.getAttribute(attr));
    update(); // initial

    const mo = new MutationObserver(() => update());
    mo.observe(html, { attributes: true, attributeFilter: [attr] });
    return () => mo.disconnect();
  }, [attr]);

  return value;
}


export default function MacroDonut({
  value,
  target,
  label,
  color = "#22c55e",
  unit = ""
}: Props) {
  const mainData = [
    { name: "Taken", value: Math.min(value, target) },
    { name: "Left", value: Math.max(target - value, 0) }
  ];

  const theme = useThemeAttr("data-theme");
  const isDark = theme === "dark";
  const theColor = isDark ? "#3c4963ff" : "#e5e7eb";
  const MAIN_COLORS = [color, theColor];

  const overflowValue = value > target ? value - target : 0;
  const overflowData = [
    { name: "Overflow", value: overflowValue },
    { name: "Rest", value: Math.max(target - overflowValue, 0) }
  ];

  const percent = value / target;

  return (
    <div className="flex flex-col items-center justify-center">
      <PieChart width={160} height={160}>
        <Pie
          data={mainData}
          cx="50%"
          cy="50%"
          innerRadius={48}
          outerRadius={72}
          startAngle={90}
          endAngle={-270}
          dataKey="value"
          stroke="none"
          animationDuration={500}
          cornerRadius={5}
        >
          {mainData.map((entry, idx) => (
            <Cell key={`cell-main-${idx}`} fill={MAIN_COLORS[idx % MAIN_COLORS.length]} />
          ))}
        </Pie>
        {overflowValue > 0 && (
          <Pie
            data={overflowData}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={72}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
            isAnimationActive={true}
            animationDuration={1500}
            cornerRadius={5}
          >
            <Cell fill={overflowValue >= target ? "#d33131ff" : "#f13c3cff"} />
            <Cell fill="transparent" />
          </Pie>
        )}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={22}
          fontWeight={700}
          fill="#747474ff"
        >
          {value}
          {unit}
        </text>
        <text
          x="50%"
          y="62%"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          fill="#666"
        >
          / {target}
          {unit}
        </text>
      </PieChart>
      <div className="mt-1 text-base font-semibold">{label}</div>
      <div className="text-xs text-gray-600">{Math.round(percent * 100)}% of goal</div>
    </div>
  );
}
