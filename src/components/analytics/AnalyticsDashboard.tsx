
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarIcon, Download, Filter, TrendingUp, Users, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import analyticsService, { 
  TaskAnalytics, 
  EmployeePerformance, 
  LocationAnalytics, 
  TimeSeriesData,
  OrganizationMetrics 
} from "@/services/analyticsService";
import { useAuth } from "@/contexts/AuthContext";
import TaskAnalyticsChart from "./TaskAnalyticsChart";
import EmployeePerformanceChart from "./EmployeePerformanceChart";
import LocationAnalyticsChart from "./LocationAnalyticsChart";
import TimeSeriesChart from "./TimeSeriesChart";

interface AnalyticsDashboardProps {
  organizationId?: string;
}

export default function AnalyticsDashboard({ organizationId }: AnalyticsDashboardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  });

  const [taskAnalytics, setTaskAnalytics] = useState<TaskAnalytics | null>(null);
  const [employeePerformance, setEmployeePerformance] = useState<EmployeePerformance[]>([]);
  const [locationAnalytics, setLocationAnalytics] = useState<LocationAnalytics[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [organizationMetrics, setOrganizationMetrics] = useState<OrganizationMetrics | null>(null);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [
        taskData,
        employeeData,
        locationData,
        timeData,
        orgMetrics
      ] = await Promise.all([
        analyticsService.getTaskAnalytics(organizationId, dateRange),
        analyticsService.getEmployeePerformance(organizationId, dateRange),
        analyticsService.getLocationAnalytics(organizationId),
        analyticsService.getTimeSeriesData(organizationId, 30),
        analyticsService.getOrganizationMetrics(organizationId)
      ]);

      setTaskAnalytics(taskData);
      setEmployeePerformance(employeeData);
      setLocationAnalytics(locationData);
      setTimeSeriesData(timeData);
      setOrganizationMetrics(orgMetrics);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [organizationId, dateRange]);

  const exportData = () => {
    const data = {
      taskAnalytics,
      employeePerformance,
      locationAnalytics,
      timeSeriesData,
      organizationMetrics,
      generatedAt: new Date().toISOString(),
      dateRange
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-report-${format(new Date(), "yyyy-MM-dd")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.start ? (
                  dateRange.end ? (
                    <>
                      {format(dateRange.start, "LLL dd, y")} -{" "}
                      {format(dateRange.end, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.start, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.start}
                selected={{ from: dateRange.start, to: dateRange.end }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ start: range.from, end: range.to });
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Button onClick={exportData} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {organizationMetrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{organizationMetrics.totalEmployees}</div>
              <p className="text-xs text-muted-foreground">
                {organizationMetrics.activeEmployees} active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{organizationMetrics.totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                {organizationMetrics.completedTasks} completed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Working Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{organizationMetrics.totalWorkingHours.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                {organizationMetrics.averageTasksPerEmployee.toFixed(1)} avg tasks/employee
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Travel Distance</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{organizationMetrics.totalTravelDistance.toFixed(1)} km</div>
              <p className="text-xs text-muted-foreground">
                Total distance covered
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {taskAnalytics && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Task Overview</CardTitle>
                  <CardDescription>Current task status distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <TaskAnalyticsChart data={taskAnalytics} />
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Completion Rate</span>
                      <Badge variant="secondary">{taskAnalytics.completionRate.toFixed(1)}%</Badge>
                    </div>
                    <Progress value={taskAnalytics.completionRate} className="h-2" />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Avg. Completion Time</span>
                      <span>{taskAnalytics.averageCompletionTime.toFixed(1)} hours</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Task Status Breakdown</CardTitle>
                  <CardDescription>Detailed task status information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completed</span>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">{taskAnalytics.completedTasks}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">In Progress</span>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">{taskAnalytics.inProgressTasks}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pending</span>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">{taskAnalytics.pendingTasks}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overdue</span>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">{taskAnalytics.overdueTasks}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Performance</CardTitle>
              <CardDescription>Individual employee metrics and rankings</CardDescription>
            </CardHeader>
            <CardContent>
              <EmployeePerformanceChart data={employeePerformance} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Details</CardTitle>
              <CardDescription>Detailed employee performance breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employeePerformance.map((employee) => (
                  <div key={employee.employeeId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{employee.employeeName}</h4>
                      <Badge variant={employee.completionRate >= 80 ? "default" : "secondary"}>
                        {employee.completionRate.toFixed(1)}% completion
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Tasks Assigned</span>
                        <p className="font-medium">{employee.tasksAssigned}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tasks Completed</span>
                        <p className="font-medium">{employee.tasksCompleted}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg. Time</span>
                        <p className="font-medium">{employee.averageCompletionTime.toFixed(1)}h</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Hours</span>
                        <p className="font-medium">{employee.totalWorkingHours.toFixed(1)}h</p>
                      </div>
                    </div>
                    <Progress value={employee.completionRate} className="mt-2 h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Location Analytics</CardTitle>
              <CardDescription>Task distribution and performance by location</CardDescription>
            </CardHeader>
            <CardContent>
              <LocationAnalyticsChart data={locationAnalytics} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Time Series Analysis</CardTitle>
              <CardDescription>Task creation and completion trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <TimeSeriesChart data={timeSeriesData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
