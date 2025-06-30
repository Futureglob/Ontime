
import { supabase } from "@/integrations/supabase/client";
import { hashPin } from "@/lib/utils";

export const devDataService = {
  async setupTestEmployees() {
    try {
      // Check if we already have test employees
      const { data: existingProfiles } = await supabase
        .from("profiles")
        .select("employee_id")
        .in("employee_id", ["0001", "0002", "0003", "0004"]);

      if (existingProfiles && existingProfiles.length > 0) {
        console.log("Test employees already exist");
        return;
      }

      // Get the first organization to assign employees to
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id")
        .limit(1);

      if (!orgs || orgs.length === 0) {
        console.log("No organizations found, cannot create test employees");
        return;
      }

      const orgId = orgs[0].id;

      // Create test employees with properly hashed PINs
      const testEmployees = [
        {
          id: "test-employee-1",
          full_name: "Test Employee 1",
          employee_id: "0001",
          role: "employee",
          designation: "Worker",
          mobile_number: "+1234567890",
          organization_id: orgId,
          is_active: true,
          pin_hash: await hashPin("123456", "test-employee-1"), // PIN: 123456
          pin_created_at: new Date().toISOString(),
          pin_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
          failed_pin_attempts: 0
        },
        {
          id: "test-employee-2", 
          full_name: "Test Manager",
          employee_id: "0002",
          role: "task_manager",
          designation: "Manager",
          mobile_number: "+1234567891",
          organization_id: orgId,
          is_active: true,
          pin_hash: await hashPin("654321", "test-employee-2"), // PIN: 654321
          pin_created_at: new Date().toISOString(),
          pin_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          failed_pin_attempts: 0
        },
        {
          id: "test-employee-3",
          full_name: "Test Supervisor", 
          employee_id: "0003",
          role: "supervisor",
          designation: "Supervisor",
          mobile_number: "+1234567892",
          organization_id: orgId,
          is_active: true,
          pin_hash: await hashPin("111111", "test-employee-3"), // PIN: 111111
          pin_created_at: new Date().toISOString(),
          pin_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          failed_pin_attempts: 0
        },
        {
          id: "test-employee-4",
          full_name: "Test Worker",
          employee_id: "0004", 
          role: "employee",
          designation: "Field Worker",
          mobile_number: "+1234567893",
          organization_id: orgId,
          is_active: true,
          pin_hash: await hashPin("999999", "test-employee-4"), // PIN: 999999
          pin_created_at: new Date().toISOString(),
          pin_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          failed_pin_attempts: 0
        }
      ];

      const { error } = await supabase
        .from("profiles")
        .insert(testEmployees);

      if (error) {
        console.error("Error creating test employees:", error);
      } else {
        console.log("Test employees created successfully");
        console.log("Test login credentials:");
        console.log("Employee ID: 0001, PIN: 123456 (Worker)");
        console.log("Employee ID: 0002, PIN: 654321 (Manager)");
        console.log("Employee ID: 0003, PIN: 111111 (Supervisor)");
        console.log("Employee ID: 0004, PIN: 999999 (Field Worker)");
      }
    } catch (error) {
      console.error("Error setting up test employees:", error);
    }
  }
};

export default devDataService;
