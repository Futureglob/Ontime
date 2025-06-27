import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { EmployeePerformance } from "@/services/analyticsService";
import { TooltipProps } from "recharts";
import { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";

interface EmployeePerformanceChartProps {
  data: EmployeePerformance[];
}

const EmployeePerformanceChart: React.FC<EmployeePerformanceChartProps> = ({ data }) => {
  const chartData = data.map(employee => ({
    name: employee.name,
    completed: employee.completed,
    pending: employee.pending,
    overdue: employee.overdue,
    efficiency: employee.efficiency,
  }));

  const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      const employee = chartData.find(e => e.name === label);
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{employee?.name}</p>
          <p className="text-sm text-green-600">
            Completed: {payload[0]?.value}
          </p>
          <p className="text-sm text-orange-600">
            Pending: {payload[1]?.value}
          </p>
          <p className="text-sm text-red-600">
            Overdue: {payload[2]?.value}
          </p>
          <p className="text-sm text-blue-600">
            Efficiency: {employee?.efficiency.toFixed(1)}%
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
            dataKey="completed" 
            fill="#22c55e" 
            name="Completed"
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            dataKey="pending" 
            fill="#f59e0b" 
            name="Pending"
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            dataKey="overdue" 
            fill="#ef4444" 
            name="Overdue"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default EmployeePerformanceChart;
