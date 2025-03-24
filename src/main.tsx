import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Type extensions for legacy browser support
declare global {
  interface Navigator {
    webkitGetUserMedia?: (constraints: MediaStreamConstraints, 
                          successCallback: (stream: MediaStream) => void,
                          errorCallback: (error: Error) => void) => void;
    mozGetUserMedia?: (constraints: MediaStreamConstraints, 
                      successCallback: (stream: MediaStream) => void,
                      errorCallback: (error: Error) => void) => void;
  }
}

// Polyfills for older browsers
// Ensure getUserMedia compatibility
if (!navigator.mediaDevices) {
  // Using any to bypass the readonly restriction
  (navigator as any).mediaDevices = {};
}

// Some browsers partially implement mediaDevices
if (navigator.mediaDevices && !navigator.mediaDevices.getUserMedia) {
  // Using any to bypass TypeScript issues
  (navigator.mediaDevices as any).getUserMedia = function(constraints: MediaStreamConstraints) {
    // First get ahold of the legacy getUserMedia, if present
    const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    // Some browsers just don't implement it - return a rejected promise with an error
    if (!getUserMedia) {
      return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
    }

    // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
    return new Promise(function(resolve, reject) {
      getUserMedia.call(navigator, constraints, resolve, reject);
    });
  };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
