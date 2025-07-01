import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import analyticsService from "@/services/analyticsService";
import type { TaskOverview, EmployeePerformance, LocationAnalytics } from "@/services/analyticsService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Users, Clock, Map, TrendingUp, Package } from "lucide-react";
import EmployeePerformanceChart from "./EmployeePerformanceChart";
import TaskAnalyticsChart from "./TaskAnalyticsChart";
import LocationAnalyticsChart from "./LocationAnalyticsChart";

export default function AnalyticsDashboard() {
  const { currentProfile } = useAuth();
  const [taskOverview, setTaskOverview] = useState<TaskOverview | null>(null);
  const [employeePerformance, setEmployeePerformance] = useState<EmployeePerformance[]>([]);
  const [locationAnalytics, setLocationAnalytics] = useState<LocationAnalytics[]>([]);
  const [orgStats, setOrgStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentProfile?.organization_id) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const [
            overviewData,
            performanceData,
            locationData,
            statsData
          ] = await Promise.all([
            analyticsService.getTaskOverview(currentProfile.organization_id),
            analyticsService.getEmployeePerformance(currentProfile.organization_id),
            analyticsService.getLocationAnalytics(currentProfile.organization_id),
            analyticsService.getOrganizationStats(currentProfile.organization_id)
          ]);
          setTaskOverview(overviewData);
          setEmployeePerformance(performanceData);
          setLocationAnalytics(locationData);
          setOrgStats(statsData);
        } catch (error) {
          console.error("Error fetching analytics data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [currentProfile]);

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  if (!taskOverview || !employeePerformance || !locationAnalytics || !orgStats) {
    return <div>Could not load analytics data.</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orgStats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">{orgStats.activeEmployees} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskOverview.totalTasks}</div>
            <p className="text-xs text-muted-foreground">{taskOverview.completedTasks} completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Work Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orgStats.totalWorkingHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Avg {orgStats.averageTasksPerEmployee.toFixed(1)} tasks/employee</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Travel Distance</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orgStats.totalTravelDistance.toFixed(1)} km</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Task Completion Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <span className="text-sm font-medium w-32">Completion Rate</span>
              <Progress value={taskOverview.completionRate} className="w-full" />
              <span className="text-sm font-semibold ml-4">{taskOverview.completionRate.toFixed(1)}%</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Average completion time: {taskOverview.avgCompletionTime.toFixed(1)} hours
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{taskOverview.completedTasks}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{taskOverview.inProgressTasks}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{taskOverview.pendingTasks}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{taskOverview.overdueTasks}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Task Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskAnalyticsChart data={taskOverview} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Employee Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Overdue</TableHead>
                  <TableHead>Efficiency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeePerformance.slice(0, 5).map((employee) => (
                  <TableRow key={employee.employeeId}>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.completed}</TableCell>
                    <TableCell>{employee.pending}</TableCell>
                    <TableCell className={employee.overdue > 0 ? "text-destructive" : ""}>
                      {employee.overdue}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{employee.efficiency.toFixed(1)}</span>
                        <TrendingUp className={`h-4 w-4 ${employee.efficiency > 5 ? "text-green-500" : "text-red-500"}`} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <EmployeePerformanceChart data={employeePerformance} />
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Location Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <LocationAnalyticsChart data={locationAnalytics} />
        </CardContent>
      </Card>
    </div>
  );
}
