import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CheckSquare, 
  Clock, 
  Download,
  RefreshCw
} from "lucide-react";
// import { analyticsService } from "@/services/analyticsService";
import { useAuth } from "@/contexts/AuthContext";

interface AnalyticsData {
  overview: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    totalEmployees: number;
    activeEmployees: number;
    completionRate: number;
    avgCompletionTime: number;
  };
  taskTrends: Array<{
    date: string;
    completed: number;
    created: number;
    pending: number;
  }>;
  employeePerformance: Array<{
    name: string;
    completed: number;
    pending: number;
    overdue: number;
    efficiency: number;
  }>;
  tasksByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  locationAnalytics: Array<{
    location: string;
    taskCount: number;
    completionRate: number;
  }>;
  timeAnalytics: Array<{
    hour: number;
    taskCount: number;
    completionRate: number;
  }>;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function CompleteAnalyticsDashboard() {
  const { currentProfile } = useAuth();
  const [metrics, setMetrics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalyticsData = useCallback(async () => {
    if (!currentProfile?.organization_id) return;

    try {
      setLoading(true);
      
      // Mock data for now since the analytics service methods don't exist yet
      const mockData: AnalyticsData = {
        overview: {
          totalTasks: 150,
          completedTasks: 120,
          pendingTasks: 25,
          overdueTasks: 5,
          totalEmployees: 45,
          activeEmployees: 42,
          completionRate: 80,
          avgCompletionTime: 4.5
        },
        taskTrends: [
          { date: "2024-01-01", completed: 10, created: 15, pending: 5 },
          { date: "2024-01-02", completed: 12, created: 18, pending: 6 },
          { date: "2024-01-03", completed: 8, created: 12, pending: 4 }
        ],
        employeePerformance: [
          { name: "John Doe", completed: 25, pending: 3, overdue: 1, efficiency: 89 },
          { name: "Jane Smith", completed: 30, pending: 2, overdue: 0, efficiency: 94 },
          { name: "Mike Johnson", completed: 20, pending: 5, overdue: 2, efficiency: 74 }
        ],
        tasksByStatus: [
          { status: "Completed", count: 120, percentage: 80 },
          { status: "Pending", count: 25, percentage: 17 },
          { status: "Overdue", count: 5, percentage: 3 }
        ],
        locationAnalytics: [
          { location: "Downtown", taskCount: 45, completionRate: 85 },
          { location: "Suburbs", taskCount: 35, completionRate: 78 },
          { location: "Industrial", taskCount: 70, completionRate: 82 }
        ],
        timeAnalytics: [
          { hour: 8, taskCount: 15, completionRate: 90 },
          { hour: 10, taskCount: 25, completionRate: 85 },
          { hour: 14, taskCount: 30, completionRate: 88 },
          { hour: 16, taskCount: 20, completionRate: 75 }
        ]
      };

      setMetrics(mockData);
    } catch (error) {
      console.error("Error loading analytics ", error);
    } finally {
      setLoading(false);
    }
  }, [currentProfile?.organization_id]);

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, loadAnalyticsData]);

  const refreshData = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const exportData = () => {
    if (!metrics) return;
    
    const csvContent = `
Task Overview
Total Tasks,${metrics.overview.totalTasks}
Completed Tasks,${metrics.overview.completedTasks}
Pending Tasks,${metrics.overview.pendingTasks}
Overdue Tasks,${metrics.overview.overdueTasks}
Completion Rate,${metrics.overview.completionRate}%

Employee Performance
${metrics.employeePerformance.map(emp => 
  `${emp.name},${emp.completed},${emp.pending},${emp.overdue},${emp.efficiency}%`
).join("\n")}
    `;

    const blob = new Blob([csvContent.trim()], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics_${dateRange}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights and performance metrics</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <Button variant="outline" onClick={refreshData} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          
          <Button onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.overview.totalTasks}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+12% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.overview.completionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+5% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Employees</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.overview.activeEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2 flex items-center">
              <span className="text-sm text-gray-600">of {metrics.overview.totalEmployees} total</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Completion Time</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.overview.avgCompletionTime}h</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2 flex items-center">
              <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">-2h from last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="trends">Task Trends</TabsTrigger>
          <TabsTrigger value="performance">Employee Performance</TabsTrigger>
          <TabsTrigger value="status">Task Status</TabsTrigger>
          <TabsTrigger value="location">Location Analytics</TabsTrigger>
          <TabsTrigger value="time">Time Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Task Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={metrics.taskTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="completed" stackId="1" stroke="#00C49F" fill="#00C49F" />
                  <Area type="monotone" dataKey="pending" stackId="1" stroke="#FFBB28" fill="#FFBB28" />
                  <Area type="monotone" dataKey="created" stackId="1" stroke="#0088FE" fill="#0088FE" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Employee Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={metrics.employeePerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="#00C49F" />
                  <Bar dataKey="pending" fill="#FFBB28" />
                  <Bar dataKey="overdue" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tasks by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.tasksByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percentage }) => `${status} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {metrics.tasksByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.tasksByStatus.map((status, index) => (
                    <div key={status.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{status.status}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{status.count} tasks</Badge>
                        <span className="text-sm text-gray-600">{status.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="location">
          <Card>
            <CardHeader>
              <CardTitle>Location-based Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={metrics.locationAnalytics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="location" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="taskCount" fill="#0088FE" />
                  <Bar dataKey="completionRate" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time">
          <Card>
            <CardHeader>
              <CardTitle>Time-based Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={metrics.timeAnalytics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="taskCount" stroke="#0088FE" strokeWidth={2} />
                  <Line type="monotone" dataKey="completionRate" stroke="#00C49F" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
