import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Camera, MapPin, Upload, X, CheckCircle, AlertCircle, WifiOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { EnrichedTask } from "@/types";

interface PhotoCaptureProps {
  task: EnrichedTask;
  onPhotoUploaded?: () => void;
}

interface CapturedPhoto {
  id: string;
  file: File;
  preview: string;
  type: "check_in" | "progress" | "completion";
  notes: string;
  location?: { lat: number; lng: number };
  timestamp: Date;
  uploaded: boolean;
  uploading: boolean;
}

export default function PhotoCapture({ task, onPhotoUploaded }: PhotoCaptureProps) {
  const { currentProfile } = useAuth();
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [photoType, setPhotoType] = useState<"check_in" | "progress" | "completion">("check_in");
  const [notes, setNotes] = useState("");
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
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

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (isOnline) {
      uploadPendingPhotos();
    }
  }, [isOnline]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      capturePhoto(file);
    }
  };

  const capturePhoto = (file: File) => {
    const photoId = Date.now().toString();
    const preview = URL.createObjectURL(file);
    
    const newPhoto: CapturedPhoto = {
      id: photoId,
      file,
      preview,
      type: photoType,
      notes,
      location: currentLocation || undefined,
      timestamp: new Date(),
      uploaded: false,
      uploading: false
    };

    setPhotos(prev => [...prev, newPhoto]);
    setShowCamera(false);
    setNotes("");

    if (isOnline) {
      uploadPhoto(newPhoto);
    }
  };

  const uploadPhoto = async (photo: CapturedPhoto) => {
    if (!currentProfile) return;

    setPhotos(prev => prev.map(p => 
      p.id === photo.id ? { ...p, uploading: true } : p
    ));

    try {
      const fileName = `${task.id}/${photo.id}_${photo.file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('task-photos')
        .upload(fileName, photo.file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('task-photos')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('task_photos')
        .insert({
          task_id: task.id,
          user_id: currentProfile.user_id,
          photo_url: urlData.publicUrl,
          photo_type: photo.type
        });

      if (dbError) throw dbError;

      setPhotos(prev => prev.map(p => 
        p.id === photo.id ? { ...p, uploaded: true, uploading: false } : p
      ));

      if (onPhotoUploaded) {
        onPhotoUploaded();
      }

    } catch (error) {
      console.error("Error uploading photo:", error);
      setPhotos(prev => prev.map(p => 
        p.id === photo.id ? { ...p, uploading: false } : p
      ));
    }
  };

  const uploadPendingPhotos = () => {
    const pendingPhotos = photos.filter(p => !p.uploaded && !p.uploading);
    pendingPhotos.forEach(photo => uploadPhoto(photo));
  };

  const removePhoto = (photoId: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === photoId);
      if (photo) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter(p => p.id !== photoId);
    });
  };

  const getPhotoTypeColor = (type: string) => {
    switch (type) {
      case "check_in": return "bg-blue-100 text-blue-800";
      case "progress": return "bg-yellow-100 text-yellow-800";
      case "completion": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (photo: CapturedPhoto) => {
    if (photo.uploading) return <Upload className="h-4 w-4 animate-spin" />;
    if (photo.uploaded) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (!isOnline) return <WifiOff className="h-4 w-4 text-orange-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Task Photos</CardTitle>
            <Dialog open={showCamera} onOpenChange={setShowCamera}>
              <DialogTrigger asChild>
                <Button>
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
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
                      onChange={handleFileSelect}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>
                {currentLocation 
                  ? `Location: ${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`
                  : "Location not available"
                }
              </span>
            </div>

            {!isOnline && (
              <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
                <WifiOff className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-800">
                  You're offline. Photos will be uploaded when connection is restored.
                </span>
              </div>
            )}

            {photos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No photos captured yet
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={photo.preview}
                        alt={`${photo.type} photo`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute top-2 left-2">
                      <Badge className={getPhotoTypeColor(photo.type)}>
                        {photo.type.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="absolute top-2 right-2">
                      {getStatusIcon(photo)}
                    </div>
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="absolute top-2 right-8 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {photo.notes && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 rounded-b-lg">
                        {photo.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
