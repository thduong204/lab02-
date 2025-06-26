const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Check biến môi trường quan trọng
if (!process.env.SECRET_KEY) {
  console.error('ERROR: SECRET_KEY is not defined in environment variables');
  process.exit(1);
}

// Static folder (nếu có upload file)
app.use('/uploads', express.static('uploads'));

// Import các routes
  const authRoutes = require('./src/routes/authRoutes');
  const articleRoutes = require('./src/routes/articleRoutes'); 
  const qrRoutes = require('./src/routes/qrRoutes');
  const registerRoutes = require('./src/routes/registerRoutes');
  const profileRoutes = require('./src/routes/profileRoutes');
  const commentRoutes = require('./src/routes/commentRoutes');
  const labtestsRoutes = require('./src/routes/labtestsRoutes');
  const accountsRoutes = require('./src/routes/accountsRoutes');
  const donationEventRoutes = require('./src/routes/donationEventsRoutes');
  const eventRegistrationRoutes = require('./src/routes/eventRegistrationsRoutes');
  const bloodRequestsRoutes = require('./src/routes/bloodRequestsRoutes');
  const blogFavoritesRoutes = require('./src/routes/blogFavoritesroutes');
  const roleChangeRoutes = require('./src/routes/roleChangeRoutes');
  const bloodUnitsRoutes = require('./src/routes/bloodunitsRoutes');


// Sử dụng routes
  app.use('/api/auth', authRoutes);
  app.use('/api/articles', articleRoutes); 
  app.use('/api/qr', qrRoutes);
  app.use('/api/register', registerRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/labtest', labtestsRoutes);
  app.use('/api/accounts', accountsRoutes);
  app.use('/api/donation-events', donationEventRoutes);
  app.use('/api/event-registrations', eventRegistrationRoutes);
  app.use('/api/blood-requests', bloodRequestsRoutes);
  app.use('/api/favorites', blogFavoritesRoutes);
  app.use('/api/role-change', roleChangeRoutes);
  app.use('/api/blood-units', bloodUnitsRoutes);

// Khởi chạy server

  console.log(`Server running at http://localhost:${port}`);


module.exports = app;
