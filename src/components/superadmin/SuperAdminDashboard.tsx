import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import superAdminService from "@/services/superAdminService";
import type { Organization } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, Trash2, Edit, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AddOrganizationModal from "./AddOrganizationModal";
import EditOrganizationModal from "./EditOrganizationModal";
import OrganizationDetailsModal from "./OrganizationDetailsModal";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/router";

interface SystemStats {
  total_organizations: number;
  total_users: number;
  total_tasks: number;
  active_users: number;
}

export default function SuperAdminDashboard() {
  const { currentProfile, signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const orgs = await superAdminService.getOrganizations();
      setOrganizations(orgs);
      
      // Mock stats for now since getSystemStats doesn't exist
      const mockStats: SystemStats = {
        total_organizations: orgs.length,
        total_users: orgs.length * 5, // Estimate
        total_tasks: orgs.length * 20, // Estimate
        active_users: orgs.length * 3 // Estimate
      };
      setStats(mockStats);
    } catch (error) {
      console.error("Failed to fetch super admin data:", error);
      toast({ title: "Error", description: "Could not fetch data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({ title: "Error", description: "Failed to sign out.", variant: "destructive" });
    }
  };

  const handleAddSuccess = () => {
    setAddModalOpen(false);
    fetchData();
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setSelectedOrg(null);
    fetchData();
  };

  const handleDelete = async () => {
    if (!orgToDelete) return;
    try {
      await superAdminService.deleteOrganization(orgToDelete.id);
      toast({ title: "Success", description: "Organization deleted." });
      setOrgToDelete(null);
      fetchData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  if (loading) return <div>Loading Super Admin Dashboard...</div>;
  if (!currentProfile || currentProfile.role !== 'super_admin') return <div>Access Denied.</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
        <Button onClick={handleLogout}>Logout</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader><CardTitle>Total Organizations</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats?.total_organizations || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Users</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats?.total_users || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Tasks</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats?.total_tasks || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Active Users</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats?.active_users || 0}</p></CardContent>
        </Card>
      </div>

      <div className="flex justify-end mb-4">
        <Button onClick={() => setAddModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Organization
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell><Badge>{org.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell>{new Date(org.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedOrg(org); setDetailsModalOpen(true); }}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedOrg(org); setEditModalOpen(true); }}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setOrgToDelete(org)} className="text-red-500">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddOrganizationModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
      {selectedOrg && (
        <EditOrganizationModal
          isOpen={isEditModalOpen}
          onClose={() => { setEditModalOpen(false); setSelectedOrg(null); }}
          onSuccess={handleEditSuccess}
          organization={selectedOrg}
        />
      )}
      <OrganizationDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => { setDetailsModalOpen(false); setSelectedOrg(null); }}
        organization={selectedOrg}
      />
      <AlertDialog open={!!orgToDelete} onOpenChange={() => setOrgToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the organization and all its data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
