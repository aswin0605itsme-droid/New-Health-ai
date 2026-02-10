import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Ensure process.env.API_KEY is available during build/runtime if needed
    // In Vercel, this is handled automatically if environment variables are set.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY) 
  }
});