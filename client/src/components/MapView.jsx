import { useEffect, useState } from 'react';

export default function TrackOrderMap() {
  // Define coordinates for Ranchi, Jharkhand
  const pickup = [23.3441, 85.3096]; // Ranchi coordinates
  const drop = [23.3550, 85.3200]; // Nearby delivery location in Ranchi
  
  const [deliveryProgress, setDeliveryProgress] = useState(0);
  const [isDelivering, setIsDelivering] = useState(false);
  const [currentPos, setCurrentPos] = useState(pickup);

  // Simulate delivery truck movement
  useEffect(() => {
    if (isDelivering) {
      const interval = setInterval(() => {
        setDeliveryProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsDelivering(false);
            return 100;
          }
          const newProgress = prev + 2;
          
          // Update current position based on progress
          const newLat = pickup[0] + (drop[0] - pickup[0]) * (newProgress / 100);
          const newLng = pickup[1] + (drop[1] - pickup[1]) * (newProgress / 100);
          setCurrentPos([newLat, newLng]);
          
          return newProgress;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isDelivering]);

  const startDelivery = () => {
    setIsDelivering(true);
    setDeliveryProgress(0);
    setCurrentPos(pickup);
  };

  const resetDelivery = () => {
    setIsDelivering(false);
    setDeliveryProgress(0);
    setCurrentPos(pickup);
  };

  // Create Google Maps URL with multiple markers
  const createMapUrl = () => {
    const baseUrl = "https://www.google.com/maps/embed/v1/directions";
    const apiKey = "AIzaSyBFw0Qbyq9zTfTI-RnYoUGYLdLjl5QfkwQ"; // Demo key - replace with your own
    
    return `${baseUrl}?key=${apiKey}&origin=${pickup[0]},${pickup[1]}&destination=${drop[0]},${drop[1]}&mode=driving&zoom=14`;
  };

  return (
    <div className="space-y-4">
      {/* Order Info Header */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">Track Order #hi-order</h2>
            <p className="text-gray-600">Amount: ₹0.00 • Order Date: Sep 1, 2025</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Location: Ranchi, Jharkhand</p>
            <p className="text-xs text-gray-500">23.3441°N, 85.3096°E</p>
          </div>
        </div>
      </div>

      {/* Map Container with Overlay Tracking */}
      <div className="relative">
        {/* Google Maps Iframe */}
        <div className="h-96 w-full rounded-lg overflow-hidden border shadow-lg">
          <iframe
            src={createMapUrl()}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Order Tracking Map"
          ></iframe>
        </div>

        {/* Overlay Tracking Information */}
        <div className="absolute top-4 left-4 right-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800">Live Tracking</h4>
              <div className="flex gap-2">
                <button 
                  onClick={startDelivery}
                  disabled={isDelivering}
                  className={`px-3 py-1 text-xs rounded font-medium ${
                    isDelivering 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {isDelivering ? 'Tracking...' : 'Start Tracking'}
                </button>
                
                <button 
                  onClick={resetDelivery}
                  className="px-3 py-1 text-xs rounded font-medium bg-gray-500 hover:bg-gray-600 text-white"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Progress Visualization */}
            <div className="space-y-3">
              {/* Route Points */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Pickup: Restaurant</span>
                </div>
                
                <div className="flex-1 mx-4">
                  <div className="relative">
                    <div className="h-0.5 bg-gray-300 rounded"></div>
                    <div 
                      className="absolute top-0 h-0.5 bg-green-500 rounded transition-all duration-1000"
                      style={{ width: `${deliveryProgress}%` }}
                    ></div>
                    {/* Moving truck indicator */}
                    <div 
                      className="absolute top-0 w-4 h-4 bg-blue-500 rounded-full transform -translate-y-1.5 -translate-x-2 transition-all duration-1000 flex items-center justify-center"
                      style={{ left: `${deliveryProgress}%` }}
                    >
                      <span className="text-white text-xs"><FaTruck /></span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-medium">Your Location</span>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                </div>
              </div>

              {/* Current Status */}
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                  deliveryProgress === 100 
                    ? 'bg-green-100 text-green-800' 
                    : isDelivering 
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    deliveryProgress === 100 
                      ? 'bg-green-500' 
                      : isDelivering 
                        ? 'bg-blue-500 animate-pulse'
                        : 'bg-gray-400'
                  }`}></div>
                  {deliveryProgress === 100 
                    ? 'Delivered Successfully!' 
                    : isDelivering 
                      ? `En Route - ${deliveryProgress}% Complete`
                      : 'Ready for Delivery'
                  }
                </div>
              </div>

              {/* Live Coordinates */}
              <div className="text-xs text-gray-600 text-center">
                Current Position: {currentPos[0].toFixed(4)}°N, {currentPos[1].toFixed(4)}°E
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Status Panel */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Order #hi-order</span>
              </div>
              <div className="text-xs text-gray-600">
                ETA: {isDelivering ? `${Math.ceil((100 - deliveryProgress) / 2)} min` : '-- min'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Tracking Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h5 className="font-semibold mb-2">Route Information</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Distance:</span>
              <span className="font-medium">~1.2 km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Est. Time:</span>
              <span className="font-medium">8-12 minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Mode:</span>
              <span className="font-medium">Vehicle Delivery</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <h5 className="font-semibold mb-2">Delivery Status</h5>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Order Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${deliveryProgress > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span>Picked Up</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isDelivering ? 'bg-blue-500 animate-pulse' : deliveryProgress === 100 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span>In Transit</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${deliveryProgress === 100 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span>Delivered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}