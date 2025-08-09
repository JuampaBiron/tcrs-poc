import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

// Cargar variables de entorno manualmente
config({ path: '.env.local' });

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});