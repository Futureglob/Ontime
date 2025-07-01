import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import organizationManagementService from "@/services/organizationManagementService";
import type { OrganizationDetails, TaskSummary, OrganizationUser } from "@/services/organizationManagementService";
import type { Organization } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface OrganizationDetailsModalProps {
  organization: Organization | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrganizationDetailsModal({ organization, isOpen, onClose }: OrganizationDetailsModalProps) {
  const { toast } = useToast();
  const [details, setDetails] = useState<OrganizationDetails | null>(null);
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [tasks, setTasks] = useState<TaskSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (organization) {
        setLoading(true);
        try {
          const [detailsData, usersData, tasksData] = await Promise.all([
            organizationManagementService.getOrganizationDetails(organization.id),
            organizationManagementService.getEmployees(organization.id),
            organizationManagementService.getOrganizationTasks(organization.id),
          ]);
          setDetails(detailsData);
          setUsers(usersData as OrganizationUser[]);
          setTasks(tasksData);
        } catch (error: any) {
          toast({ title: "Error", description: `Failed to fetch details: ${error.message}`, variant: "destructive" });
        } finally {
          setLoading(false);
        }
      }
    };
    fetchDetails();
  }, [organization, toast]);

  if (!organization) return null;

  const renderInfoCard = (title: string, value: React.ReactNode, icon: React.ReactNode) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Organization Details: {organization.name}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p>Loading details...</p>
        ) : details ? (
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="pt-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {renderInfoCard("Users", details.userCount, null)}
                {renderInfoCard("Tasks", details.taskCount, null)}
                {renderInfoCard("Completed Tasks", details.completedTasks, null)}
                {renderInfoCard("Status", <Badge>{details.is_active ? "Active" : "Inactive"}</Badge>, null)}
              </div>
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Contact Information</h3>
                <p><strong>Contact Person:</strong> {details.contact_person}</p>
                <p><strong>Email:</strong> {details.contact_email}</p>
                <p><strong>Phone:</strong> {details.contact_phone}</p>
                <p><strong>Address:</strong> {details.address}</p>
              </div>
            </TabsContent>
            <TabsContent value="users">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>{user.full_name}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell><Badge>{user.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="tasks">
              {tasks ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {renderInfoCard("Total", tasks.total, null)}
                  {renderInfoCard("Completed", tasks.completed, null)}
                  {renderInfoCard("Pending", tasks.pending, null)}
                  {renderInfoCard("Overdue", tasks.overdue, null)}
                </div>
              ) : <p>No task summary available.</p>}
            </TabsContent>
          </Tabs>
        ) : (
          <p>Could not load organization details.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
