
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, User, Plus } from "lucide-react";
import ClientForm from "./ClientForm";

interface Client {
  id: string;
  name: string;
  contactPerson: string;
  place: string;
  emirate: string;
  phoneNumber: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

interface ClientData {
  name: string;
  contactPerson: string;
  place: string;
  emirate: string;
  phoneNumber: string;
  latitude?: number;
  longitude?: number;
}

export default function ClientManagement() {
  const [clients, setClients] = useState<Client[]>([
    {
      id: "1",
      name: "ABC Construction",
      contactPerson: "Ahmed Ali",
      place: "Business Bay",
      emirate: "Dubai",
      phoneNumber: "+971501234567",
      latitude: 25.1972,
      longitude: 55.2744,
      createdAt: "2024-01-15"
    },
    {
      id: "2",
      name: "XYZ Trading",
      contactPerson: "Sarah Mohammed",
      place: "Al Karama",
      emirate: "Dubai",
      phoneNumber: "+971507654321",
      createdAt: "2024-01-20"
    }
  ]);

  const [showForm, setShowForm] = useState(false);

  const handleAddClient = (clientData: ClientData) => {
    const newClient: Client = {
      id: Date.now().toString(),
      ...clientData,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setClients(prev => [...prev, newClient]);
    setShowForm(false);
  };

  if (showForm) {
    return (
      <div className="p-6">
        <ClientForm
          onSubmit={handleAddClient}
          onCancel={() => setShowForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Client Management</h1>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <Card key={client.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">{client.name}</span>
                <Badge variant="outline">{client.emirate}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                <span>{client.contactPerson}</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{client.place}, {client.emirate}</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{client.phoneNumber}</span>
              </div>
              
              {client.latitude && client.longitude && (
                <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                  Location: {client.latitude.toFixed(4)}, {client.longitude.toFixed(4)}
                </div>
              )}
              
              <div className="text-xs text-gray-500 pt-2 border-t">
                Added: {client.createdAt}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {clients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No clients added yet</p>
          <Button onClick={() => setShowForm(true)}>Add Your First Client</Button>
        </div>
      )}
    </div>
  );
}
