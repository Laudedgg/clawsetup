import { MongoClient } from 'mongodb';

const options = {};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('Please add your MONGODB_URI to .env');
  }

  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    const client = new MongoClient(uri, options);
    return client.connect();
  }
}

// Lazy initialization - only connect when actually needed
const handler = {
  get(_target: unknown, prop: keyof Promise<MongoClient>) {
    if (!clientPromise) {
      clientPromise = getClientPromise();
    }
    const value = clientPromise[prop];
    if (typeof value === 'function') {
      return value.bind(clientPromise);
    }
    return value;
  },
};

// Export a proxy that lazily initializes the client
export default new Proxy({} as Promise<MongoClient>, handler);
