import { useState, useEffect } from "react";
import organizationManagementService from "@/services/organizationManagementService";
import type { Profile } from "@/types/database";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import EmployeeForm from "./EmployeeForm";
import BulkEmployeeImport from "./BulkEmployeeImport";
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

export default function EmployeeManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Profile | undefined>(undefined);
  const [employeeToDelete, setEmployeeToDelete] = useState<Profile | null>(null);

  const fetchEmployees = async () => {
    if (profile?.organization_id) {
      try {
        setLoading(true);
        const data = await organizationManagementService.getEmployees(profile.organization_id);
        setEmployees(data);
      } catch (error) {
        console.error("Error fetching employees:", error);
        toast({ title: "Error", description: "Could not fetch employees.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [profile]);

  const handleFormSubmit = async (values: any) => {
    if (!profile?.organization_id) return;
    setIsSubmitting(true);
    try {
      if (selectedEmployee) {
        // Update logic
        const updates = {
          full_name: values.fullName,
          employee_id: values.employeeId,
          role: values.role,
          designation: values.designation,
          mobile_number: values.mobileNumber,
        };
        await organizationManagementService.updateEmployee(selectedEmployee.id, updates);
        toast({ title: "Success", description: "Employee updated successfully." });
      } else {
        // Create logic
        await organizationManagementService.addEmployee({
          ...values,
          organizationId: profile.organization_id,
        });
        toast({ title: "Success", description: "Employee added successfully." });
      }
      setIsFormOpen(false);
      setSelectedEmployee(undefined);
      fetchEmployees();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    try {
      await organizationManagementService.deleteUser(employeeToDelete.user_id);
      toast({ title: "Success", description: "Employee deleted successfully." });
      setEmployeeToDelete(null);
      fetchEmployees();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (employee: Profile) => {
    setSelectedEmployee(employee);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedEmployee(undefined);
    setIsFormOpen(true);
  };
  
  const handleImportSuccess = () => {
    setIsImportOpen(false);
    fetchEmployees();
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Employee Management</h1>
        <div className="flex gap-2">
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Bulk Import</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Import Employees</DialogTitle>
              </DialogHeader>
              <BulkEmployeeImport onSuccess={handleImportSuccess} />
            </DialogContent>
          </Dialog>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Add New</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedEmployee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
              </DialogHeader>
              <EmployeeForm
                employee={selectedEmployee}
                onSubmit={handleFormSubmit}
                onCancel={() => setIsFormOpen(false)}
                isSubmitting={isSubmitting}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
              ) : (
                employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.full_name}</TableCell>
                    <TableCell>{employee.employee_id}</TableCell>
                    <TableCell>{employee.role}</TableCell>
                    <TableCell>{employee.designation}</TableCell>
                    <TableCell>{employee.is_active ? "Active" : "Inactive"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(employee)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEmployeeToDelete(employee)} className="text-red-600">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!employeeToDelete} onOpenChange={() => setEmployeeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employee and their associated user account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEmployee}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
