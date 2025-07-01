import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { organizationManagementService } from "@/services/organizationManagementService";
import { Profile } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  FileUp,
  RefreshCw,
  KeyRound,
  Trash2,
  Edit,
  Search,
} from "lucide-react";
import EmployeeForm from "./EmployeeForm";
import BulkEmployeeImport from "./BulkEmployeeImport";
import { useToast } from "@/hooks/use-toast";

export default function EmployeeManagement() {
  const { currentProfile } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Profile | null>(null);

  const loadEmployees = useCallback(async () => {
    if (!currentProfile?.organization_id) return;
    setLoading(true);
    try {
      const data = await organizationManagementService.getEmployees(
        currentProfile.organization_id
      );
      setEmployees(data);
    } catch (error) {
      console.error("Error loading employees:", error);
      toast({
        title: "Error",
        description: "Failed to load employees.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentProfile?.organization_id, toast]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const handleFormSubmit = async (values: Partial<Profile>) => {
    if (!currentProfile?.organization_id) return;

    try {
      if (selectedEmployee) {
        // Update logic
        await organizationManagementService.updateEmployee(
          selectedEmployee.id,
          values
        );
        toast({ title: "Success", description: "Employee updated successfully." });
      } else {
        // Create logic
        await organizationManagementService.addEmployee(
          currentProfile.organization_id,
          values
        );
        toast({ title: "Success", description: "Employee added successfully." });
      }
      setIsFormOpen(false);
      setSelectedEmployee(null);
      loadEmployees();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: `Failed to ${
          selectedEmployee ? "update" : "add"
        } employee.`,
        variant: "destructive",
      });
    }
  };

  const handleGeneratePin = async (employee: Profile) => {
    try {
      const pin = await organizationManagementService.generatePinForEmployee(
        employee.user_id
      );
      toast({
        title: `PIN for ${employee.full_name}`,
        description: `New PIN: ${pin}`,
      });
    } catch (error) {
      console.error("Error generating PIN:", error);
      toast({
        title: "Error",
        description: "Failed to generate PIN.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (employee: Profile) => {
    setSelectedEmployee(employee);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedEmployee(null);
    setIsFormOpen(true);
  };

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Employee Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadEmployees} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileUp className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Bulk Import Employees</DialogTitle>
              </DialogHeader>
              <BulkEmployeeImport
                onSuccess={() => {
                  setIsImportOpen(false);
                  loadEmployees();
                }}
              />
            </DialogContent>
          </Dialog>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedEmployee ? "Edit Employee" : "Add New Employee"}
                </DialogTitle>
              </DialogHeader>
              <EmployeeForm
                employee={selectedEmployee}
                onSubmit={handleFormSubmit}
                onCancel={() => setIsFormOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search employees..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No employees found.
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="font-medium">{employee.full_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {employee.designation}
                    </div>
                  </TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{employee.role.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={employee.is_active ? "default" : "outline"}
                      className={
                        employee.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {employee.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGeneratePin(employee)}
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(employee)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
