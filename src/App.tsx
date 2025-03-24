import { useState, useEffect, useRef } from 'react'
import { useInventoryStore } from './lib/store'
import InventoryList from './components/InventoryList'
import BarcodeScanner from './components/BarcodeScanner'
import InventoryForm from './components/InventoryForm'
import RecipeSuggestions from './components/RecipeSuggestions'
import Settings from './components/Settings'
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import { Button } from '@/components/ui/button'
import { OpenFoodProduct, InventoryItem } from './types'
import {
  Home,
  ScanLine, 
  ChefHat,
  Settings2, 
  Plus,
  RefrigeratorIcon
} from "lucide-react"

function App() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'scan' | 'recipes' | 'settings'>('inventory')
  const [isEditing, setIsEditing] = useState(false)
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null)
  const [scannedProduct, setScannedProduct] = useState<OpenFoodProduct | null>(null)
  const { fetchInventory } = useInventoryStore()
  const { toast } = useToast()
  const welcomeToastShown = useRef(false)

  // Load inventory data on component mount
  useEffect(() => {
    fetchInventory()
    
    // Welcome toast notification - only show once
    if (!welcomeToastShown.current) {
      toast({
        title: "Kitchen Inventory App",
        description: "Manage your food items and get recipe suggestions."
      })
      welcomeToastShown.current = true
    }
  }, [fetchInventory, toast])

  // Handle product found from barcode scanner
  const handleProductFound = (product: OpenFoodProduct) => {
    setScannedProduct(product)
    setIsEditing(true)
    toast({
      title: "Product found",
      description: `${product.product?.product_name || 'Product'} found and ready to add to inventory.`
    })
  }

  // Handle edit item
  const handleEditItem = (item: InventoryItem) => {
    setCurrentItem(item)
    setIsEditing(true)
    setActiveTab('scan') // Reuse the form in scan tab
  }

  // Handle form completion
  const handleFormComplete = () => {
    setIsEditing(false)
    setCurrentItem(null)
    setScannedProduct(null)
    toast({
      title: "Success",
      description: "Item saved to inventory!"
    })
  }

  // Handle form cancel
  const handleFormCancel = () => {
    setIsEditing(false)
    setCurrentItem(null)
    setScannedProduct(null)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* App Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefrigeratorIcon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Kitchen Inventory</h1>
          </div>
          <Button 
            variant="default"
            size="sm"
            onClick={() => {
              setIsEditing(true)
              setActiveTab('scan')
            }}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 sm:px-6 pb-24">
        {/* Main Content Area */}
        <div className="bg-card shadow rounded-lg overflow-hidden border border-border">
          {activeTab === 'inventory' && !isEditing && (
            <InventoryList onEditItem={handleEditItem} />
          )}

          {activeTab === 'scan' && !isEditing && (
            <BarcodeScanner 
              onProductFound={handleProductFound} 
              onScanComplete={() => {}} 
            />
          )}

          {isEditing && (
            <InventoryForm
              initialItem={currentItem}
              productData={scannedProduct}
              onComplete={handleFormComplete}
              onCancel={handleFormCancel}
            />
          )}

          {activeTab === 'recipes' && (
            <RecipeSuggestions />
          )}

          {activeTab === 'settings' && (
            <Settings />
          )}
        </div>
      </main>

      {/* Navigation Tabs */}
      <div className="fixed bottom-0 left-0 right-0 w-full bg-card border-t border-border shadow-lg z-10">
        <div className="container mx-auto">
          <div className="flex justify-around">
            <Button
              variant="ghost"
              className="flex flex-col items-center py-3 px-5 h-auto rounded-none"
              onClick={() => setActiveTab('inventory')}
            >
              <Home className={`h-5 w-5 mb-1 ${activeTab === 'inventory' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-xs ${activeTab === 'inventory' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Inventory</span>
            </Button>
            
            <Button
              variant="ghost"
              className="flex flex-col items-center py-3 px-5 h-auto rounded-none"
              onClick={() => setActiveTab('scan')}
            >
              <ScanLine className={`h-5 w-5 mb-1 ${activeTab === 'scan' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-xs ${activeTab === 'scan' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Scan</span>
            </Button>
            
            <Button
              variant="ghost"
              className="flex flex-col items-center py-3 px-5 h-auto rounded-none"
              onClick={() => setActiveTab('recipes')}
            >
              <ChefHat className={`h-5 w-5 mb-1 ${activeTab === 'recipes' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-xs ${activeTab === 'recipes' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Recipes</span>
            </Button>
            
            <Button
              variant="ghost"
              className="flex flex-col items-center py-3 px-5 h-auto rounded-none"
              onClick={() => setActiveTab('settings')}
            >
              <Settings2 className={`h-5 w-5 mb-1 ${activeTab === 'settings' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-xs ${activeTab === 'settings' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Settings</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Toast Notifications */}
      <Toaster />
    </div>
  )
}

export default App
