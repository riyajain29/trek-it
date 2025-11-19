import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { z } from 'zod';

dotenv.config();

// JSON schema for itinerary
const ItinerarySchema = z.object({
  itinerary: z.array(
    z.object({
      stop: z.string(),
      lat: z.number(),
      lng: z.number(),
      order: z.number(),
      time: z.string(),
      notes: z.string().optional(),
    })
  ),
});

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? '',
});

// Fastify instance
const fastify = Fastify();

// Enable CORS
await fastify.register(cors, { origin: '*' });

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Root route
fastify.get('/', async () => {
  return { message: 'Server running!' };
});

// Signup route
fastify.post('/signup', async (req, reply) => {
  const { email, password } = req.body as { email: string; password: string };
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return reply.code(400).send(error);
  return data;
});

// Login route
fastify.post('/login', async (req, reply) => {
  const { email, password } = req.body as { email: string; password: string };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return reply.code(400).send(error);
  return data;
});

// Trip routes
fastify.post('/trips', async (req, reply) => {
  const { title, destination, start_date, end_date, user_id } = req.body as {
    title: string;
    destination: string;
    start_date: string;
    end_date: string;
    user_id: string;
  };

  const { data, error } = await supabase
    .from('trips')
    .insert([{ title, destination, start_date, end_date, created_by: user_id }])
    .select();

  if (error) return reply.code(400).send(error);
  return data;
});

fastify.get('/trips', async (_, reply) => {
  const { data, error } = await supabase.from('trips').select('*');
  if (error) return reply.code(400).send(error);
  return data;
});

// Generate Trip Plan Route
fastify.post('/generate-plan', async (req, reply) => {
  try {
    const body = req.body as { stops: { lat: number; lng: number }[] };

    if (!body?.stops || body.stops.length === 0) {
      return reply.code(400).send({ error: 'No stops provided' });
    }

    const stopsList = body.stops
      .map((s, i) => `Stop ${i + 1}: (${s.lat}, ${s.lng})`)
      .join('\n');

    // Use any to bypass TS error on response_format
    const completion = await (openai.responses as any).create({
      model: "gpt-4.1-mini",
      input: `
Generate an optimized travel itinerary for these stops:

${stopsList}

Return ONLY JSON with ordered stops.
      `,
      response_format: {
        type: "json_schema",
        schema: ItinerarySchema,
        strict: true
      }
    });

    // Access structured output safely
    const plan = completion.output?.[0]?.content?.[0]?.value;

    if (!plan) return reply.code(500).send({ error: 'Failed to parse itinerary' });

    return reply.send(plan);

  } catch (err) {
    console.error("AI error:", err);
    return reply.code(500).send({ error: "Failed to generate itinerary" });
  }
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log('Server running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
