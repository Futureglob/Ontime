import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText
} from "lucide-react";
import { authService } from "@/services/authService";
import { UserRole } from "@/types";

interface BulkEmployeeImportProps {
  organizationId: string;
  onImportComplete: () => void;
  onClose: () => void;
}

interface EmployeeImportData {
  full_name: string;
  employee_id: string;
  designation: string;
  mobile_number: string;
  role: string;
  email?: string;
}

interface ImportResult {
  success: boolean;
  employee: EmployeeImportData;
  error?: string;
  pin?: string;
}

export default function BulkEmployeeImport({ organizationId, onImportComplete, onClose }: BulkEmployeeImportProps) {
  const [employees, setEmployees] = useState<EmployeeImportData[]>([]);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "results">("upload");

  const downloadTemplate = () => {
    const csvContent = `full_name,employee_id,designation,mobile_number,role,email
John Doe,EMP001,Manager,+1234567890,employee,john@example.com
Jane Smith,EMP002,Supervisor,+1234567891,employee,jane@example.com
Mike Johnson,EMP003,Technician,+1234567892,employee,`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employee_import_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      alert("Please upload a CSV file");
      return;
    }

    parseCSV(selectedFile);
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter(line => line.trim());
      
      if (lines.length < 2) {
        alert("CSV file must contain at least a header row and one data row");
        return;
      }

      const headers = lines[0].split(",").map(h => h.trim());
      const requiredHeaders = ["full_name", "employee_id", "designation", "mobile_number", "role"];
      
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        alert(`Missing required columns: ${missingHeaders.join(", ")}`);
        return;
      }

      const employeeData: EmployeeImportData[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim());
        if (values.length < requiredHeaders.length) continue;

        const employee: EmployeeImportData = {
          full_name: values[headers.indexOf("full_name")] || "",
          employee_id: values[headers.indexOf("employee_id")] || "",
          designation: values[headers.indexOf("designation")] || "",
          mobile_number: values[headers.indexOf("mobile_number")] || "",
          role: values[headers.indexOf("role")] || "employee",
          email: values[headers.indexOf("email")] || undefined
        };

        if (employee.full_name && employee.employee_id) {
          employeeData.push(employee);
        }
      }

      setEmployees(employeeData);
      setStep("preview");
    };

    reader.readAsText(file);
  };

  const validateEmployeeData = (employee: EmployeeImportData): string | null => {
    if (!employee.full_name.trim()) return "Full name is required";
    if (!employee.employee_id.trim()) return "Employee ID is required";
    if (!employee.designation.trim()) return "Designation is required";
    if (!employee.mobile_number.trim()) return "Mobile number is required";
    if (!["employee", "task_manager", "org_admin"].includes(employee.role)) {
      return "Role must be: employee, task_manager, or org_admin";
    }
    return null;
  };

  const importEmployees = async () => {
    setStep("importing");
    setProgress(0);
    
    const results: ImportResult[] = [];
    let createdCount = 0;
    
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      
      try {
        const validationError = validateEmployeeData(employee);
        if (validationError) {
          results.push({
            success: false,
            employee,
            error: validationError
          });
          continue;
        }

        const signUpData = await authService.signUp(
          // Since email is optional, we create a placeholder email and the user can update it later.
          employee.email || `${employee.employee_id.toUpperCase()}@${organizationId}.ontime`, 
          crypto.randomUUID(), // Generate a random password
          {
            full_name: employee.full_name,
            employee_id: employee.employee_id.toUpperCase(),
            designation: employee.designation,
            mobile_number: employee.mobile_number,
            role: employee.role as UserRole,
            organization_id: organizationId,
            is_active: true
          }
        );
        
        if (signUpData.error) {
          throw signUpData.error;
        }

        if (signUpData.data.user) {
          await authService.generatePinForUser(signUpData.data.user.id);
          createdCount++;
        } else {
          throw new Error("User not created");
        }
        
        results.push({
          success: true,
          employee,
          pin: signUpData.data.user.pin
        });

      } catch (error) {
        results.push({
          success: false,
          employee,
          error: error instanceof Error ? error.message : "Unknown error occurred"
        });
      }

      setProgress(((i + 1) / employees.length) * 100);
    }

    setImportResults(results);
    setStep("results");
    onImportComplete();
  };

  const downloadResults = () => {
    const successfulImports = importResults.filter(r => r.success);
    
    if (successfulImports.length === 0) {
      alert("No successful imports to download");
      return;
    }

    const csvContent = `full_name,employee_id,designation,mobile_number,role,pin
${successfulImports.map(result => 
      `${result.employee.full_name},${result.employee.employee_id},${result.employee.designation},${result.employee.mobile_number},${result.employee.role},${result.pin}`
    ).join("\n")}`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employee_import_results_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleComplete = () => {
    onClose();
  };

  return (
    <div className="space-y-6">
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Bulk Employee Import
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Upload a CSV file with employee data. Required columns: full_name, employee_id, designation, mobile_number, role. Optional: email
              </AlertDescription>
            </Alert>
            
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="csv-file">Select CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === "preview" && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Import Data ({employees.length} employees)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee, index) => {
                    const error = validateEmployeeData(employee);
                    return (
                      <TableRow key={index}>
                        <TableCell>{employee.full_name}</TableCell>
                        <TableCell>{employee.employee_id}</TableCell>
                        <TableCell>{employee.designation}</TableCell>
                        <TableCell>{employee.mobile_number}</TableCell>
                        <TableCell>{employee.role}</TableCell>
                        <TableCell>{employee.email || "N/A"}</TableCell>
                        <TableCell>
                          {error ? (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Error
                            </Badge>
                          ) : (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Valid
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={importEmployees} disabled={employees.length === 0 || employees.some(e => validateEmployeeData(e))}>
                Import {employees.length} Employees
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "importing" && (
        <Card>
          <CardHeader>
            <CardTitle>Importing Employees...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="w-full" />
            <p className="text-center text-sm text-gray-600">
              Processing {Math.round(progress)}% complete
            </p>
          </CardContent>
        </Card>
      )}

      {step === "results" && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {importResults.filter(r => r.success).length}
                </div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {importResults.filter(r => !r.success).length}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {importResults.length}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>

            {importResults.filter(r => !r.success).length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Some employees could not be imported. Check the details below.
                </AlertDescription>
              </Alert>
            )}

            <div className="max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>PIN/Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{result.employee.full_name}</div>
                          <div className="text-sm text-gray-500">{result.employee.employee_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {result.success ? (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {result.success ? (
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                            {result.pin}
                          </code>
                        ) : (
                          <span className="text-red-600 text-sm">{result.error}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Import More
              </Button>
              <div className="flex gap-2">
                {importResults.filter(r => r.success).length > 0 && (
                  <Button variant="outline" onClick={downloadResults}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PINs
                  </Button>
                )}
                <Button onClick={handleComplete}>
                  Complete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
