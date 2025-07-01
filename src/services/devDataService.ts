
import { supabase } from "@/integrations/supabase/client";

const devDataService = {
  async seedDatabase(organizationId: string) {
    console.log("Seeding database for organization:", organizationId);

    const employees = [
      {
        email: "manager@ontime.com",
        fullName: "Manager Mike",
        role: "manager",
        employeeId: "MGR001",
      },
      {
        email: "employee1@ontime.com",
        fullName: "Employee Eric",
        role: "employee",
        employeeId: "EMP001",
      },
      {
        email: "employee2@ontime.com",
        fullName: "Employee Eve",
        role: "employee",
        employeeId: "EMP002",
      },
    ];

    for (const employee of employees) {
      // Check if user exists
      const {  { user } } = await supabase.auth.admin.createUser({
        email: employee.email,
        password: "password",
        email_confirm: true,
        user_meta { full_name: employee.fullName },
      });

      if (user) {
        // Check if profile exists
        const {  profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!profile) {
          await supabase.from("profiles").insert({
            user_id: user.id,
            organization_id: organizationId,
            full_name: employee.fullName,
            role: employee.role,
            employee_id: employee.employeeId,
          });
        }
      }
    }

    // Seed clients
    const {  clients } = await supabase.from("clients").insert([
        { name: "Dev Client A", contact_person: "Mr. A", organization_id: organizationId },
        { name: "Dev Client B", contact_person: "Ms. B", organization_id: organizationId },
    ]).select();

    // Seed tasks
    const {  profiles } = await supabase.from("profiles").select("id, role").eq("organization_id", organizationId);
    const adminProfile = profiles?.find(p => p.role === 'admin');
    const employeeProfile = profiles?.find(p => p.role === 'employee');

    if (adminProfile && employeeProfile && clients) {
        await supabase.from("tasks").insert([
            { 
                title: "Setup development environment", 
                description: "Install all dependencies and run the project.",
                client_id: clients[0].id,
                assigned_to: employeeProfile.id,
                created_by: adminProfile.id,
                organization_id: organizationId,
                status: 'pending',
                priority: 'high',
                due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
            },
            { 
                title: "Review project documentation", 
                description: "Read through the README and other docs.",
                client_id: clients[1].id,
                assigned_to: employeeProfile.id,
                created_by: adminProfile.id,
                organization_id: organizationId,
                status: 'in_progress',
                priority: 'medium',
                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            },
        ]);
    }

    console.log("Database seeding complete.");
    return true;
  },
};

export default devDataService;
  