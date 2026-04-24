import postgres from 'postgres'

// Single shared connection pool for the API process.
// postgres() is safe to call once at module load — it manages pooling internally.

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required')
}

const sql = postgres(connectionString, {
  max: 10,          // max pool size
  idle_timeout: 30, // close idle connections after 30s
  connect_timeout: 10,
  transform: {
    // Return JS Date objects for TIMESTAMPTZ columns
    // rather than raw strings
    undefined: null,
  },
})

export default sql
