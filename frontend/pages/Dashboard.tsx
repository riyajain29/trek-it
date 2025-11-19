import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  created_by: string;
  lat?: number;
  lng?: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const session = JSON.parse(localStorage.getItem("supabase_session") || "null");

  // Redirect if no session
  useEffect(() => {
    if (!session) {
      navigate("/login");
      return;
    }

    const fetchTrips = async () => {
      try {
        const res = await fetch("http://localhost:3000/trips");
        const data = await res.json();
        setTrips(data);
      } catch (err) {
        console.error("Error fetching trips:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [session, navigate]);

  // Add a new trip
  const handleAddTrip = async () => {
    if (!title || !destination || !startDate || !endDate) {
      alert("Please fill out all fields");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          destination,
          start_date: startDate,
          end_date: endDate,
          user_id: session.user.id,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data[0]) {
        alert(`Error adding trip: ${data.message || "Unknown error"}`);
      } else {
        const newTrip = data[0];
        setTrips((prev) => [...prev, newTrip]);

        // Clear inputs
        setTitle("");
        setDestination("");
        setStartDate("");
        setEndDate("");

        // Redirect to MapPage
        navigate(`/mappage/${newTrip.id}`, { state: { trip: newTrip } });
      }
    } catch (err) {
      console.error("Add trip error:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("supabase_session");
    navigate("/login");
  };

  if (!session) return null;

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Dashboard</h1>

      <button onClick={handleLogout} style={{ marginBottom: "20px" }}>
        Logout
      </button>

      <h2>Create a New Trip</h2>

      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: "100%", margin: "5px 0", padding: "8px" }}
      />

      <input
        placeholder="Destination"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        style={{ width: "100%", margin: "5px 0", padding: "8px" }}
      />

      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        style={{ width: "100%", margin: "5px 0", padding: "8px" }}
      />

      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        style={{ width: "100%", margin: "5px 0", padding: "8px" }}
      />

      <button
        onClick={handleAddTrip}
        style={{ margin: "10px 0", padding: "8px 16px" }}
      >
        Create Trip
      </button>

      <h2>Your Trips</h2>

      {loading ? (
        <p>Loading...</p>
      ) : trips.length === 0 ? (
        <p>No trips yet</p>
      ) : (
        <ul>
          {trips.map((trip) => (
            <li
              key={trip.id}
              style={{
                cursor: "pointer",
                color: "blue",
                textDecoration: "underline",
              }}
              onClick={() =>
                navigate(`/mappage/${trip.id}`, { state: { trip } })
              }
            >
              <strong>{trip.title}</strong> - {trip.destination} (
              {trip.start_date} to {trip.end_date})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
