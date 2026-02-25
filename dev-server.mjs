import { MongoMemoryServer } from 'mongodb-memory-server';
import { spawn } from 'child_process';

async function main() {
  console.log('Starting in-memory MongoDB...');
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log(`MongoDB running at: ${uri}`);

  const next = spawn('npx', ['next', 'dev', '-p', '3050'], {
    stdio: 'inherit',
    env: { ...process.env, MONGODB_URI: uri },
  });

  const shutdown = async () => {
    next.kill();
    await mongod.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  next.on('close', async () => {
    await mongod.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
