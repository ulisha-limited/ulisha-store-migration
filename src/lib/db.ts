import 'dotenv/config'
import { Client } from 'pg'

export const db = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: {
    rejectUnauthorized: false
  }
})
