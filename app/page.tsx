"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "./components/Navbar";
import { SearchMapProvider } from "./components/Map";
import LocationAutocomplete from "./components/LocationAutocomplete";

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/sales?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handlePlaceSelect = (place: {
    city: string | null;
    state: string | null;
    zipCode: string | null;
    query: string;
  }) => {
    if (place.query) {
      router.push(`/sales?q=${encodeURIComponent(place.query)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <Navbar />

      {/* Hero Section */}
      <main className="flex flex-col items-center px-4 pt-16 pb-12 sm:px-6 sm:pt-24 sm:pb-16 md:pt-32 lg:pt-40">
        <h1 className="max-w-4xl text-center font-serif text-3xl font-bold leading-tight text-[#2D3B2D] sm:text-4xl md:text-5xl lg:text-6xl">
          Discover Your Next Estate Sale
        </h1>

        <p className="mt-4 max-w-xl text-center text-base text-[#6B7280] sm:mt-6 sm:text-lg">
          Browse sales nationwide. Or, list your sale in minutes.
        </p>

        {/* Search Bar with Autocomplete */}
        <SearchMapProvider>
          <form onSubmit={handleSearch} className="mt-8 w-full max-w-xl sm:mt-10">
            <LocationAutocomplete
              value={searchQuery}
              onChange={setSearchQuery}
              onPlaceSelect={handlePlaceSelect}
              placeholder="Enter city or zip code"
              showIcon={true}
              showButton={true}
              onSubmit={handleSearch}
            />
          </form>
        </SearchMapProvider>

        {/* Happy Hauling */}
        <p className="mt-8 text-sm lowercase text-[#6B7280]">happy hauling</p>
      </main>
    </div>
  );
}
