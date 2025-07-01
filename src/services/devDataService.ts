
    import { supabase } from "@/integrations/supabase/client";
import { faker } from "@faker-js/faker";

const BATCH_SIZE = 10;

export const devDataService = {
  async seedDatabase(organizationId: string) {
    try {
      console.log("Starting database seed...");

      // 1. Seed Clients
      const clients = Array.from({ length: 20 }, () => ({
        organization_id: organizationId,
        name: faker.company.name(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(true),
      }));
      const {  seededClients, error: clientError } = await supabase
        .from("clients")
        .insert(clients)
        .select();
      if (clientError) throw clientError;
      console.log(`${seededClients.length} clients seeded.`);

      // 2. Seed Employees (Users & Profiles)
      const employees = [];
      for (let i = 0; i < 50; i++) {
        const fullName = faker.person.fullName();
        const email = faker.internet.email({
          firstName: fullName.split(" ")[0],
          lastName: fullName.split(" ")[1],
        });
        const password = "password123"; // Set a default password
        const role = faker.helpers.arrayElement([
          "employee",
          "task_manager",
          "org_admin",
        ]);

        // Create Auth User
        const {  authData, error: authError } =
          await supabase.auth.signUp({
            email,
            password,
            options: {
               {
                full_name: fullName,
                role: role,
                organization_id: organizationId,
              },
            },
          });

        if (authError) {
          console.error(`Error creating auth user ${email}:`, authError.message);
          continue; // Skip to next user if creation fails
        }

        if (authData.user) {
          const pin = faker.string.numeric(4);
          
          employees.push({
            user_id: authData.user.id,
            organization_id: organizationId,
            employee_id: `EMP-${faker.string.alphanumeric(5).toUpperCase()}`,
            full_name: fullName,
            designation: faker.person.jobTitle(),
            mobile_number: faker.phone.number(),
            role: role,
            is_active: true,
            pin: pin, // Store plain pin, will be hashed by trigger
          });
        }
      }

      // Batch insert profiles
      let seededProfiles = [];
      for (let i = 0; i < employees.length; i += BATCH_SIZE) {
        const batch = employees.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase.from("profiles").insert(batch).select();
        if (error) {
          console.error("Error inserting profile batch:", error.message);
        } else if (data) {
          seededProfiles = [...seededProfiles, ...data];
        }
      }
      console.log(`${seededProfiles.length} employees (profiles) seeded.`);

      // 3. Seed Tasks
      if (seededProfiles.length > 0 && seededClients.length > 0) {
        const tasks = [];
        for (let i = 0; i < 100; i++) {
          const created_by_profile = faker.helpers.arrayElement(
            seededProfiles.filter((p) => p.role !== "employee")
          );
          const assigned_to_profile = faker.helpers.arrayElement(
            seededProfiles.filter((p) => p.role === "employee")
          );
          const client = faker.helpers.arrayElement(seededClients);

          if (created_by_profile && assigned_to_profile && client) {
            tasks.push({
              organization_id: organizationId,
              client_id: client.id,
              title: faker.lorem.sentence(5),
              description: faker.lorem.paragraph(),
              status: faker.helpers.arrayElement([
                "assigned",
                "in_progress",
                "completed",
                "on_hold",
              ]),
              priority: faker.helpers.arrayElement(["low", "medium", "high"]),
              assigned_to: assigned_to_profile.user_id,
              created_by: created_by_profile.user_id,
              due_date: faker.date.future().toISOString(),
              location_address: faker.location.streetAddress(true),
              location_lat: faker.location.latitude(),
              location_lng: faker.location.longitude(),
            });
          }
        }
        const {  seededTasks, error: taskError } = await supabase
          .from("tasks")
          .insert(tasks)
          .select();
        if (taskError) throw taskError;
        console.log(`${seededTasks?.length || 0} tasks seeded.`);
      }

      console.log("Database seed complete.");
      return {
        clients: seededClients.length,
        employees: seededProfiles.length,
        tasks: seededClients.length > 0 ? 100 : 0,
      };
    } catch (error) {
      console.error("Database seeding failed:", error);
      throw error;
    }
  },
};
  