import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Clock, Users, BarChart } from "lucide-react";
import { useInventoryStore } from '../lib/store';
import { generateRecipeSuggestions } from '../services/claudeApi';
import { Recipe } from '../types';
import { formatTime } from '../lib/utils';

const RecipeSuggestions: React.FC = () => {
  const { items } = useInventoryStore();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);

  // Load settings from localStorage on component mount
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('kitchen_inventory_settings');
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        if (settings.dietaryPreferences && settings.dietaryPreferences.length > 0) {
          console.log('Loaded dietary preferences from settings:', settings.dietaryPreferences);
          setDietaryPreferences(settings.dietaryPreferences);
        }
        if (settings.allergies && settings.allergies.length > 0) {
          console.log('Loaded allergies from settings:', settings.allergies);
          setAllergies(settings.allergies);
        }
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  }, []);

  // Handle generating recipe suggestions
  const handleGenerateRecipes = async () => {
    setLoading(true);
    setError(null);

    try {
      // Log the preferences and allergies being sent
      console.log('Generating recipes with preferences:', dietaryPreferences);
      console.log('Generating recipes with allergies:', allergies);

      const suggestions = await generateRecipeSuggestions(
        items,
        '', // Empty API key, the Firebase function will use its own config
        dietaryPreferences,
        allergies
      );

      setRecipes(suggestions);
      setLoading(false);
    } catch (err) {
      console.error('Recipe suggestion error:', err);
      setError((err as Error).message);
      setLoading(false);
    }
  };

  // Handle adding a dietary preference
  const handleAddDietaryPreference = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      const newPreference = e.currentTarget.value.trim();
      if (!dietaryPreferences.includes(newPreference)) {
        setDietaryPreferences([...dietaryPreferences, newPreference]);
      }
      e.currentTarget.value = '';
    }
  };

  // Handle adding an allergy
  const handleAddAllergy = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      const newAllergy = e.currentTarget.value.trim();
      if (!allergies.includes(newAllergy)) {
        setAllergies([...allergies, newAllergy]);
      }
      e.currentTarget.value = '';
    }
  };

  // Handle removing a dietary preference
  const handleRemoveDietaryPreference = (preference: string) => {
    setDietaryPreferences(dietaryPreferences.filter(p => p !== preference));
  };

  // Handle removing an allergy
  const handleRemoveAllergy = (allergy: string) => {
    setAllergies(allergies.filter(a => a !== allergy));
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Recipe Suggestions</h2>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Preferences & Allergies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">Dietary Preferences</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  try {
                    const storedSettings = localStorage.getItem('kitchen_inventory_settings');
                    if (storedSettings) {
                      const settings = JSON.parse(storedSettings);
                      if (settings.dietaryPreferences && settings.dietaryPreferences.length > 0) {
                        setDietaryPreferences(settings.dietaryPreferences);
                      }
                      if (settings.allergies && settings.allergies.length > 0) {
                        setAllergies(settings.allergies);
                      }
                    }
                  } catch (err) {
                    console.error('Error loading settings:', err);
                  }
                }}
                className="text-xs"
              >
                Sync from Settings
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {dietaryPreferences.map((preference) => (
                <Badge 
                  key={preference} 
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/90"
                  onClick={() => handleRemoveDietaryPreference(preference)}
                >
                  {preference}
                  <span className="ml-1 text-muted-foreground">×</span>
                </Badge>
              ))}
            </div>
            <Input
              type="text"
              placeholder="Add preference (e.g., vegetarian, low-carb)"
              onKeyDown={handleAddDietaryPreference}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Allergies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {allergies.map((allergy) => (
                <Badge 
                  key={allergy} 
                  variant="destructive"
                  className="cursor-pointer hover:bg-destructive/90"
                  onClick={() => handleRemoveAllergy(allergy)}
                >
                  {allergy}
                  <span className="ml-1 opacity-70">×</span>
                </Badge>
              ))}
            </div>
            <Input
              type="text"
              placeholder="Add allergy (e.g., nuts, gluten)"
              onKeyDown={handleAddAllergy}
            />
          </CardContent>
        </Card>
      </div>

      {/* Generate Button */}
      <div className="flex flex-col items-center">
        {(dietaryPreferences.length > 0 || allergies.length > 0) && (
          <div className="text-sm text-muted-foreground mb-4 text-center">
            {dietaryPreferences.length > 0 && (
              <div className="mb-1">
                <span className="font-medium">Preferences:</span> {dietaryPreferences.join(', ')}
              </div>
            )}
            {allergies.length > 0 && (
              <div>
                <span className="font-medium">Allergies:</span> {allergies.join(', ')}
              </div>
            )}
          </div>
        )}
        <Button 
          onClick={handleGenerateRecipes} 
          disabled={loading || items.length === 0}
          className="min-w-40"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </span>
          ) : 'Generate Recipe Suggestions'}
        </Button>
      </div>

      {/* No Items Warning */}
      {items.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Add some items to your inventory to get recipe suggestions.
          </AlertDescription>
        </Alert>
      )}

      {/* Recipe List */}
      <div className="space-y-6">
        {recipes.map((recipe) => (
          <Card key={recipe.id}>
            <CardHeader className="bg-muted border-b">
              <CardTitle>{recipe.title}</CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  <span>Prep: {formatTime(recipe.prepTimeMinutes)}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  <span>Cook: {formatTime(recipe.cookTimeMinutes)}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5 mr-1" />
                  <span>Servings: {recipe.servings}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <BarChart className="h-3.5 w-3.5 mr-1" />
                  <span>Difficulty: {recipe.difficulty}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {recipe.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
              <div>
                <h4 className="font-medium mb-2">Ingredients</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {recipe.ingredients.map((ingredient, idx) => (
                    <li key={idx} className="text-sm">{ingredient}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Instructions</h4>
                <ol className="list-decimal pl-5 space-y-2">
                  {recipe.instructions.map((step, idx) => (
                    <li key={idx} className="text-sm">{step}</li>
                  ))}
                </ol>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RecipeSuggestions; 