const app = require('./proxy-server');
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
}); 