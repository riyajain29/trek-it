import { useState } from "react";

export default function ItineraryPage() {
  const [userItinerary, setUserItinerary] = useState(""); // user types stops
  const [generatedPlan, setGeneratedPlan] = useState<any[]>([]); // GPT output
  const [modalOpen, setModalOpen] = useState(false);

  const generatePlan = async () => {
    if (!userItinerary.trim()) return;

    try {
      const response = await fetch("http://localhost:3000/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stopsText: userItinerary }),
      });

      const data = await response.json();
      console.log("Received plan:", data);

      setGeneratedPlan(data.itinerary ?? []);
      setModalOpen(true);
    } catch (err) {
      console.error("Error generating plan:", err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Your Trip Itinerary</h2>

      <textarea
        value={userItinerary}
        onChange={(e) => setUserItinerary(e.target.value)}
        placeholder={`Type one stop per line, e.g.:
New York City
Los Angeles
San Francisco`}
        style={{ width: "100%", height: "200px", marginBottom: "10px" }}
      />

      <div style={{ marginBottom: "10px" }}>
        <button
          onClick={generatePlan}
          style={{ marginRight: "10px", padding: "8px 12px" }}
        >
          Generate Trip Plan
        </button>
        <button
          onClick={() => setUserItinerary("")}
          style={{ padding: "8px 12px" }}
        >
          Clear
        </button>
      </div>

      {modalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "10px",
              maxHeight: "80vh",
              overflowY: "auto",
              width: "80%",
            }}
          >
            <h3>Generated Itinerary</h3>

            {generatedPlan.length > 0 ? (
              generatedPlan.map((stop: any) => (
                <div key={stop.order} style={{ marginBottom: "12px" }}>
                  <strong>{stop.stop}</strong> ({stop.time})<br />
                  Notes: {stop.notes || "No activities suggested."}
                </div>
              ))
            ) : (
              <p>No itinerary generated.</p>
            )}

            <button
              onClick={() => setModalOpen(false)}
              style={{ marginTop: "10px", padding: "8px 12px" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
