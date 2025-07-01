import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Organization } from "@/types/database";

interface OrganizationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization | null;
}

export default function OrganizationDetailsModal({
  isOpen,
  onClose,
  organization
}: OrganizationDetailsModalProps) {
  if (!organization) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Organization Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Name</h3>
            <p>{organization.name}</p>
          </div>
          <div>
            <h3 className="font-semibold">Status</h3>
            <p>{organization.is_active ? "Active" : "Inactive"}</p>
          </div>
          <div>
            <h3 className="font-semibold">Created At</h3>
            <p>{new Date(organization.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
