import React, { useState, useEffect } from 'react';
import { useInventoryStore } from '../lib/store';
import { InventoryItem, OpenFoodProduct } from '../types';
import { formatDate } from '../lib/utils';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface InventoryFormProps {
  initialItem?: InventoryItem | null;
  productData?: OpenFoodProduct | null;
  onComplete: () => void;
  onCancel: () => void;
}

const InventoryForm: React.FC<InventoryFormProps> = ({
  initialItem,
  productData,
  onComplete,
  onCancel,
}) => {
  const { addItem, updateItem } = useInventoryStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('item');
  const [expirationDate, setExpirationDate] = useState<string>('');
  const [purchasedDate, setPurchasedDate] = useState<string>(
    formatDate(new Date())
  );
  const [notes, setNotes] = useState('');
  const [barcode, setBarcode] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Common categories for food items
  const categories = [
    'fruits',
    'vegetables',
    'dairy',
    'meat',
    'seafood',
    'grains',
    'snacks',
    'beverages',
    'condiments',
    'baking',
    'canned',
    'frozen',
    'spices',
  ];

  // Common units for food items
  const units = [
    'item',
    'g',
    'kg',
    'ml',
    'l',
    'cup',
    'tbsp',
    'tsp',
    'oz',
    'lb',
    'bunch',
    'piece',
    'box',
    'can',
    'bottle',
    'jar',
    'pack',
  ];

  // Initialize form with existing item data or product data
  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name);
      setCategory(initialItem.category || categories[0]); // Default to first category if empty
      setQuantity(initialItem.quantity);
      setUnit(initialItem.unit);
      setExpirationDate(
        initialItem.expirationDate ? formatDate(initialItem.expirationDate) : ''
      );
      setPurchasedDate(
        initialItem.purchasedDate ? formatDate(initialItem.purchasedDate) : ''
      );
      setNotes(initialItem.notes || '');
      setBarcode(initialItem.barcode || '');
      setImageUrl(initialItem.imageUrl || '');
    } else if (productData && productData.product) {
      setName(productData.product.product_name || 'Unknown Product');
      
      // Try to extract category from product data
      const productCategory = productData.product.categories
        ? productData.product.categories.split(',')[0].trim().toLowerCase()
        : '';
      
      // Use the product category if it exists in our categories list, otherwise use the first category
      setCategory(
        categories.includes(productCategory) ? productCategory : categories[0]
      );
      
      setBarcode(productData.code || '');
      setImageUrl(productData.product.image_url || '');
      
      // Try to parse quantity from product data
      if (productData.product.quantity) {
        const quantityMatch = productData.product.quantity.match(/\d+/);
        if (quantityMatch) {
          setQuantity(parseInt(quantityMatch[0], 10));
        }
      }
    }
  }, [initialItem, productData, categories]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate category is not empty
      if (!category) {
        setError("Category cannot be empty");
        setLoading(false);
        return;
      }
      
      const itemData: Omit<InventoryItem, 'id'> = {
        name,
        category,
        quantity,
        unit,
        expirationDate: expirationDate ? new Date(expirationDate) : undefined,
        purchasedDate: purchasedDate ? new Date(purchasedDate) : undefined,
        notes: notes || undefined,
        barcode: barcode || undefined,
        imageUrl: imageUrl || undefined,
      };

      console.log('Attempting to add/update item with data:', itemData);

      if (initialItem) {
        console.log('Updating existing item with ID:', initialItem.id);
        await updateItem({ ...itemData, id: initialItem.id });
      } else {
        console.log('Adding new item');
        await addItem(itemData);
      }

      console.log('Item successfully saved!');
      setLoading(false);
      onComplete();
    } catch (err) {
      console.error('Error saving item:', err);
      setError(`Error saving item: ${(err as Error).message}`);
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">
        {initialItem ? 'Edit' : 'Add'} Inventory Item
      </h2>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            {/* Image Preview */}
            {imageUrl && (
              <div className="flex justify-center mb-6">
                <img
                  src={imageUrl}
                  alt={name}
                  className="h-32 w-32 object-contain border rounded"
                />
              </div>
            )}

            {/* Barcode */}
            {barcode && (
              <div className="bg-muted p-2 rounded text-center text-sm text-muted-foreground mb-6">
                Barcode: {barcode}
              </div>
            )}

            <div className="grid gap-4">
              {/* Name */}
              <div className="grid gap-2">
                <Label htmlFor="item-name">Name *</Label>
                <Input
                  id="item-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Category */}
              <div className="grid gap-2">
                <Label htmlFor="item-category">Category *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="item-category">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity and Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="item-quantity">Quantity *</Label>
                  <Input
                    id="item-quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value))}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="item-unit">Unit *</Label>
                  <Select value={unit} onValueChange={setUnit} required>
                    <SelectTrigger id="item-unit">
                      <SelectValue placeholder="Select Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Expiration Date */}
              <div className="grid gap-2">
                <Label htmlFor="expiration-date">Expiration Date</Label>
                <Input
                  id="expiration-date"
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                />
              </div>

              {/* Purchase Date */}
              <div className="grid gap-2">
                <Label htmlFor="purchase-date">Purchase Date</Label>
                <Input
                  id="purchase-date"
                  type="date"
                  value={purchasedDate}
                  onChange={(e) => setPurchasedDate(e.target.value)}
                />
              </div>

              {/* Notes */}
              <div className="grid gap-2">
                <Label htmlFor="item-notes">Notes</Label>
                <textarea
                  id="item-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 p-6 pt-0">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : initialItem ? 'Update' : 'Add'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default InventoryForm; 