import Fastify from "fastify";

const fastify = Fastify({
  logger: true,
});

// Basic route
fastify.get("/", async (request, reply) => {
  return { message: "Hello from Fastify!" };
});

// Start server
const start = async () => {
  try {
    // In Fastify v5, listen expects host + port or an options object
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    console.log("Server running on http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
