import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { OrganizationDetails } from "@/types/database";

interface OrganizationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: OrganizationDetails | null;
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Organization Name</label>
              <p className="text-sm">{organization.name}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Created</label>
              <p className="text-sm">{new Date(organization.created_at).toLocaleDateString()}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Total Users</label>
              <p className="text-sm">{organization.userCount}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Total Tasks</label>
              <p className="text-sm">{organization.taskCount}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Completed Tasks</label>
              <p className="text-sm">{organization.completedTasks}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className="text-sm">{organization.is_active ? "Active" : "Inactive"}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
