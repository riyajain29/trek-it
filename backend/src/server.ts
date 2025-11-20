import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? '',
});

// Fastify instance
const fastify = Fastify();

// Enable CORS
await fastify.register(cors, { origin: '*' });

// Ensure Fastify parses JSON request bodies
fastify.addContentTypeParser(
  'application/json',
  { parseAs: 'string' },
  (req, body: string, done) => {
    try {
      const json = JSON.parse(body);
      done(null, json);
    } catch (err) {
      done(err as Error, undefined);
    }
  }
);

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
  console.log('Signup body:', req.body);
  console.log('URL:', process.env.SUPABASE_URL);
  console.log('Key length:', process.env.SUPABASE_ANON_KEY?.length);

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
    const body = req.body as { stops: { lat: number; lng: number }[] } | undefined;

    if (!body || !body.stops || body.stops.length === 0) {
      return reply.code(400).send({ error: 'No stops provided' });
    }

    // Create a readable list of stops for GPT
    const stopsList = body.stops
      .map((s, i) => `Stop ${i + 1}: (${s.lat}, ${s.lng})`)
      .join('\n');

    // Generate plan with GPT
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a travel planner AI that creates optimized itineraries.',
        },
        {
          role: 'user',
          content: `Plan an efficient trip visiting these stops:\n${stopsList}. Include time suggestions and route order.`,
        },
      ],
    });

    const plan = completion.choices[0]?.message?.content ?? 'No plan generated.';
    return { plan };
  } catch (err) {
    console.error('Error generating plan:', err);
    return reply.code(500).send({ error: 'Failed to generate plan' });
  }
});

// Start the server
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