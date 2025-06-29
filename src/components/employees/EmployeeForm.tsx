import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { profileService } from "@/services/profileService";
import { authService } from "@/services/authService"; 
import { Profile } from "@/types/database";

interface EmployeeFormProps {
  employee?: Partial<Profile> | null;
  organizationId: string;
  onClose: () => void;
  onEmployeeCreated: () => void;
}

interface EmployeeFormData {
  full_name: string;
  employee_id: string;
  designation: string;
  mobile_number: string;
  role: string; // Use string instead of UserRole enum
  email: string;
  password: string;
}

export default function EmployeeForm({ employee, organizationId, onClose, onEmployeeCreated }: EmployeeFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<EmployeeFormData>({
    full_name: employee?.full_name || "",
    employee_id: employee?.employee_id || "",
    designation: employee?.designation || "",
    mobile_number: employee?.mobile_number || "",
    role: employee?.role || "employee", // Default to string value
    email: "", // Remove employee?.email since email doesn't exist on Profile type
    password: ""
  });

  const handleInputChange = (field: keyof EmployeeFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    if (!formData.full_name || !formData.employee_id) {
      setError("Please fill in required fields");
      setLoading(false);
      return;
    }

    if (!employee && (!formData.email || !formData.password)) {
      setError("Email and password are required for new employees");
      setLoading(false);
      return;
    }

    try {
      if (employee && employee.id) {
        // Update existing employee
        await profileService.updateProfile(employee.id, {
          full_name: formData.full_name,
          employee_id: formData.employee_id,
          designation: formData.designation,
          mobile_number: formData.mobile_number,
          role: formData.role
        });
      } else {
        // Create new employee using auth service
        await authService.signUp(formData.email, formData.password, {
          name: formData.full_name,
          organizationId: organizationId,
          employeeId: formData.employee_id,
          designation: formData.designation,
          mobileNumber: formData.mobile_number,
          role: formData.role,
          email: formData.email,
          isActive: true
        });
      }
      
      onEmployeeCreated();
    } catch (err: unknown) {
      console.error("Employee form error:", err);
      if (err instanceof Error) {
        setError(err.message || "Failed to save employee");
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {employee ? "Edit Employee" : "Add New Employee"}
          </DialogTitle>
          <DialogDescription>
            {employee ? "Update employee information below." : "Enter the details for the new employee."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <label className="text-sm font-medium">Full Name *</label>
            <Input
              value={formData.full_name}
              onChange={(e) => handleInputChange("full_name", e.target.value)}
              placeholder="Enter full name"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Employee ID *</label>
            <Input
              value={formData.employee_id}
              onChange={(e) => handleInputChange("employee_id", e.target.value)}
              placeholder="Enter employee ID"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Designation</label>
            <Input
              value={formData.designation}
              onChange={(e) => handleInputChange("designation", e.target.value)}
              placeholder="Enter job title/designation"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Mobile Number</label>
            <Input
              value={formData.mobile_number}
              onChange={(e) => handleInputChange("mobile_number", e.target.value)}
              placeholder="Enter mobile number"
              type="tel"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Role</label>
            <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="task_manager">Task Manager</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Email {!employee ? "*" : ""}</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter email address"
              required={!employee}
              disabled={!!employee}
            />
            {employee && (
              <p className="text-xs text-muted-foreground mt-1">
                Email cannot be changed for existing employees
              </p>
            )}
          </div>

          {!employee && (
            <div>
              <label className="text-sm font-medium">Password *</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Enter password (min 6 characters)"
                required
                minLength={6}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Saving..." : employee ? "Update Employee" : "Add Employee"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
