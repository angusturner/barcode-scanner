import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { UserSettings } from '../types';

// LocalStorage key for settings
const SETTINGS_KEY = 'kitchen_inventory_settings';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>({
    id: 'user-settings',
    displayName: '',
    dietaryPreferences: [],
    allergies: [],
    theme: 'system',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newPreference, setNewPreference] = useState('');
  const [newAllergy, setNewAllergy] = useState('');

  // Load user settings
  useEffect(() => {
    const loadSettings = () => {
      try {
        // Attempt to load settings from localStorage
        const storedSettings = localStorage.getItem(SETTINGS_KEY);
        
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings) as UserSettings);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading settings:', err);
        setError('Failed to load settings');
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save user settings
  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Save settings to localStorage
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      
      setSuccess(true);
      setSaving(false);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError((err as Error).message);
      setSaving(false);
    }
  };

  // Add dietary preference
  const addDietaryPreference = () => {
    if (newPreference.trim() && !settings.dietaryPreferences.includes(newPreference.trim())) {
      setSettings({
        ...settings,
        dietaryPreferences: [...settings.dietaryPreferences, newPreference.trim()],
      });
      setNewPreference('');
    }
  };

  // Remove dietary preference
  const removeDietaryPreference = (preference: string) => {
    setSettings({
      ...settings,
      dietaryPreferences: settings.dietaryPreferences.filter(p => p !== preference),
    });
  };

  // Add allergy
  const addAllergy = () => {
    if (newAllergy.trim() && !settings.allergies.includes(newAllergy.trim())) {
      setSettings({
        ...settings,
        allergies: [...settings.allergies, newAllergy.trim()],
      });
      setNewAllergy('');
    }
  };

  // Remove allergy
  const removeAllergy = (allergy: string) => {
    setSettings({
      ...settings,
      allergies: settings.allergies.filter(a => a !== allergy),
    });
  };

  // Change theme
  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setSettings({
      ...settings,
      theme,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Settings</h2>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-600">Settings saved successfully!</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Display Name */}
          <div className="grid gap-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              type="text"
              value={settings.displayName}
              onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
              placeholder="Your name"
            />
          </div>

          {/* Theme Selection */}
          <div className="grid gap-2">
            <Label>Theme</Label>
            <div className="flex space-x-2">
              <Button
                type="button"
                onClick={() => handleThemeChange('light')}
                variant={settings.theme === 'light' ? 'default' : 'outline'}
                size="sm"
              >
                Light
              </Button>
              <Button
                type="button"
                onClick={() => handleThemeChange('dark')}
                variant={settings.theme === 'dark' ? 'default' : 'outline'}
                size="sm"
              >
                Dark
              </Button>
              <Button
                type="button"
                onClick={() => handleThemeChange('system')}
                variant={settings.theme === 'system' ? 'default' : 'outline'}
                size="sm"
              >
                System
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dietary Preferences</CardTitle>
          <CardDescription>These will be used to suggest recipes that match your preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dietary Preferences */}
          <div className="grid gap-2">
            <Label>Preferences</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {settings.dietaryPreferences.map((preference) => (
                <Badge
                  key={preference}
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/90"
                  onClick={() => removeDietaryPreference(preference)}
                >
                  {preference}
                  <span className="ml-1 text-muted-foreground">×</span>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                value={newPreference}
                onChange={(e) => setNewPreference(e.target.value)}
                placeholder="Add preference (e.g., vegetarian)"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={addDietaryPreference}
                variant="secondary"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Allergies */}
          <div className="grid gap-2">
            <Label>Allergies</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {settings.allergies.map((allergy) => (
                <Badge
                  key={allergy}
                  variant="destructive"
                  className="cursor-pointer hover:bg-destructive/90"
                  onClick={() => removeAllergy(allergy)}
                >
                  {allergy}
                  <span className="ml-1 opacity-70">×</span>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder="Add allergy (e.g., peanuts)"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={addAllergy}
                variant="destructive"
              >
                Add
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : 'Save Settings'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Settings; 