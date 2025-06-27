import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Camera, 
  MapPin, 
  Upload, 
  X, 
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import Image from "next/image";

interface PhotoData {
  id: string;
  url: string;
  type: "check_in" | "progress" | "completion";
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  taskId: string;
}

interface PhotoCaptureProps {
  taskId: string;
  onPhotoCapture?: (photo: PhotoData) => void;
  allowedTypes?: ("check_in" | "progress" | "completion")[];
}

export default function PhotoCapture({ 
  taskId, 
  onPhotoCapture, 
  allowedTypes = ["check_in", "progress", "completion"] 
}: PhotoCaptureProps) {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedType, setSelectedType] = useState<"check_in" | "progress" | "completion">("progress");
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
        setLocationError("");
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location access denied by user");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out");
            break;
          default:
            setLocationError("An unknown error occurred while retrieving location");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, []);

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      getCurrentLocation();
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      try {
        setUploading(true);
        
        // Create file from blob
        // const file = new File([blob], `${selectedType}_${Date.now()}.jpg`, {
        //   type: "image/jpeg"
        // });

        // Mock photo upload - replace with actual service call
        const photoUrl = URL.createObjectURL(blob);
        
        // Get address from coordinates if location is available
        let address;
        if (location) {
          try {
            address = await getAddressFromCoordinates(
              location.coords.latitude,
              location.coords.longitude
            );
          } catch (error) {
            console.error("Error getting address:", error);
          }
        }

        const newPhoto: PhotoData = {
          id: Date.now().toString(),
          url: photoUrl,
          type: selectedType,
          timestamp: new Date().toISOString(),
          location: location ? {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            address
          } : undefined,
          taskId
        };

        setPhotos(prev => [...prev, newPhoto]);
        onPhotoCapture?.(newPhoto);
        stopCamera();
      } catch (error) {
        console.error("Error uploading photo:", error);
      } finally {
        setUploading(false);
      }
    }, "image/jpeg", 0.8);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      getCurrentLocation();

      // Mock photo upload - replace with actual service call
      const photoUrl = URL.createObjectURL(file);
      
      let address;
      if (location) {
        try {
          address = await getAddressFromCoordinates(
            location.coords.latitude,
            location.coords.longitude
          );
        } catch (error) {
          console.error("Error getting address:", error);
        }
      }

      const newPhoto: PhotoData = {
        id: Date.now().toString(),
        url: photoUrl,
        type: selectedType,
        timestamp: new Date().toISOString(),
        location: location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address
        } : undefined,
        taskId
      };

      setPhotos(prev => [...prev, newPhoto]);
      onPhotoCapture?.(newPhoto);
    } catch (error) {
      console.error("Error uploading photo:", error);
    } finally {
      setUploading(false);
    }
  };

  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=YOUR_API_KEY`
      );
      const data = await response.json();
      return data.results[0]?.formatted || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error("Error fetching address:", error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const removePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "check_in":
        return <Clock className="h-4 w-4" />;
      case "progress":
        return <Camera className="h-4 w-4" />;
      case "completion":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Camera className="h-4 w-4" />;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "check_in":
        return "secondary";
      case "progress":
        return "default";
      case "completion":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photo Capture & Geolocation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Photo Type Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Photo Type</label>
            <div className="flex gap-2">
              {allowedTypes.map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                  className="flex items-center gap-2"
                >
                  {getTypeIcon(type)}
                  {type.replace("_", " ").toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          {/* Location Status */}
          {locationError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{locationError}</AlertDescription>
            </Alert>
          ) : location ? (
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                Location captured: {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Camera Controls */}
          <div className="flex gap-2">
            {!isCapturing ? (
              <>
                <Button onClick={startCamera} className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Open Camera
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={capturePhoto}
                  disabled={uploading}
                  className="flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Capture Photo"}
                </Button>
                <Button variant="outline" onClick={stopCamera}>
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </>
            )}
          </div>

          {/* Camera View */}
          {isCapturing && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-w-md mx-auto rounded-lg"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Photos Gallery */}
      {photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Captured Photos ({photos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={photo.url}
                      alt={`${photo.type} photo`}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="absolute top-2 left-2">
                    <Badge variant={getTypeBadgeVariant(photo.type)} className="flex items-center gap-1">
                      {getTypeIcon(photo.type)}
                      {photo.type.replace("_", " ")}
                    </Badge>
                  </div>
                  
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removePhoto(photo.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 rounded-b-lg">
                    <div className="text-xs">
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="h-3 w-3" />
                        {new Date(photo.timestamp).toLocaleString()}
                      </div>
                      {photo.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">
                            {photo.location.address || 
                             `${photo.location.latitude.toFixed(4)}, ${photo.location.longitude.toFixed(4)}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
