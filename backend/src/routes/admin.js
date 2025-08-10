const express = require('express');
const router = express.Router();
const db = require('../db');
const { adminAuth } = require('./auth');

router.get('/payments', adminAuth, async (req, res) => {
  const payments = await db('payments').orderBy('created_at','desc').select('*');
  res.json(payments);
});

router.get('/users', adminAuth, async (req, res) => {
  const users = await db('users').select('id','name','email','role','created_at');
  res.json(users);
});

module.exports = router;
