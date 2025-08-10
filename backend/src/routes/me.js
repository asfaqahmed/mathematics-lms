const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('./auth');

router.get('/courses', auth, async (req, res) => {
  const userId = req.user.id;
  const rows = await db('user_courses').where({user_id: userId}).join('courses','user_courses.course_id','courses.id').select('courses.*','user_courses.purchased_at');
  res.json(rows);
});

module.exports = router;
