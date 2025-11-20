import { useState } from "react";
import { useParams } from "react-router-dom";

export default function ItineraryPage() {
  const { tripId } = useParams();
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");

  async function generatePlan() {
    const res = await fetch("http://localhost:3001/generate-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locations: input, tripId }),
    });

    const data = await res.json();
    setResult(data.plan);
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Trip Planner</h1>

      <textarea
        placeholder="Enter places (ex: New York, Paris, Dubai)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ width: "400px", height: "150px" }}
      />

      <br /><br />

      <button onClick={generatePlan}>
        Generate Itinerary
      </button>

      <br /><br />

      <pre style={{ whiteSpace: "pre-wrap" }}>
        {result}
      </pre>
    </div>
  );
}
