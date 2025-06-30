
import { supabase } from "@/integrations/supabase/client";
import { hashPin } from "@/lib/utils";

export const devDataService = {
  async setupTestEmployees() {
    try {
      // Check if test employees already exist
      const { data: existingEmployees, error: checkError } = await supabase
        .from("profiles")
        .select("employee_id")
        .in("employee_id", ["0001", "0002", "0003", "0004"]);

      if (checkError) {
        console.error("Error checking existing employees:", checkError);
        return;
      }

      if (existingEmployees && existingEmployees.length > 0) {
        console.log("Test employees already exist");
        return;
      }

      // Get the first organization to assign employees to
      const { data: orgs, error: orgError } = await supabase
        .from("organizations")
        .select("id")
        .limit(1);

      if (orgError) throw orgError;

      if (!orgs || orgs.length === 0) {
        console.log("No organizations found, creating a default organization first");
        
        // Create a default organization
        const { data: newOrg, error: createOrgError } = await supabase
          .from("organizations")
          .insert({
            name: "Default Organization",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createOrgError) {
          console.error("Error creating default organization:", createOrgError);
          return;
        }

        if (!newOrg) {
          console.error("Failed to create default organization");
          return;
        }

        console.log("Created default organization:", newOrg.id);
      }

      // Get the organization ID again
      const { data: finalOrgs, error: finalOrgError } = await supabase
        .from("organizations")
        .select("id")
        .limit(1);

      if (finalOrgError || !finalOrgs || finalOrgs.length === 0) {
        console.error("Still no organizations available");
        return;
      }

      const orgId = finalOrgs[0].id;

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
          pin: "123456"
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
          pin: "654321"
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
          pin: "111111"
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
          pin: "999999"
        }
      ];

      console.log("Creating test employees...");
      for (const employee of testEmployees) {
        const { pin, ...profileData } = employee;
        const pin_hash = await hashPin(pin, profileData.id);

        const { error } = await supabase
          .from("profiles")
          .insert({ 
            ...profileData,
            pin_hash,
            pin_created_at: new Date().toISOString(),
            pin_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
            failed_pin_attempts: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error(`Error creating test employee ${employee.employee_id}:`, error);
        } else {
          console.log(`Test employee ${employee.employee_id} created successfully. PIN: ${pin}`);
        }
      }
      console.log("Test employee setup complete.");

    } catch (error) {
      console.error("Error setting up test employees:", error);
    }
  }
};

export default devDataService;
