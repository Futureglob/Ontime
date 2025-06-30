import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Share2, Copy, Check } from "lucide-react";
import { Task } from "@/types/database";
import { messageService } from "@/services/messageService";

interface WhatsAppShareProps {
  task: Task;
  customMessage?: string;
}

export default function WhatsAppShare({ task, customMessage }: WhatsAppShareProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState(customMessage || messageService.generateTaskUpdateMessage(task));
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleShare = () => {
    const whatsappUrl = messageService.generateWhatsAppLink(phoneNumber, message);
    window.open(whatsappUrl, "_blank");
    setIsOpen(false);
  };

  const handleShareGeneral = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    setIsOpen(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
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

  const generateMessage = () => {
    if (!task) return "";

    const taskTitle = `*Task:* ${task.title}`;
    const taskDesc = task.description ? `*Description:* ${task.description}` : "";
    const taskStatus = `*Status:* ${task.status}`;
    const taskPriority = `*Priority:* ${task.priority}`;
    const taskDueDate = task.due_date ? `*Due Date:* ${new Date(task.due_date).toLocaleDateString()}` : "";

    const messageParts = [
      taskTitle,
      taskDesc,
      taskStatus,
      taskPriority,
      taskDueDate,
    ];

    return messageParts.join("\n");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
              📍 {task.location || "Location not specified"}
            </p>
            {task.deadline && (
              <p className="text-xs text-muted-foreground">
                ⏰ Due: {new Date(task.deadline).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Phone Number Input */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to share without a specific contact
            </p>
          </div>

          {/* Message Preview */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {phoneNumber ? (
              <Button onClick={handleShare} className="w-full bg-green-600 hover:bg-green-700">
                <ExternalLink className="h-4 w-4 mr-2" />
                Send to {phoneNumber}
              </Button>
            ) : (
              <Button onClick={handleShareGeneral} className="w-full bg-green-600 hover:bg-green-700">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open WhatsApp
              </Button>
            )}
            
            <Button variant="outline" onClick={copyToClipboard} className="w-full">
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Message
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
