import { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import organizationManagementService from "@/services/organizationManagementService";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

interface BulkEmployeeImportProps {
  onSuccess: () => void;
}

export default function BulkEmployeeImport({ onSuccess }: BulkEmployeeImportProps) {
  const { currentProfile } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<{ email: string; full_name: string; phone?: string; }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileParse = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const requiredFields = ["email", "full_name"];
        const headers = results.meta.fields || [];
        const missingFields = requiredFields.filter(
          (field) => !headers.includes(field)
        );

        if (missingFields.length > 0) {
          toast({
            title: "Error",
            description: `CSV is missing required columns: ${missingFields.join(
              ", "
            )}`,
            variant: "destructive",
          });
          return;
        }
        setData(results.data as { email: string; full_name: string; phone?: string; }[]);
      },
      error: (error: Error) => {
        toast({
          title: "Error parsing CSV",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const onSubmit = async () => {
    if (!currentProfile) return;
    
    setIsSubmitting(true);
    try {
      const employeesToImport = data.map((row) => ({
        email: row.email,
        full_name: row.full_name,
        role: "employee",
        employee_id: `EMP${Date.now()}`,
        mobile_number: row.phone || "",
      }));

      // Use createEmployee for each employee instead of bulkImportEmployees
      const results = [];
      for (const employee of employeesToImport) {
        const result = await organizationManagementService.createEmployee(
          currentProfile.organization_id,
          employee
        );
        results.push(result);
      }

      toast({
        title: "Import Complete",
        description: `${results.length} employees imported successfully.`,
      });

      onSuccess();
    } catch (error) {
      toast({
        title: "Error importing employees",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Employee Import</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 p-6">
          <Input
            type="file"
            accept=".csv"
            onChange={(e) => {
              if (e.target.files?.length) {
                handleFileParse(e.target.files[0]);
              }
            }}
          />
          {data.length > 0 && (
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Ready to Import</AlertTitle>
              <AlertDescription>
                Found {data.length} records. Click "Import" to add them.
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => {}}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || data.length === 0}
          >
            {isSubmitting ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
