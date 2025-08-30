'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'

// Dynamically import map to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/MapComponent'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-700 rounded-lg flex items-center justify-center">
      <div className="text-gray-300">Loading map...</div>
    </div>
  )
})

export default function MapView() {
  const [selectedListing, setSelectedListing] = useState(null)

  // fake listings for now (you can fetch from backend later)
  const [listings, setListings] = useState([
    {
      id: '1',
      title: 'Fresh Biryani',
      imageUrl: '/food1.jpg',
      location: [28.6139, 77.2090],
    },
    {
      id: '2',
      title: 'Paneer Tikka',
      imageUrl: '/food2.jpg',
      location: [28.7041, 77.1025],
    },
  ])

  // handle claim button
  const handleClaim = (id) => {
    alert(`Claimed food with id ${id}`)
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Left side - Food Listings */}
      <div className="space-y-4">
        {listings.map((listing) => (
          <div 
            key={listing.id} 
            className="bg-gray-800 rounded-lg p-4 flex items-center gap-4"
          >
            <Image 
              src={listing.imageUrl} 
              alt={listing.title} 
              width={80} 
              height={80} 
              className="rounded-lg"
            />
            <div className="flex-1">
              <h3 className="text-white font-medium">{listing.title}</h3>
              <button 
                onClick={() => handleClaim(listing.id)}
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
  )
}
