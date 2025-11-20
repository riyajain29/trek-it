import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const fastify = Fastify();
await fastify.register(cors, { origin: "*" });

// OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });

// Temporary in-memory trips store
let tripsStore: any[] = [];

// Root route
fastify.get("/", async () => ({ message: "Server running!" }));

// Trips endpoints
fastify.get("/trips", async () => tripsStore);

fastify.post("/trips", async (req, reply) => {
  const { title, destination, start_date, end_date } = req.body as any;
  if (!title || !destination || !start_date || !end_date) {
    return reply.code(400).send({ error: "Missing fields" });
  }
  const newTrip = {
    id: (tripsStore.length + 1).toString(),
    title,
    destination,
    start_date,
    end_date,
    created_by: "user1",
  };
  tripsStore.push(newTrip);
  return [newTrip];
});

// Generate plan
fastify.post("/generate-plan", async (req, reply) => {
  try {
    const { stopsText } = req.body as { stopsText?: string };
    if (!stopsText || !stopsText.trim()) {
      return reply.code(400).send({ error: "No stops provided" });
    }

    const stopsArray = stopsText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (!stopsArray.length) {
      return reply.code(400).send({ error: "No valid stops provided" });
    }

    const stopsList = stopsArray.join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a travel planner AI. User provides plain text stops, one per line. Output JSON with itinerary only." + 
            "For each stop, give a realistic time in chronological order, and 2-3 suggested activities in the 'notes' field."
        },
        {
          role: "user",
          content: `
Here are the stops:
${stopsList}

Output JSON ONLY in this format:

{
  "itinerary": [
    {
      "stop": "Stop Name",
      "notes": "Suggest 2-3 activities or places to visit at this stop."
    }
  ]
}

Do not include extra text.
`
        }
      ],
    });

    const rawPlan = completion.choices[0]?.message?.content ?? "{}";
    let planJson;
    try {
      planJson = JSON.parse(rawPlan);
    } catch (err) {
      console.error("Failed to parse GPT JSON:", err, rawPlan);
      return reply.code(500).send({ error: "Failed to parse GPT JSON" });
    }

    return planJson;
  } catch (err) {
    console.error("Error generating plan:", err);
    return reply.code(500).send({ error: "Failed to generate plan" });
  }
});

// Start server
fastify.listen({ port: 3000 }, () => {
  console.log("Server running on http://localhost:3000 🚀");
});
