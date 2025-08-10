const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Register
router.post('/register', async (req, res) => {
  try{
    const { name, email, password } = req.body;
    if(!email || !password) return res.status(400).json({error:'Missing'});
    const existing = await db('users').where({email}).first();
    if(existing) return res.status(400).json({error:'Email exists'});
    const hash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await db('users').insert({id, name, email, password: hash, role: 'student'});
    res.json({ok:true});
  }catch(e){ console.error(e); res.status(500).json({error:'server'}); }
});

// Login
router.post('/login', async (req, res) => {
  try{
    const { email, password } = req.body;
    const user = await db('users').where({email}).first();
    if(!user) return res.status(401).json({error:'Invalid'});
    const ok = await bcrypt.compare(password, user.password);
    if(!ok) return res.status(401).json({error:'Invalid'});
    const token = jwt.sign({id:user.id, role:user.role, email:user.email}, JWT_SECRET, {expiresIn:'7d'});
    res.json({token, user:{id:user.id, name:user.name, email:user.email, role:user.role}});
  }catch(e){ console.error(e); res.status(500).json({error:'server'}); }
});

// Middleware - auth
function auth(req, res, next){
  const header = req.headers.authorization;
  if(!header) return res.status(401).json({error:'no token'});
  const token = header.split(' ')[1];
  try{
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; next();
  }catch(e){ return res.status(401).json({error:'invalid token'}); }
}

// Middleware - admin
async function adminAuth(req,res,next){
  try{
    const header = req.headers.authorization;
    if(!header) return res.status(401).json({error:'no token'});
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await db('users').where({id: payload.id}).first();
    if(!user || user.role !== 'admin') return res.status(403).json({error:'forbidden'});
    req.user = payload; next();
  }catch(e){ console.error(e); return res.status(401).json({error:'invalid token'}); }
}

module.exports = router;
module.exports.auth = auth;
module.exports.adminAuth = adminAuth;
