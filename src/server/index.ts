import { createServer } from './server';

const app = createServer();
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Verification endpoint available at http://localhost:${port}/api/verify`);
}); 