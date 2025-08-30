
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Custom marker (delivery)
const deliveryIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // delivery truck icon
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
})

// Pickup marker
const pickupIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/854/854894.png', // store icon
  iconSize: [30, 30],
  iconAnchor: [15, 30],
})

// Drop marker
const dropIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // location pin
  iconSize: [30, 30],
  iconAnchor: [15, 30],
})

export default function TrackOrderMap() {
  const [deliveryPos, setDeliveryPos] = useState(pickup)

  // Simulate delivery moving towards drop location
  useEffect(() => {
    let step = 0
    const interval = setInterval(() => {
      step += 0.01
      if (step >= 1) clearInterval(interval)
      setDeliveryPos([
        pickup[0] + (drop[0] - pickup[0]) * step,
        pickup[1] + (drop[1] - pickup[1]) * step,
      ])
    }, 1000)
    return () => clearInterval(interval)
  }, [pickup, drop])

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden">
      <MapContainer
        center={pickup}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Pickup Marker */}
        <Marker position={pickup} icon={pickupIcon}>
          <Popup>Pickup Location</Popup>
        </Marker>

        {/* Drop Marker */}
        <Marker position={drop} icon={dropIcon}>
          <Popup>Delivery Location</Popup>
        </Marker>

        {/* Delivery moving marker */}
        <Marker position={deliveryPos} icon={deliveryIcon}>
          <Popup>Delivery in progress...</Popup>
        </Marker>

        {/* Route Line */}
        <Polyline positions={[pickup, drop]} color="blue" />
      </MapContainer>
    </div>
  )
}
