require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const paymentRoutes = require('./routes/payments');
const invoiceRoutes = require('./routes/invoices');
const adminRoutes = require('./routes/admin');
const meRoutes = require('./routes/me');

const app = express();
app.use(cors());
// For Stripe webhook, we'll mount raw body on that route specifically in payments route.
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/me', meRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=> {
  console.log('Backend listening on', PORT);
});
