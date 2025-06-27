import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { EmployeePerformance } from "@/services/analyticsService";
import { TooltipProps } from "recharts";
import { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";

interface EmployeePerformanceChartProps {
  data: EmployeePerformance[];
}

export default function EmployeePerformanceChart({ data }: EmployeePerformanceChartProps) {
  const chartData = data.map(employee => ({
    name: employee.employeeName.split(" ")[0], // First name only for better display
    assigned: employee.tasksAssigned,
    completed: employee.tasksCompleted,
    completionRate: employee.completionRate,
    hours: employee.totalWorkingHours
  }));

  const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      const employee = data.find(e => e.employeeName.split(" ")[0] === label);
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{employee?.employeeName}</p>
          <p className="text-sm text-blue-600">
            Tasks Assigned: {payload[0]?.value}
          </p>
          <p className="text-sm text-green-600">
            Tasks Completed: {payload[1]?.value}
          </p>
          <p className="text-sm text-purple-600">
            Completion Rate: {employee?.completionRate.toFixed(1)}%
          </p>
          <p className="text-sm text-orange-600">
            Total Hours: {employee?.totalWorkingHours.toFixed(1)}h
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="assigned" 
            fill="#3b82f6" 
            name="Tasks Assigned"
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            dataKey="completed" 
            fill="#22c55e" 
            name="Tasks Completed"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
