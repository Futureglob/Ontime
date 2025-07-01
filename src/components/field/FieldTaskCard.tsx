import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Camera, CheckCircle, Play, Pause, WifiOff, Calendar } from "lucide-react";
import { EnrichedTask } from "@/types";

interface FieldTaskCardProps {
  task: EnrichedTask;
  onTakePhoto?: () => void;
  onStatusChange?: (status: string) => void;
}

export default function FieldTaskCard({ task, onStatusChange }: FieldTaskCardProps) {
  const [updating, setUpdating] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [photoType, setPhotoType] = useState<"check_in" | "progress" | "completion">("check_in");
  const [notes, setNotes] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in_progress": return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setUpdating(true);
      if (onStatusChange) {
        onStatusChange(newStatus);
      }
      console.log(`Updating task ${task.id} to status: ${newStatus}`);
    } catch (error) {
      console.error("Error updating task status:", error);
      alert("Failed to update task status. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handlePhotoCapture = async () => {
    try {
      setUpdating(true);
      console.log(`Capturing ${photoType} photo for task ${task.id}`);
      setShowCamera(false);
      setNotes("");
    } catch (error) {
      console.error("Error handling photo:", error);
      alert("Failed to process photo. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const hasLocation = task.location_lat && task.location_lng;
  const locationText = hasLocation ? task.location_address || `${task.location_lat}, ${task.location_lng}` : "No location";

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold line-clamp-2 flex-1">{task.title}</CardTitle>
          <Badge className={getStatusColor(task.status)}>
            {task.status?.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
        
        <div className="space-y-2 text-sm">
          {task.client && (
            <div className="space-y-2">
              <h4 className="font-medium">Client Information</h4>
              <p className="text-sm text-gray-600">{task.client.name}</p>
            </div>
          )}
          {hasLocation && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{locationText}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-gray-50 p-4">
        <div className="flex flex-col gap-2 w-full">
          {task.status === "pending" && (
            <Button 
              onClick={() => handleStatusUpdate("in_progress")}
              disabled={updating}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Task
            </Button>
          )}
          
          {task.status === "in_progress" && (
            <Button 
              onClick={() => handleStatusUpdate("completed")}
              disabled={updating}
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Task
            </Button>
          )}

          <div className="flex gap-2">
            <Dialog open={showCamera} onOpenChange={setShowCamera}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                  {!isOnline && <WifiOff className="w-3 h-3 ml-1" />}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Capture Photo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Photo Type</label>
                    <select 
                      value={photoType} 
                      onChange={(e) => setPhotoType(e.target.value as "check_in" | "progress" | "completion")}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="check_in">Check-in Photo</option>
                      <option value="progress">Progress Photo</option>
                      <option value="completion">Completion Photo</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Notes (Optional)</label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add notes about this photo..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoCapture}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  <Button onClick={handlePhotoCapture} className="w-full">
                    Capture Photo
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              variant="outline" 
              onClick={() => handleStatusUpdate("on_hold")}
              disabled={updating}
              className="flex-1"
            >
              <Pause className="h-4 w-4 mr-2" />
              Hold
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
