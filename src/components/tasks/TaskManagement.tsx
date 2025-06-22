import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge"; // Removed unused import
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// Removed MapPin, Clock, User, Calendar as they are not used directly here
import { Plus, Search, Filter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Task } from "@/types";
import TaskForm from "./TaskForm";
import TaskCard from "./TaskCard";

export default function TaskManagement() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Mock tasks data
  const mockTasks: Task[] = [
    {
      id: "1",
      title: "Equipment Installation",
      description: "Install new HVAC system at client location",
      type: "Installation",
      location: {
        address: "123 Business Ave, City, State 12345",
        latitude: 40.7128,
        longitude: -74.0060
      },
      clientInfo: {
        name: "ABC Corporation",
        contact: "+1234567890",
        email: "contact@abc.com"
      },
      deadline: new Date("2024-01-15T10:00:00"),
      status: "assigned",
      assignedTo: "emp_1",
      assignedBy: "mgr_1",
      organizationId: "org_1",
      priority: "high",
      estimatedDuration: 240,
      photos: [],
      createdAt: new Date("2024-01-10T09:00:00"),
      updatedAt: new Date("2024-01-10T09:00:00")
    },
    {
      id: "2",
      title: "Maintenance Check",
      description: "Routine maintenance and inspection",
      type: "Maintenance",
      location: {
        address: "456 Industrial Blvd, City, State 12345",
        latitude: 40.7589,
        longitude: -73.9851
      },
      clientInfo: {
        name: "XYZ Limited",
        contact: "+1234567891",
        email: "service@xyz.com"
      },
      deadline: new Date("2024-01-12T14:00:00"),
      status: "in_progress",
      assignedTo: "emp_2",
      assignedBy: "mgr_1",
      organizationId: "org_1",
      priority: "medium",
      estimatedDuration: 120,
      photos: [],
      createdAt: new Date("2024-01-08T11:00:00"),
      updatedAt: new Date("2024-01-11T13:30:00")
    },
    {
      id: "3",
      title: "Site Inspection",
      description: "Safety and compliance inspection",
      type: "Inspection",
      location: {
        address: "789 Commercial St, City, State 12345",
        latitude: 40.7505,
        longitude: -73.9934
      },
      clientInfo: {
        name: "Tech Solutions Inc",
        contact: "+1234567892",
        email: "admin@techsolutions.com"
      },
      deadline: new Date("2024-01-20T09:00:00"),
      status: "completed",
      assignedTo: "emp_3",
      assignedBy: "mgr_1",
      organizationId: "org_1",
      priority: "low",
      estimatedDuration: 180,
      actualDuration: 165,
      photos: [],
      createdAt: new Date("2024-01-05T08:00:00"),
      updatedAt: new Date("2024-01-18T16:45:00")
    }
  ];

  const filteredTasks = mockTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.clientInfo.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Removed getStatusColor function as it's not used in this component
  // Removed getPriorityColor function as it's not used in this component

  const canCreateTasks = user?.role === "org_admin" || user?.role === "task_manager";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Task Management</h2>
          <p className="text-gray-600 mt-1">Manage and track field service tasks</p>
        </div>
        {canCreateTasks && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new field service task
                </DialogDescription>
              </DialogHeader>
              <TaskForm onClose={() => setIsCreateDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search tasks or clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {mockTasks.filter(t => t.status === "assigned").length}
            </div>
            <p className="text-sm text-gray-600">Assigned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {mockTasks.filter(t => t.status === "in_progress").length}
            </div>
            <p className="text-sm text-gray-600">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {mockTasks.filter(t => t.status === "completed").length}
            </div>
            <p className="text-sm text-gray-600">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {mockTasks.filter(t => new Date(t.deadline) < new Date() && t.status !== "completed").length}
            </div>
            <p className="text-sm text-gray-600">Overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">No tasks found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
