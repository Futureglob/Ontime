import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function EmployeeManagement() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder for loading employees
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Loading employees...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Employee Management</h1>
        <Button>Add Employee</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No employees found. Click "Add Employee" to get started.</p>
        </CardContent>
      </Card>
    </div>
  );
}
