import { createServer } from './server';

const app = createServer();
const port = parseInt(process.env.PORT || '3000', 10);
const host = '0.0.0.0';

app.listen(port, host, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Verification endpoint available at http://${host}:${port}/api/verify`);
});
