
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { LocationAnalytics } from "@/services/analyticsService";

interface LocationAnalyticsChartProps {
  data: LocationAnalytics[];
}

export default function LocationAnalyticsChart({ data }: LocationAnalyticsChartProps) {
  const chartData = data.map(location => ({
    name: location.location.length > 15 
      ? location.location.substring(0, 15) + "..." 
      : location.location,
    fullName: location.location,
    taskCount: location.taskCount,
    completionRate: location.completionRate,
    avgDistance: location.averageDistance,
    avgDuration: location.averageDuration
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const location = chartData.find(l => l.name === label);
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{location?.fullName}</p>
          <p className="text-sm text-blue-600">
            Total Tasks: {payload[0]?.value}
          </p>
          <p className="text-sm text-green-600">
            Completion Rate: {location?.completionRate.toFixed(1)}%
          </p>
          <p className="text-sm text-purple-600">
            Avg Distance: {location?.avgDistance.toFixed(1)} km
          </p>
          <p className="text-sm text-orange-600">
            Avg Duration: {location?.avgDuration.toFixed(0)} min
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
            height={80}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="taskCount" 
            fill="#3b82f6" 
            name="Task Count"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
