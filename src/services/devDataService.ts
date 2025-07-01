
import { supabase } from "@/integrations/supabase/client";
import type { Organization, Profile, Client, Task } from "@/types/database";

const devDataService = {
  async createSampleOrganization(): Promise<Organization> {
    const organizationData = {
      name: "Sample Organization",
      owner_id: "sample-owner-id",
      is_active: true,
      address: "123 Sample Street, Sample City",
      contact_person: "John Doe",
      contact_email: "john@sample.com",
      contact_phone: "+1234567890",
      credits: 1000,
    };

    const { data, error } = await supabase
      .from("organizations")
      .insert(organizationData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createSampleProfiles(organizationId: string): Promise<Profile[]> {
    const profilesData = [
      {
        organization_id: organizationId,
        full_name: "Admin User",
        role: "admin" as const,
        employee_id: "EMP001",
        designation: "Administrator",
        mobile_number: "+1234567890",
        is_active: true,
        user_id: "admin-user-id",
      },
      {
        organization_id: organizationId,
        full_name: "Manager User",
        role: "manager" as const,
        employee_id: "EMP002",
        designation: "Project Manager",
        mobile_number: "+1234567891",
        is_active: true,
        user_id: "manager-user-id",
      },
      {
        organization_id: organizationId,
        full_name: "Employee User",
        role: "employee" as const,
        employee_id: "EMP003",
        designation: "Developer",
        mobile_number: "+1234567892",
        is_active: true,
        user_id: "employee-user-id",
      },
    ];

    const { data, error } = await supabase
      .from("profiles")
      .insert(profilesData)
      .select();

    if (error) throw error;
    return data;
  },

  async createSampleClients(organizationId: string): Promise<Client[]> {
    const clientsData = [
      {
        organization_id: organizationId,
        name: "Client A",
        email: "clienta@example.com",
        phone: "+1234567893",
        address: "456 Client Street, Client City",
      },
      {
        organization_id: organizationId,
        name: "Client B",
        email: "clientb@example.com",
        phone: "+1234567894",
        address: "789 Client Avenue, Client Town",
      },
    ];

    const { data, error } = await supabase
      .from("clients")
      .insert(clientsData)
      .select();

    if (error) throw error;
    return data;
  },

  async createSampleTasks(organizationId: string, clientId: string, assignedTo: string): Promise<Task[]> {
    const tasksData = [
      {
        organization_id: organizationId,
        title: "Sample Task 1",
        description: "This is a sample task for testing purposes",
        status: "pending" as const,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        assigned_to: assignedTo,
        client_id: clientId,
      },
      {
        organization_id: organizationId,
        title: "Sample Task 2",
        description: "Another sample task for testing",
        status: "in_progress" as const,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        assigned_to: assignedTo,
        client_id: clientId,
      },
    ];

    const { data, error } = await supabase
      .from("tasks")
      .insert(tasksData)
      .select();

    if (error) throw error;
    return data;
  },

  async setupSampleData() {
    try {
      const organization = await this.createSampleOrganization();
      const profiles = await this.createSampleProfiles(organization.id);
      const clients = await this.createSampleClients(organization.id);
      
      if (clients.length > 0 && profiles.length > 0) {
        const tasks = await this.createSampleTasks(
          organization.id,
          clients[0].id,
          profiles[0].id
        );
        
        return {
          organization,
          profiles,
          clients,
          tasks,
        };
      }

      return {
        organization,
        profiles,
        clients,
        tasks: [],
      };
    } catch (error) {
      console.error("Error setting up sample data:", error);
      throw error;
    }
  },
};

export default devDataService;
