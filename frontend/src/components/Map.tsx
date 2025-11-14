import { useEffect, useRef } from "react";

declare global {
  interface Window {
    initMap: () => void;
  }
}

interface MapProps {
  center?: google.maps.LatLngLiteral;
  zoom?: number;
}

const Map = ({
  center = { lat: 37.7749, lng: -122.4194 },
  zoom = 8,
}: MapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; // ✅ declare once, cleaner

  useEffect(() => {
    if (!apiKey) {
      console.error("🚨 Google Maps API key is missing!");
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    window.initMap = () => {
      if (mapRef.current) {
        new google.maps.Map(mapRef.current, { center, zoom });
      }
    };

    return () => {
      delete window.initMap;
      document.head.removeChild(script);
    };
  }, [apiKey, center, zoom]); // include deps just in case

  return <div ref={mapRef} style={{ height: "500px", width: "100%" }} />;
};

export default Map;
