/**
 * MongoDB connection.
 * Skipped entirely when TEST_MODE=true — mongoose is never called.
 */

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (process.env.TEST_MODE === 'true') {
    return; // intentional no-op
  }

  if (isConnected) return;

  // TODO: install mongoose and uncomment when wiring up production
  // const mongoose = (await import('mongoose')).default;
  // const uri = process.env.MONGODB_URI;
  // if (!uri) throw new Error('MONGODB_URI is not set');
  // await mongoose.connect(uri);
  // isConnected = true;

  throw new Error('MongoDB not configured — set TEST_MODE=true for local smoke-testing');
}
