const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { auth, adminAuth } = require('./auth');

// List courses with optional category filter
router.get('/', async (req, res) => {
  const q = db('courses').select('*');
  if(req.query.category) q.where({category: req.query.category});
  const courses = await q;
  res.json(courses);
});

// Course detail
router.get('/:id', async (req, res) => {
  const course = await db('courses').where({id:req.params.id}).first();
  if(!course) return res.status(404).json({error:'not found'});
  const lessons = await db('lessons').where({course_id: course.id}).orderBy('position','asc').select('*');
  res.json({...course, lessons});
});

// Create course (admin)
router.post('/', adminAuth, async (req, res) => {
  try{
    const { title, description, price, category, thumbnail, intro_video } = req.body;
    const id = uuidv4();
    await db('courses').insert({id, title, description, price, category, thumbnail, intro_video});
    res.json({ok:true, id});
  }catch(e){ console.error(e); res.status(500).json({error:'server'}); }
});

// Add lesson (admin)
router.post('/:id/lessons', adminAuth, async (req, res) => {
  try{
    const { title, content, video_url, locked, position } = req.body;
    const id = uuidv4();
    await db('lessons').insert({id, course_id: req.params.id, title, content, video_url, locked: !!locked, position: position || 0});
    res.json({ok:true});
  }catch(e){ console.error(e); res.status(500).json({error:'server'}); }
});

// Admin: lock/unlock lesson
router.post('/lessons/:lessonId/toggle-lock', adminAuth, async (req, res) => {
  try{
    const lesson = await db('lessons').where({id:req.params.lessonId}).first();
    if(!lesson) return res.status(404).json({error:'not found'});
    await db('lessons').where({id:req.params.lessonId}).update({locked: !lesson.locked});
    res.json({ok:true});
  }catch(e){ console.error(e); res.status(500).json({error:'server'}); }
});

module.exports = router;
