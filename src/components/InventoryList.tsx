import React, { useState } from 'react';
import { useInventoryStore } from '../lib/store';
import { InventoryItem } from '../types';
import { formatDate, daysUntilExpiration, getCategoryIcon } from '../lib/utils';
import { 
  Search, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle 
} from 'lucide-react';

import { 
  Card, 
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface InventoryListProps {
  onEditItem: (item: InventoryItem) => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ onEditItem }) => {
  const { items, loading, deleteItem } = useInventoryStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const { toast } = useToast();

  // Get unique categories from inventory - filter out any empty strings
  const categories = Array.from(new Set(items.map(item => item.category))).filter(category => category.trim() !== '');

  // Handle item deletion with confirmation
  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from your inventory?`)) {
      await deleteItem(id);
      toast({
        title: "Item deleted",
        description: `${name} has been removed from your inventory.`
      });
    }
  };

  // Filter and sort items
  const filteredItems = items
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' ? true : item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'category') {
        comparison = a.category.localeCompare(b.category);
      } else if (sortBy === 'quantity') {
        comparison = a.quantity - b.quantity;
      } else if (sortBy === 'expiration') {
        const daysA = daysUntilExpiration(a.expirationDate);
        const daysB = daysUntilExpiration(b.expirationDate);
        comparison = daysA - daysB;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Handle sort change
  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Get expiration status color
  const getExpirationStatusColor = (days: number) => {
    if (days <= 0) return "text-destructive";
    if (days <= 3) return "text-orange-500 dark:text-orange-400";
    if (days <= 7) return "text-amber-500 dark:text-amber-400";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-4 p-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            type="text"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="w-full sm:w-48">
          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  <div className="flex items-center gap-2">
                    <span>{getCategoryIcon(category)}</span>
                    <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Sort Controls */}
      <div className="flex flex-wrap gap-2">
        <div className="text-sm font-medium text-muted-foreground flex items-center mr-2">Sort by:</div>
        {['name', 'category', 'quantity', 'expiration'].map((field) => (
          <Badge
            key={field}
            variant={sortBy === field ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => handleSortChange(field)}
          >
            {field.charAt(0).toUpperCase() + field.slice(1)}
            {sortBy === field && (
              sortOrder === 'asc' 
                ? <ChevronUp className="ml-1 h-3 w-3" /> 
                : <ChevronDown className="ml-1 h-3 w-3" />
            )}
          </Badge>
        ))}
      </div>
      
      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-secondary p-3 mb-3">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No items found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add items to your inventory to get started or try a different search.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map(item => {
            const daysLeft = daysUntilExpiration(item.expirationDate);
            const expirationStatusColor = getExpirationStatusColor(daysLeft);
            
            return (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-2xl">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <h3 className="text-base font-medium text-foreground truncate">{item.name}</h3>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {item.quantity} {item.unit}
                        </span>
                        
                        {item.expirationDate && (
                          <span className={`text-xs ${expirationStatusColor}`}>
                            Expires: {formatDate(item.expirationDate)}
                            {daysLeft <= 7 && (
                              <span className="ml-1">
                                ({daysLeft <= 0 ? 'Expired' : `${daysLeft} day${daysLeft === 1 ? '' : 's'}`})
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                      {item.notes && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.notes}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-0 flex border-t divide-x">
                  <Button 
                    variant="ghost" 
                    onClick={() => onEditItem(item)} 
                    className="flex-1 rounded-none py-2 h-auto text-xs font-medium text-primary"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleDelete(item.id, item.name)} 
                    className="flex-1 rounded-none py-2 h-auto text-xs font-medium text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InventoryList;