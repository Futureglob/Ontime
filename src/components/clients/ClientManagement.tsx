
    import { useState, useEffect, useCallback } from "react";
    import { useAuth } from "@/contexts/AuthContext";
    import { clientService, Client } from "@/services/clientService";
    import { Button } from "@/components/ui/button";
    import { PlusCircle } from "lucide-react";
    import ClientForm from "./ClientForm";
    import {
      Table,
      TableBody,
      TableCell,
      TableHead,
      TableHeader,
      TableRow,
    } from "@/components/ui/table";
    import { useToast } from "@/hooks/use-toast";

    export default function ClientManagement() {
      const { currentProfile } = useAuth();
      const [clients, setClients] = useState<Client[]>([]);
      const [isFormOpen, setIsFormOpen] = useState(false);
      const [selectedClient, setSelectedClient] = useState<Client | null>(null);
      const { toast } = useToast();

      const fetchClients = useCallback(async () => {
        if (currentProfile?.organization_id) {
          try {
            const fetchedClients = await clientService.getClientsByOrg(
              currentProfile.organization_id
            );
            setClients(fetchedClients);
          } catch (error) {
            toast({
              title: "Error fetching clients",
              description: "Could not retrieve client list.",
              variant: "destructive",
            });
          }
        }
      }, [currentProfile?.organization_id, toast]);

      useEffect(() => {
        fetchClients();
      }, [fetchClients]);

      const handleFormSuccess = () => {
        setIsFormOpen(false);
        setSelectedClient(null);
        fetchClients();
      };

      const handleEdit = (client: Client) => {
        setSelectedClient(client);
        setIsFormOpen(true);
      };

      return (
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Client Management</h1>
            <Button onClick={() => {
              setSelectedClient(null);
              setIsFormOpen(true);
            }}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Client
            </Button>
          </div>

          {isFormOpen ? (
            <ClientForm
              client={selectedClient}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedClient(null);
              }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Emirate</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{client.contact_person}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell>{client.emirate}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(client)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      );
    }
  