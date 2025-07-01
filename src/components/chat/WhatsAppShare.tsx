import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Share2, Copy, Check } from "lucide-react";
import { EnrichedTask } from "@/types";

interface WhatsAppShareProps {
  task: EnrichedTask;
  onClose: () => void;
}

export default function WhatsAppShare({ task, onClose }: WhatsAppShareProps) {
  const defaultMessage = `Task Update: ${task.title}

Status: ${task.status}
Priority: ${task.priority}
Due: ${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Not set'}

Location: ${task.location_address || 'Not specified'}

Description: ${task.description || 'No description'}`;
  const [customMessage, setCustomMessage] = useState(defaultMessage);
  const [shareType, setShareType] = useState<"update" | "custom">("update");

  const handleShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(customMessage)}`;
    window.open(whatsappUrl, "_blank");
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned": return "bg-blue-100 text-blue-800";
      case "accepted": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-emerald-100 text-emerald-800";
      case "on_hold": return "bg-orange-100 text-orange-800";
      case "returned": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
          <Share2 className="h-4 w-4 mr-2" />
          Share via WhatsApp
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-green-600" />
            Share Task via WhatsApp
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Task Preview */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">{task.title}</h4>
              <Badge className={`text-xs ${getStatusColor(task.status || "")}`}>
                {task.status?.replace("_", " ").toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              📍 {task.location_address || "Location not specified"}
            </p>
            {task.due_date && (
              <p className="text-xs text-muted-foreground">
                ⏰ Due: {new Date(task.due_date).toLocaleDateString()}
              </p>
            )}
          </div>

          {task.location_lat && task.location_lng && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">Location</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                📍 {task.location_address}
              </p>
              <p className="text-xs text-muted-foreground">
                {task.location_lat}, {task.location_lng}
              </p>
            </div>
          )}

          {/* Message Preview */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={6}
              className="text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button onClick={handleShare} className="w-full bg-green-600 hover:bg-green-700">
              <ExternalLink className="h-4 w-4 mr-2" />
              Send to {task.assigned_to_profile?.mobile_number || "User"}
            </Button>
            
            <Button variant="outline" onClick={() => setShareType("custom")} className="w-full">
              {shareType === "custom" ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Custom Message
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Use Custom Message
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
