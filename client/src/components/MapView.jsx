import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom Icons
const deliveryIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png", // truck
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

const pickupIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/854/854894.png", // store
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const dropIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png", // pin
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

// Map Component
function MapComponent({ listings, selectedListing }) {
  const pickup = [28.6139, 77.209]; // Delhi
  const drop = [28.7041, 77.1025]; // Delhi (other point)

  const [deliveryPos, setDeliveryPos] = useState(pickup);

  // Simulate delivery truck movement
  useEffect(() => {
    let step = 0;
    const interval = setInterval(() => {
      step += 0.02;
      if (step >= 1) {
        clearInterval(interval);
      } else {
        setDeliveryPos([
          pickup[0] + (drop[0] - pickup[0]) * step,
          pickup[1] + (drop[1] - pickup[1]) * step,
        ]);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <MapContainer
      center={pickup}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
      />

      {/* Pickup Marker */}
      <Marker position={pickup} icon={pickupIcon}>
        <Popup>Pickup Location</Popup>
      </Marker>

      {/* Drop Marker */}
      <Marker position={drop} icon={dropIcon}>
        <Popup>Drop Location</Popup>
      </Marker>

      {/* Delivery Truck Moving */}
      <Marker position={deliveryPos} icon={deliveryIcon}>
        <Popup>Delivery in Progress...</Popup>
      </Marker>

      {/* Route */}
      <Polyline positions={[pickup, drop]} color="blue" />

      {/* Show Listings as Normal Markers */}
      {listings.map((listing) => (
        <Marker key={listing.id} position={listing.location}>
          <Popup>{listing.title}</Popup>
        </Marker>
      ))}

      {/* Highlight Selected Listing */}
      {selectedListing && (
        <CircleMarker
          center={selectedListing.location}
          radius={15}
          pathOptions={{ color: "red", weight: 3 }}
        >
          <Popup>{selectedListing.title} (Selected)</Popup>
        </CircleMarker>
      )}
    </MapContainer>
  );
}

export default function MapView() {
  const [selectedListing, setSelectedListing] = useState(null);

  // Listings
  const [listings] = useState([
    {
      id: "1",
      title: "Fresh Biryani",
      imageUrl: "/food1.jpg",
      location: [28.6139, 77.209],
    },
    {
      id: "2",
      title: "Paneer Tikka",
      imageUrl: "/food2.jpg",
      location: [28.7041, 77.1025],
    },
  ]);

  const handleClaim = (listing) => {
    setSelectedListing(listing);
    alert(`Claimed food: ${listing.title}`);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Left side - Food Listings */}
      <div className="space-y-4">
        {listings.map((listing) => (
          <div
            key={listing.id}
            className={`rounded-lg p-4 flex items-center gap-4 cursor-pointer ${
              selectedListing?.id === listing.id
                ? "bg-green-700"
                : "bg-gray-800"
            }`}
            onClick={() => setSelectedListing(listing)}
          >
            <img
              src={listing.imageUrl}
              alt={listing.title}
              width={80}
              height={80}
              className="rounded-lg"
            />
            <div className="flex-1">
              <h3 className="text-white font-medium">{listing.title}</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClaim(listing);
                }}
                className="mt-2 px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded"
              >
                Claim Food
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Right side - Map */}
      <div className="h-96 md:h-auto">
        <MapComponent
          listings={listings}
          selectedListing={selectedListing}
        />
      </div>
    </div>
  );
}
