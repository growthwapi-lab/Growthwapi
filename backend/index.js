require('dotenv').config();
const express = require('express');
const cors = require('cors');

const whatsappRoutes = require('./src/routes/whatsapp');
const walletRoutes = require('./src/routes/wallet');
const paymentsRoutes = require('./src/routes/payments');
const usersRoutes = require('./src/routes/users');
const contactsRoutes = require('./src/routes/contacts');
const developerRoutes = require('./src/routes/developer');
const aiAgentRoutes = require('./src/routes/aiAgent');
const adminRoutes = require('./src/routes/admin');
const affiliateRoutes = require('./src/routes/affiliate');
const teamRoutes = require('./src/routes/team');

const app = express();


const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_ALT,
  'https://growthwapi.in',
  'https://www.growthwapi.in',
  'https://growthwapi.vercel.app',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in dev for seamless connection
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'Growthwapi API is running', version: '1.0.0' });
});

app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/developer', developerRoutes);
app.use('/api/ai-agent', aiAgentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api/team', teamRoutes);
app.use('/api', developerRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'File is too large. Please select a file under 15MB.' });
  }
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
