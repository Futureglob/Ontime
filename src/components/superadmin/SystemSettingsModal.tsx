import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { superAdminService, SystemSettings } from "@/services/superAdminService";

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SystemSettingsModal({ isOpen, onClose }: SystemSettingsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<SystemSettings[]>([]);
  const [settingsState, setSettingsState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const systemSettings = await superAdminService.getSystemSettings();
      setSettings(systemSettings);
      
      // Convert settings to state
      const state: Record<string, boolean> = {};
      systemSettings.forEach(setting => {
        if (typeof setting.value === 'object' && setting.value !== null) {
          const value = setting.value as Record<string, unknown>;
          if ('enabled' in value && typeof value.enabled === 'boolean') {
            state[setting.key] = value.enabled;
          }
        }
      });
      setSettingsState(state);
    } catch (err) {
      console.error("Error loading settings:", err);
      setError("Failed to load system settings");
    }
  };

  const handleSettingChange = async (key: string, enabled: boolean) => {
    try {
      setLoading(true);
      setSettingsState(prev => ({ ...prev, [key]: enabled }));
      
      await superAdminService.updateSystemSetting(key, { enabled });
      
      // Update local settings
      setSettings(prev => prev.map(setting => 
        setting.key === key 
          ? { ...setting, value: { enabled } }
          : setting
      ));
    } catch (err) {
      console.error("Error updating setting:", err);
      setError("Failed to update setting");
      // Revert the change
      setSettingsState(prev => ({ ...prev, [key]: !enabled }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>System Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Application Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings
                  .filter(setting => ['maintenance_mode', 'user_registration', 'email_notifications'].includes(setting.key))
                  .map(setting => (
                    <div key={setting.key} className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">
                          {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Label>
                        <p className="text-xs text-gray-500">{setting.description}</p>
                      </div>
                      <Switch
                        checked={settingsState[setting.key] || false}
                        onCheckedChange={(checked) => handleSettingChange(setting.key, checked)}
                        disabled={loading}
                      />
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Two-Factor Authentication</Label>
                    <p className="text-xs text-gray-500">Require 2FA for all users</p>
                  </div>
                  <Switch
                    checked={true}
                    onCheckedChange={() => {}}
                    disabled={true}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Session Timeout</Label>
                    <p className="text-xs text-gray-500">Auto logout after 24 hours</p>
                  </div>
                  <Switch
                    checked={true}
                    onCheckedChange={() => {}}
                    disabled={true}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Strong Password Policy</Label>
                    <p className="text-xs text-gray-500">Enforce complex passwords</p>
                  </div>
                  <Switch
                    checked={true}
                    onCheckedChange={() => {}}
                    disabled={true}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}