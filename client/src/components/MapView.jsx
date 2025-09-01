import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Map Component
function MapComponent({ listings, selectedListing, onSelectListing }) {
  return (
    <MapContainer
      center={[28.6139, 77.209]}
      zoom={11}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
      />
      {listings.map((listing) => (
        <Marker
          key={listing.id}
          position={listing.location}
          eventHandlers={{
            click: () => onSelectListing(listing),
          }}
        >
          <Popup>{listing.title}</Popup>
        </Marker>
      ))}

      {/* Highlight selected listing with a red circle */}
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
    { id: "1", title: "Fresh Biryani", imageUrl: "/food1.jpg", location: [28.6139, 77.209] },
    { id: "2", title: "Paneer Tikka", imageUrl: "/food2.jpg", location: [28.7041, 77.1025] },
  ]);

  // Handle claim
  const handleClaim = (listing) => {
    setSelectedListing(listing); // also select it on claim
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
                  e.stopPropagation(); // prevent triggering parent onClick
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
          onSelectListing={setSelectedListing}
        />
      </div>
    </div>
  );
}
