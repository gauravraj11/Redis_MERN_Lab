const { createClient } = require('redis');

let client = null;
let isReady = false;
let warned = false;

/**
 * Connects to Redis without blocking the server.
 * If Redis is down, the app keeps working and simply reads from MongoDB.
 */
function connectRedis() {
  client = createClient({
    url: process.env.REDIS_URL,
    socket: {
      // keep retrying every few seconds, so starting Redis later also works
      reconnectStrategy: (retries) => Math.min(retries * 500, 5000),
    },
  });

  client.on('ready', () => {
    isReady = true;
    warned = false;
    console.log('✅ Redis connected');
  });

  client.on('end', () => {
    isReady = false;
  });

  client.on('error', (err) => {
    isReady = false;
    if (!warned) {
      console.warn('⚠️  Redis unavailable, serving from MongoDB only:', err.message);
      warned = true;
    }
  });

  client.connect().catch(() => {});
}

/** Returns the Redis client when connected, otherwise null. */
function getRedis() {
  return isReady ? client : null;
}

module.exports = { connectRedis, getRedis };
