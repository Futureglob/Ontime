import { useState } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { useAuth } from "@/contexts/AuthContext";
import organizationManagementService from "@/services/organizationManagementService";
import authService from "@/services/authService";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UploadCloud, FileText, AlertTriangle, CheckCircle } from "lucide-react";

interface BulkEmployeeImportProps {
  onSuccess: () => void;
}

type EmployeeData = {
  email: string;
  fullName: string;
  role: string;
  employeeId: string;
  designation?: string;
  mobileNumber?: string;
};

export default function BulkEmployeeImport({ onSuccess }: BulkEmployeeImportProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFileName(file.name);
      setError(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json<any>(worksheet);
          
          const requiredFields = ["email", "fullName", "role", "employeeId"];
          if (json.length > 0 && !requiredFields.every(field => field in json[0])) {
            throw new Error(`Missing required columns. Please include: ${requiredFields.join(", ")}`);
          }

          const parsedEmployees: EmployeeData[] = json.map((row) => ({
            email: row.email,
            fullName: row.fullName,
            role: row.role,
            employeeId: String(row.employeeId),
            designation: row.designation,
            mobileNumber: row.mobileNumber ? String(row.mobileNumber) : undefined,
          }));
          setEmployees(parsedEmployees);
        } catch (e: any) {
          setError(`Error parsing file: ${e.message}`);
          setEmployees([]);
          setFileName(null);
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!profile?.organization_id) {
      toast({ title: "Error", description: "No organization found.", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const employee of employees) {
      try {
        // This is a simplified flow. In a real app, you'd invite the user
        // and they would set their own password. For this implementation,
        // we create the user directly.
        await organizationManagementService.addEmployee({
          ...employee,
          organizationId: profile.organization_id,
        });
        successCount++;
      } catch (e: any) {
        console.error(`Failed to import ${employee.email}:`, e);
        errorCount++;
      }
    }

    setIsUploading(false);
    toast({
      title: "Import Complete",
      description: `${successCount} employees imported successfully. ${errorCount} failed.`,
    });
    if (successCount > 0) {
      onSuccess();
    }
    setEmployees([]);
    setFileName(null);
  };

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer
        ${isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/50 hover:border-primary"}`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
        {isDragActive ? (
          <p className="mt-2">Drop the file here ...</p>
        ) : (
          <p className="mt-2">Drag & drop an Excel file here, or click to select file</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">.xlsx or .xls files only</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Import Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {fileName && !error && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertTitle>File Ready</AlertTitle>
          <AlertDescription>
            {fileName} ({employees.length} records found). Ready to import.
          </AlertDescription>
        </Alert>
      )}

      {employees.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Preview Data (first 5 rows)</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Employee ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.slice(0, 5).map((emp, index) => (
                  <TableRow key={index}>
                    <TableCell>{emp.email}</TableCell>
                    <TableCell>{emp.fullName}</TableCell>
                    <TableCell>{emp.role}</TableCell>
                    <TableCell>{emp.employeeId}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={employees.length === 0 || isUploading}
        className="w-full"
      >
        {isUploading ? "Importing..." : `Import ${employees.length} Employees`}
      </Button>
    </div>
  );
}
