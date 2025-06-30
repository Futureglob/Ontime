import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Camera, Navigation, Clock, CheckCircle, XCircle, Play, Pause, WifiOff } from "lucide-react";
import { EnrichedTask } from "@/services/taskService";

interface FieldTaskCardProps {
  task: EnrichedTask;
  onTakePhoto: () => void;
}

export default function FieldTaskCard({ task }: FieldTaskCardProps) {
  const [updating, setUpdating] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [photoType, setPhotoType] = useState<"check_in" | "progress" | "completion">("check_in");
  const [notes, setNotes] = useState("");
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Monitor online/offline status
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
      case "assigned": return "bg-blue-100 text-blue-800 border-blue-200";
      case "accepted": return "bg-green-100 text-green-800 border-green-200";
      case "in_progress": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "on_hold": return "bg-orange-100 text-orange-800 border-orange-200";
      case "completed": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "returned": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getUrgencyLevel = () => {
    if (!task.deadline) return null;
    const deadline = new Date(task.deadline);
    const now = new Date();
    const timeDiff = deadline.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    
    if (hoursDiff < 0) return "overdue";
    if (hoursDiff < 24) return "urgent";
    if (hoursDiff < 72) return "soon";
    return null;
  };

  const urgency = getUrgencyLevel();

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setUpdating(true);
      console.log(`Updating task ${task.id} to status: ${newStatus}`);
      // Add your status update logic here
    } catch (error) {
      console.error("Error updating task status:", error);
      alert("Failed to update task status. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handlePhotoCapture = async (file: File) => {
    try {
      setUpdating(true);
      
      let location = currentLocation;
      if (!location) {
        try {
          location = await getCurrentLocation();
          setCurrentLocation(location);
        } catch (error) {
          console.warn("Could not get location:", error);
        }
      }

      console.log(`Capturing ${photoType} photo for task ${task.id}`);
      // Add your photo capture logic here

      setShowCamera(false);
      setNotes("");
    } catch (error) {
      console.error("Error handling photo:", error);
      alert("Failed to process photo. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const openInMaps = () => {
    if (task.location_lat && task.location_lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${task.location_lat},${task.location_lng}`;
      window.open(url, "_blank");
    } else if (task.location) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.location)}`;
      window.open(url, "_blank");
    }
  };

  const canAccept = task.status === "assigned";
  const canStart = task.status === "accepted";
  const canComplete = task.status === "in_progress";
  const canTakePhoto = ["accepted", "in_progress"].includes(task.status);

  return (
    <Card className={`hover:shadow-lg transition-all duration-200 ${urgency === "urgent" ? "ring-2 ring-red-200" : ""} ${!isOnline ? "border-orange-200 bg-orange-50/30" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold line-clamp-2 flex-1">{task.title}</CardTitle>
          <div className="flex flex-col gap-1 items-end">
            <div className="flex items-center gap-1">
              <Badge className={getStatusColor(task.status)}>
                {task.status?.replace("_", " ").toUpperCase()}
              </Badge>
              {!isOnline && (
                <div className="flex items-center gap-1 px-1 py-0.5 bg-orange-100 text-orange-800 rounded text-xs">
                  <WifiOff className="w-3 h-3" />
                </div>
              )}
            </div>
            {urgency && (
              <Badge variant="outline" className={
                urgency === "overdue" ? "text-red-600 border-red-300" :
                urgency === "urgent" ? "text-orange-600 border-orange-300" :
                "text-yellow-600 border-yellow-300"
              }>
                {urgency === "overdue" ? "OVERDUE" : urgency === "urgent" ? "URGENT" : "DUE SOON"}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">{task.description}</p>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="font-medium">{task.task_type}</span>
          </div>

          {task.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="line-clamp-2 flex-1">{task.location}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={openInMaps}
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                <Navigation className="h-4 w-4" />
              </Button>
            </div>
          )}

          {task.deadline && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
            </div>
          )}

          {task.client_info && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Client: {task.client_info}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {canAccept && (
            <Button 
              onClick={() => handleStatusUpdate("accepted")} 
              disabled={updating}
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept Task
            </Button>
          )}

          {canStart && (
            <Button 
              onClick={() => handleStatusUpdate("in_progress")} 
              disabled={updating}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Work
            </Button>
          )}

          {canComplete && (
            <Button 
              onClick={() => handleStatusUpdate("completed")} 
              disabled={updating}
              variant="outline"
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          )}

          <div className="flex gap-2">
            {canTakePhoto && (
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
                    <DialogTitle>
                      Capture Photo
                      {!isOnline && (
                        <span className="text-sm font-normal text-orange-600 ml-2">
                          (Offline - will sync later)
                        </span>
                      )}
                    </DialogTitle>
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
                      <label className="text-sm font-medium">Camera</label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            const file = files[0];
                            if (file instanceof File) {
                              handlePhotoCapture(file);
                            } else {
                              console.error("Selected item is not a File object:", file);
                            }
                          }
                        }}
                        className="w-full p-2 border rounded-md"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {currentLocation ? "📍 Location will be included" : "📍 Getting location..."}
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <Button 
              variant="outline" 
              onClick={() => handleStatusUpdate("on_hold")}
              disabled={updating}
              className="flex-1"
            >
              <Pause className="h-4 w-4 mr-2" />
              Hold
            </Button>

            <Button 
              variant="outline" 
              onClick={() => handleStatusUpdate("returned")}
              disabled={updating}
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Return
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
