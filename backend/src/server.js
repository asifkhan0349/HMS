const app = require('./app');
const dotenv = require('dotenv');

dotenv.config();

const PORT = 8001;

app.listen(PORT, '0.0.0.0', () => {
  console.log('---------------------------------------------------------');
  console.log(`🚀 HMS Auth & Proxy Server running on port ${PORT}`);
  console.log(`🌐 API Entry Point: http://localhost:${PORT}/api/auth`);
  console.log(`🔗 Proxying unknown requests to: ${process.env.FASTAPI_URL || 'http://127.0.0.1:8000'}`);
  console.log('---------------------------------------------------------');
});
