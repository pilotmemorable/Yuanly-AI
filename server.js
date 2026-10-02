const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

// Mock Database
const experiences = [
  { id: '1', title: 'Fethiye Paragliding', price: 800, currency: 'CNY', rating: 4.9, img: 'https://images.unsplash.com/photo-1533114237753-3894724027a1', vibe: 'Adventure' },
  { id: '2', title: 'Cappadocia Balloon', price: 1200, currency: 'CNY', rating: 5.0, img: 'https://images.unsplash.com/photo-1520440229133-77679764f556', vibe: 'Romantic' },
  { id: '3', title: 'Ephesus VIP Tour', price: 600, currency: 'CNY', rating: 4.7, img: 'https://images.unsplash.com/photo-1516483638261-f48fbc869872', vibe: 'Cultural' },
];

// API Endpoints
app.get('/api/experiences', (req, res) => {
  res.json(experiences);
});

app.post('/api/booking/hold', (req, res) => {
  const { userId, experienceId, slot } = req.body;
  res.json({ 
    status: 'success', 
    holdId: `hold_${Math.random().toString(36).substr(2, 9)}`, 
    expiresAt: '15m' 
  });
});

app.post('/api/payment/initiate', (req, res) => {
  const { holdId, method } = req.body;
  res.json({ 
    status: 'redirect', 
    url: `https://api.${method}.com/pay?id=${holdId}`,
    transactionId: `tx_${Math.random().toString(36).substr(2, 9)}`
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Yuanly Backend running on port ${PORT}`);
});
