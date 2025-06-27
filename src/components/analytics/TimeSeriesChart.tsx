import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TimeSeriesData } from "@/services/analyticsService";
import { format } from "date-fns";

interface TimeSeriesChartProps {
  data: TimeSeriesData[];
}

export default function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  const chartData = data.map(item => ({
    ...item,
    date: format(new Date(item.date), "MMM dd"),
  }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="tasksCreated" 
            stackId="1" 
            stroke="#8884d8" 
            fill="#8884d8" 
            name="Tasks Created"
          />
          <Area 
            type="monotone" 
            dataKey="tasksCompleted" 
            stackId="1" 
            stroke="#82ca9d" 
            fill="#82ca9d" 
            name="Tasks Completed"
          />
           <Area 
            type="monotone" 
            dataKey="activeEmployees" 
            stackId="2" 
            stroke="#ffc658" 
            fill="#ffc658" 
            name="Active Employees"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
