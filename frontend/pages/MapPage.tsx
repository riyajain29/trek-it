import { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { createClient } from "@supabase/supabase-js";

interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  created_by: string;
}

interface Stop {
  id: string;
  trip_id: string;
  name?: string;
  lat: number;
  lng: number;
  notes?: string;
  link?: string;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function MapPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const location = useLocation();
  const trip = location.state?.trip as Trip | undefined;

  const [stops, setStops] = useState<Stop[]>([]);
  const [plan, setPlan] = useState<string>("");

  // ✅ Use useJsApiLoader to load Google Maps
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  useEffect(() => {
    if (!tripId) return;

    const fetchStops = async () => {
      const { data, error } = await supabase
        .from("stops")
        .select("*")
        .eq("trip_id", tripId);

      if (error) console.error("Error fetching stops:", error);
      else if (data) setStops(data);
    };

    fetchStops();
  }, [tripId]);

  const handleMapClick = async (event: google.maps.MapMouseEvent) => {
    if (!event.latLng || !tripId) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    const { data, error } = await supabase
      .from("stops")
      .insert([{ trip_id: tripId, lat, lng }])
      .select()
      .single();

    if (error) console.error("Error saving stop:", error);
    else if (data) setStops((prev) => [...prev, data]);
  };

  const generatePlan = async () => {
    try {
      const response = await fetch("http://localhost:3000/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trip, stops }),
      });
      const data = await response.json();
      setPlan(data.plan);
    } catch (error) {
      console.error("Error generating plan:", error);
    }
  };

  if (loadError) return <div>Error loading Google Maps</div>;
  if (!isLoaded) return <div>Loading map...</div>;

  // ✅ Center map dynamically if stops exist
  const center =
    stops.length > 0
      ? { lat: stops[0].lat, lng: stops[0].lng }
      : { lat: 0, lng: 0 };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <h2 style={{ textAlign: "center", margin: "10px 0" }}>
        {trip?.title || "Your Trip"}
      </h2>

      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <button
          onClick={generatePlan}
          style={{
            backgroundColor: "#007bff",
            color: "white",
            padding: "10px 16px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Generate Trip Plan
        </button>
      </div>

      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "90%" }}
        zoom={stops.length > 0 ? 12 : 2}
        center={center}
        onClick={handleMapClick}
      >
        {stops.map((stop) => (
          <Marker key={stop.id} position={{ lat: stop.lat, lng: stop.lng }} />
        ))}
      </GoogleMap>

      {plan && (
        <div style={{ padding: "10px", maxHeight: "200px", overflowY: "auto" }}>
          <h3>Generated Plan:</h3>
          <pre>{plan}</pre>
        </div>
      )}
    </div>
  );
}
