import React from "react";
import { TaskByStatus } from "@/services/analyticsService";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface TaskAnalyticsChartProps {
   TaskByStatus[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const TaskAnalyticsChart: React.FC<TaskAnalyticsChartProps> = ({ data }) => {
  const chartData = [
    {
      name: "Completed",
      value: data.completedTasks,
      color: COLORS.completed
    },
    {
      name: "In Progress",
      value: data.inProgressTasks,
      color: COLORS.inProgress
    },
    {
      name: "Pending",
      value: data.pendingTasks,
      color: COLORS.pending
    },
    {
      name: "Overdue",
      value: data.overdueTasks,
      color: COLORS.overdue
    }
  ].filter(item => item.value > 0);

  const renderCustomizedLabel = (props: { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number; }) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? "start" : "end"} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, name: string) => [value, name]}
            labelStyle={{ color: "#000" }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry) => (
              <span style={{ color: entry.color }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TaskAnalyticsChart;
