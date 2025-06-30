
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ClientFormProps {
  onSubmit: (client: ClientData) => void;
  onCancel: () => void;
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

const emirates = [
  "Abu Dhabi",
  "Dubai", 
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah"
];

export default function ClientForm({ onSubmit, onCancel }: ClientFormProps) {
  const [formData, setFormData] = useState<ClientData>({
    name: "",
    contactPerson: "",
    place: "",
    emirate: "",
    phoneNumber: "",
    latitude: undefined,
    longitude: undefined
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleLocationFetch = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add New Client</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Client Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="contactPerson">Contact Person *</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="place">Place *</Label>
              <Input
                id="place"
                value={formData.place}
                onChange={(e) => setFormData(prev => ({ ...prev, place: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="emirate">Emirate *</Label>
              <Select value={formData.emirate} onValueChange={(value) => setFormData(prev => ({ ...prev, emirate: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Emirate" />
                </SelectTrigger>
                <SelectContent>
                  {emirates.map((emirate) => (
                    <SelectItem key={emirate} value={emirate}>
                      {emirate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                required
              />
            </div>
            
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleLocationFetch}
                className="w-full"
              >
                Get Current Location
              </Button>
            </div>
          </div>
          
          {formData.latitude && formData.longitude && (
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">
                Location captured: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </p>
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Add Client
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
