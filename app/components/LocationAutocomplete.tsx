"use client";

import { useRef, useEffect } from "react";

interface PlaceResult {
  city: string | null;
  state: string | null;
  zipCode: string | null;
  formattedAddress: string;
  query: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: PlaceResult) => void;
  placeholder?: string;
  showIcon?: boolean;
  showButton?: boolean;
  onSubmit?: () => void;
}

function extractPlaceData(
  place: google.maps.places.PlaceResult
): PlaceResult {
  const components = place.address_components || [];

  let city: string | null = null;
  let state: string | null = null;
  let zipCode: string | null = null;

  for (const component of components) {
    const types = component.types;

    if (types.includes("locality")) {
      city = component.long_name;
    } else if (types.includes("postal_code")) {
      zipCode = component.long_name;
    } else if (types.includes("administrative_area_level_1")) {
      state = component.short_name;
    }
  }

  const query = city || zipCode || place.formatted_address || "";

  return {
    city,
    state,
    zipCode,
    formattedAddress: place.formatted_address || "",
    query,
  };
}

function LocationIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 text-[#6B7280]"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export default function LocationAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Enter city or zip code",
  showIcon = true,
  showButton = true,
  onSubmit,
}: LocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!inputRef.current || autocompleteRef.current) return;

    // Check if Google Maps is loaded
    if (typeof google === "undefined" || !google.maps?.places) {
      // Retry after a short delay if not loaded yet
      const timer = setTimeout(() => {
        if (
          inputRef.current &&
          !autocompleteRef.current &&
          typeof google !== "undefined" &&
          google.maps?.places
        ) {
          initAutocomplete();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }

    initAutocomplete();

    function initAutocomplete() {
      if (!inputRef.current || autocompleteRef.current) return;

      const autocomplete = new google.maps.places.Autocomplete(
        inputRef.current,
        {
          componentRestrictions: { country: "us" },
          types: ["(regions)"],
          fields: ["address_components", "formatted_address", "geometry"],
        }
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place && place.address_components) {
          const placeData = extractPlaceData(place);
          onChange(placeData.formattedAddress);
          onPlaceSelect(placeData);
        }
      });

      autocompleteRef.current = autocomplete;
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onChange, onPlaceSelect]);

  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className="flex items-center border border-[#E5E5E5] bg-white">
      {showIcon && (
        <div className="flex items-center pl-4">
          <LocationIcon />
        </div>
      )}
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent px-3 py-3.5 text-[#2D3B2D] placeholder:text-[#6B7280] focus:outline-none"
      />
      {showButton && onSubmit && (
        <button
          type="submit"
          onClick={handleSubmit}
          className="m-1 flex items-center justify-center bg-[#2D3B2D] px-5 py-2.5 text-white transition-opacity hover:opacity-90"
        >
          <SearchIcon />
        </button>
      )}
    </div>
  );
}
