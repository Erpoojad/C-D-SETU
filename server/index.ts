import { createApp } from './app';
import { migrate } from './db';

const port = Number(process.env.PORT) || 8080;

await migrate();
createApp().listen(port, '0.0.0.0', () => {
  console.log(`C&D Setu listening on :${port}`);
});
