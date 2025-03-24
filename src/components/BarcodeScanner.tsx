import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { searchProductByBarcode } from '../services/openFoodApi';
import { useInventoryStore } from '../lib/store';
import { OpenFoodProduct } from '../types';
import Quagga from 'quagga';

interface BarcodeScannerProps {
  onProductFound: (product: OpenFoodProduct) => void;
  onScanComplete: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onProductFound, 
  onScanComplete 
}) => {
  // State variables
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [barcode, setBarcode] = useState<string>('');
  const [detectedCodes, setDetectedCodes] = useState<{[key: string]: number}>({});
  const [lastDetectedCode, setLastDetectedCode] = useState<string | null>(null);
  const [isCameraSupported, setIsCameraSupported] = useState(true);
  
  // Refs
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const handlersSetupRef = useRef(false);
  const detectedCodesRef = useRef<{[key: string]: number}>({});
  
  // Store access
  const { searchByBarcode } = useInventoryStore();

  // Function to handle barcode detection - defined early to avoid circular references
  function handleBarcodeDetection(result: any) {
    if (!result || !result.codeResult) return;
    
    // Debug the entire result structure to see what's available
    console.log('Detected barcode full result:', result);
    
    const code = result.codeResult.code;
    
    // Check for confidence in different possible locations
    let confidence;
    if (result.codeResult.confidence !== undefined) {
      confidence = result.codeResult.confidence;
    } else if (result.codeResult.decodedCodes && result.codeResult.decodedCodes.length > 0) {
      // Some versions of Quagga store confidence in decodedCodes
      const decodedConfidences = result.codeResult.decodedCodes
        .filter((dc: any) => dc.confidence)
        .map((dc: any) => dc.confidence);
      
      if (decodedConfidences.length > 0) {
        // Use the average confidence from all decoded segments
        confidence = decodedConfidences.reduce((a: number, b: number) => a + b, 0) / decodedConfidences.length;
      }
    }
    
    console.log(`Detected barcode: ${code} (confidence: ${confidence !== undefined ? confidence.toFixed(2) : 'unknown'})`);
    
    // Set a default threshold if confidence is undefined
    const confidenceThreshold = 0.7;
    
    // Only check confidence threshold if confidence is defined
    if (confidence !== undefined && confidence < confidenceThreshold) {
      console.log(`Low confidence detection (${confidence.toFixed(2)} < ${confidenceThreshold}), ignoring...`);
      return;
    }
    
    // Continue processing even if confidence is undefined
    // We'll rely on multiple detections for accuracy
    
    // Keep track of detected codes and their frequency using both state and ref
    console.log('CURRENT REF VALUE:', detectedCodesRef.current);
    
    // Get current count (if any) for this code
    const currentCount = detectedCodesRef.current[code] || 0;
    const newCount = currentCount + 1;
    
    console.log(`Updating count for ${code}: ${currentCount} -> ${newCount}`);
    
    // Update both the ref and state
    detectedCodesRef.current = {
      ...detectedCodesRef.current,
      [code]: newCount
    };
    
    // Direct processing if threshold reached
    if (newCount >= 3) {
      console.log(`Direct trigger: Barcode ${code} detected ${newCount} times`);
      // We'll use setTimeout to avoid state update issues
      setTimeout(() => {
        if (scanning) {  // Double-check we're still scanning
          console.log(`Processing barcode directly: ${code}`);
          processDetectedBarcode(code);
        }
      }, 100);
    }
    
    // Update state (might batch with other updates)
    setDetectedCodes({...detectedCodesRef.current});
    
    setLastDetectedCode(code);
  }

  // Function to handle processed frames
  function handleProcessedFrame(result: any) {
    if (!result) return;
    
    const drawingCanvas = document.querySelector('.drawingBuffer') as HTMLCanvasElement;
    if (!drawingCanvas || !drawingCanvas.getContext) return;
    
    const ctx = drawingCanvas.getContext('2d');
    if (!ctx) return;
    
    try {
      // Handle boxes
      if (result.boxes) {
        drawingCanvas.style.display = 'block';
        
        // Clear the canvas
        const width = parseInt(drawingCanvas.getAttribute('width') || '0');
        const height = parseInt(drawingCanvas.getAttribute('height') || '0');
        
        if (width && height) {
          ctx.clearRect(0, 0, width, height);
          
          // Draw the detection boxes
          result.boxes
            .filter((box: any) => box !== result.box)
            .forEach((box: any) => {
              if (box && Quagga.ImageDebug) {
                Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, ctx, { color: "green", lineWidth: 2 });
              }
            });
        }
      }
      
      // Handle main box
      if (result.box && Quagga.ImageDebug) {
        Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, ctx, { color: "#00F", lineWidth: 2 });
      }
      
      // Handle result lines
      if (result.codeResult && result.codeResult.code && Quagga.ImageDebug) {
        Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, ctx, { color: 'red', lineWidth: 3 });
      }
    } catch (err) {
      console.error('Error in handleProcessed:', err);
    }
  }

  // Function to stop the barcode scanner
  function stopScanner() {
    if (scanning) {
      console.log('Stopping Quagga scanner');
      try {
        Quagga.offDetected(handleBarcodeDetection);
        Quagga.offProcessed(handleProcessedFrame);
        Quagga.stop();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    
    setScanning(false);
    setDetectedCodes({});
    detectedCodesRef.current = {};
    setLastDetectedCode(null);
    handlersSetupRef.current = false;
  }

  // Process detected barcode
  async function processDetectedBarcode(code: string) {
    setError(null);
    
    try {
      console.log(`Processing barcode: ${code}`);
      
      // First check if the item already exists in inventory
      const existingItem = await searchByBarcode(code);
      
      if (existingItem) {
        setError('This item is already in your inventory');
        stopScanner(); // Stop scanner after displaying error
        return;
      }
      
      console.log(`Looking up product in Open Food Facts API: ${code}`);
      
      // Search for the product in Open Food Facts API
      const product = await searchProductByBarcode(code);
      
      console.log('API response:', product);
      
      if (product) {
        console.log('Product found, notifying parent component');
        // Stop scanner before notifying parent component
        stopScanner();
        onProductFound(product);
        onScanComplete();
      } else {
        console.log('No product found');
        setError(`Product with barcode ${code} not found. Try manual entry.`);
        stopScanner(); // Stop scanner after displaying error
      }
    } catch (err) {
      console.error('Error processing barcode:', err);
      setError(`Error processing barcode: ${err instanceof Error ? err.message : 'Unknown error'}`);
      stopScanner(); // Stop scanner after displaying error
    }
  }
  
  // Function to handle manual barcode entry
  async function handleManualEntry() {
    if (!barcode) {
      setError('Please enter a barcode');
      return;
    }
    
    await processDetectedBarcode(barcode);
  }
  
  // Check if camera is supported on component mount
  useEffect(() => {
    const checkCameraSupport = async () => {
      try {
        // Check if navigator.mediaDevices exists
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.warn('MediaDevices API or getUserMedia not supported');
          setIsCameraSupported(false);
          setError('Your browser does not support camera access. Try using Chrome or Safari.');
          return false;
        }
        
        // Try to get camera access to confirm permissions
        await navigator.mediaDevices.getUserMedia({ video: true });
        console.log('Camera access is supported');
        return true;
      } catch (err) {
        console.error('Camera access check failed:', err);
        setIsCameraSupported(navigator.mediaDevices && navigator.mediaDevices.getUserMedia !== undefined);
        if (err instanceof Error && err.name === 'NotAllowedError') {
          setError('Camera access was denied. Please enable camera permissions.');
        } else if (err instanceof Error && err.name === 'NotFoundError') {
          setError('No camera found on this device.');
        } else {
          setError('Camera access is not available in this browser or environment.');
        }
        return false;
      }
    };
    
    checkCameraSupport();
  }, []);

  // Initialize the Quagga scanner
  function initializeScanner() {
    if (!scannerContainerRef.current) {
      console.error('Scanner container ref is null');
      setError('Scanner initialization failed: video container not available');
      setScanning(false);
      return;
    }

    console.log('Initializing Quagga scanner with container:', scannerContainerRef.current);
    
    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: scannerContainerRef.current,
        constraints: {
          width: { min: 300 },
          height: { min: 225 },
          facingMode: "environment", // Use the back camera
          aspectRatio: { min: 1, max: 2 }
        },
        area: { // Define scan area (80% of container)
          top: "10%",
          right: "10%", 
          left: "10%", 
          bottom: "10%"
        },
      },
      locator: {
        patchSize: "medium", // x-small, small, medium, large, x-large
        halfSample: true     // Increase speed by half-sampling first
      },
      numOfWorkers: 2,
      frequency: 10, // Scan every 10 frames
      decoder: {
        readers: [
          "ean_reader",
          "ean_8_reader",
          "upc_reader",
          "upc_e_reader",
          "code_128_reader"
        ],
        debug: {
          drawBoundingBox: true,
          showFrequency: true,
          drawScanline: true,
          showPattern: true
        }
      },
      locate: true
    }, (err) => {
      if (err) {
        console.error('Quagga initialization error:', err);
        setError(`Camera initialization error: ${err}`);
        setScanning(false);
        return;
      }
      
      console.log('Quagga initialized successfully');
      
      try {
        Quagga.start();
        
        // Draw scanning guides
        const canvas = document.querySelector('.drawingBuffer') as HTMLCanvasElement;
        if (canvas) {
          canvas.style.position = 'absolute';
          canvas.style.top = '0';
          canvas.style.left = '0';
          canvas.style.right = '0';
          canvas.style.bottom = '0';
          canvas.style.width = '100%';
          canvas.style.height = '100%';
          canvas.style.objectFit = 'cover';
        }

        // Set up barcode detection handler
        if (!handlersSetupRef.current) {
          Quagga.onDetected(handleBarcodeDetection);
          
          // Add processed handler for debugging
          Quagga.onProcessed(handleProcessedFrame);
          
          handlersSetupRef.current = true;
        }
      } catch (initErr) {
        console.error('Error during Quagga start:', initErr);
        setError(`Error starting camera: ${initErr instanceof Error ? initErr.message : 'Unknown error'}`);
        setScanning(false);
      }
    });
  }
  
  // Function to start the barcode scanner
  async function startScanner() {
    setError(null);
    setScanning(true);
    setDetectedCodes({});
    detectedCodesRef.current = {};
    setLastDetectedCode(null);
    
    try {
      // First check if camera is supported
      if (!isCameraSupported) {
        throw new Error('Camera access is not supported in this browser');
      }
      
      // Delay scanner initialization slightly to ensure DOM is fully ready
      setTimeout(() => {
        initializeScanner();
      }, 500); // Increased delay for mobile
    } catch (err) {
      console.error("Scanner initialization error:", err);
      setError(`Unable to start scanner: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setScanning(false);
    }
  }
  
  // Monitor detectedCodes changes and process consistent detections
  useEffect(() => {
    console.log('Effect triggered - Current detection counts STATE:', detectedCodes);
    console.log('Effect triggered - Current detection counts REF:', detectedCodesRef.current);
    
    if (!scanning) {
      console.log('Not scanning, skipping processing');
      return;
    }
    
    // Use ref value for checking detection threshold
    const consistentCode = Object.entries(detectedCodesRef.current).find(
      ([_, count]) => count >= 2
    );
    
    if (consistentCode) {
      const [code, count] = consistentCode;
      console.log(`Barcode ${code} detected ${count} times, processing...`);
      processDetectedBarcode(code);
    } else {
      console.log('No codes have reached the detection threshold yet');
    }
  }, [detectedCodes, scanning]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="p-6 flex flex-col items-center space-y-6">
      <Card className="w-full max-w-md overflow-hidden">
        <CardContent className="p-0">
          <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden">
            {scanning ? (
              <>
                <div 
                  ref={scannerContainerRef} 
                  className="absolute inset-0 w-full h-full z-10 scanner-container"
                />
                {/* Scanner overlay with guides */}
                <div className="absolute inset-0 z-30 pointer-events-none">
                  {/* Overlay with transparent center */}
                  <div className="absolute inset-0 bg-black bg-opacity-30">
                    {/* Transparent scanning window */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/2 border-2 border-white rounded-lg">
                      {/* Corner markers */}
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500"></div>
                      
                      {/* Scanner line */}
                      <div 
                        id="scan-line" 
                        className="absolute left-0 w-full h-0.5 bg-red-500" 
                        style={{ 
                          animation: 'scanAnimation 2s infinite ease-in-out',
                          top: '50%',
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full bg-muted">
                <p className="text-muted-foreground">{isCameraSupported ? 'Camera inactive' : 'Camera not supported'}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {scanning && (
        <div id="video-status" className="text-sm text-center w-full max-w-md">
          {lastDetectedCode ? (
            <p className="text-green-600">
              Detected code: {lastDetectedCode}
            </p>
          ) : (
            <p className="text-amber-600">Position barcode in the scanning area...</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Keep the barcode steady and well-lit for best results</p>
        </div>
      )}
      
      <div className="w-full max-w-md">
        {scanning ? (
          <Button 
            variant="destructive" 
            className="w-full" 
            onClick={stopScanner}
          >
            Cancel Scan
          </Button>
        ) : (
          <Button 
            variant="default" 
            className="w-full" 
            onClick={startScanner}
            disabled={!isCameraSupported}
          >
            {isCameraSupported ? 'Start Scanner' : 'Scanner Not Available'}
          </Button>
        )}
      </div>
      
      <div className="w-full max-w-md space-y-2">
        <p className="text-sm text-center text-muted-foreground">
          {isCameraSupported ? 'OR' : 'USE MANUAL ENTRY'}
        </p>
        <div className="flex gap-2">
          <Input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Enter barcode manually"
            className="flex-1"
          />
          <Button variant="secondary" onClick={handleManualEntry}>
            Search
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="w-full max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default BarcodeScanner;