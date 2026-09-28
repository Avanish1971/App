require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

// ... आपके बाकी सारे Routers यहाँ रहेंगे ...

const app = express();

// 🔴 पुराना CORS हटाकर इसे हर जगह से (मोबाइल ऐप सहित) रिक्वेस्ट स्वीकार करने के लिए बदलें
app.use(cors({ 
  origin: '*', // यह आपके मोबाइल ऐप को कनेक्शन की अनुमति देगा
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'ok', message: 'location_app API running' }));

// ... आपके app.use('/api/...') वाले सारे रूट्स यहाँ रहेंगे ...

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  // 🔴 '0.0.0.0' जोड़ने से आपका लैपटॉप लोकल वाई-फाई नेटवर्क पर सर्वर को लाइव कर देगा
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on local network at http://10.79.240.108:${PORT}`);
  });
});
