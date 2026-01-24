const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const notificationsRouter = require('./routes/notifications');
const config = require('../src/config/defaultConfig.json');
const reportRoutes = require('./routes/reportRoutes');


const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 60 * 1000, max: 30 }));

mongoose.connect(config.mongo.uri)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

app.use('/v1/notifications', notificationsRouter); 
app.use('/api/reports', reportRoutes);


app.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;