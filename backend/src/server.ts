import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { initSocketServer } from './realtime/socket';
import { startBackgroundJobs } from './jobs/scheduler';

const app = createApp();
const httpServer = http.createServer(app);

initSocketServer(httpServer);
startBackgroundJobs();

httpServer.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[oism-backend] listening on http://localhost:${env.port} (${env.nodeEnv})`);
});
