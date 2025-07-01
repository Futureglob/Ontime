import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import organizationManagementService from "@/services/organizationManagementService";
import type { OrganizationDetails, TaskSummary, OrganizationUser } from "@/services/organizationManagementService";
import type { Organization } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface OrganizationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: OrganizationDetails | null;
}

export default function OrganizationDetailsModal({
  isOpen,
  onClose,
  organization,
}: OrganizationDetailsModalProps) {
  if (!organization) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{organization.name}</DialogTitle>
          <DialogDescription>
            Details for the organization.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 items-center gap-4">
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <Badge variant={organization.is_active ? "default" : "destructive"}>
              {organization.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
            <p>{organization.contact_person}</p>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <p className="text-sm font-medium text-muted-foreground">Contact Email</p>
            <p>{organization.contact_email}</p>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <p className="text-sm font-medium text-muted-foreground">Contact Phone</p>
            <p>{organization.contact_phone}</p>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <p className="text-sm font-medium text-muted-foreground">Address</p>
            <p>{organization.address}</p>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <p className="text-sm font-medium text-muted-foreground">Credits</p>
            <p>{organization.credits}</p>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <p className="text-sm font-medium text-muted-foreground">Created At</p>
            <p>{new Date(organization.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
