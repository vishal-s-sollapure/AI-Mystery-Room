import mongoose from 'mongoose';
import { createApp } from './app.js';
import { env } from './config/env.js';

async function bootstrap() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('MongoDB connected successfully');

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      console.log(`AI Mystery Room API listening on port ${env.PORT}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down server...');
      server.close(async () => {
        await mongoose.disconnect();
        console.log('Server and database connection closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
