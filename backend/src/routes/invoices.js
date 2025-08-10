const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// Generate invoice and store file path & DB record
router.post('/generate', async (req, res) => {
  const { user_id, payment_id } = req.body;
  const user = await db('users').where({id:user_id}).first();
  const payment = await db('payments').where({id:payment_id}).first();
  const course = await db('courses').where({id:payment.course_id}).first();
  const invoiceId = uuidv4();
  const filename = `invoices/invoice-${invoiceId}.pdf`;
  const filepath = path.join(process.cwd(), 'uploads', filename);
  fs.mkdirSync(path.dirname(filepath), {recursive:true});
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(filepath));
  doc.fontSize(20).text('Payment Confirmation & Course Access', {align:'center'});
  doc.moveDown();
  doc.fontSize(12).text(`Invoice #: ${invoiceId}`);
  doc.text(`Student: ${user.name} <${user.email}>`);
  doc.text(`Course: ${course.title}`);
  doc.text(`Amount: LKR ${course.price}`);
  doc.text(`Method: ${payment.method}`);
  doc.text(`Date: ${new Date().toLocaleString()}`);
  doc.end();
  // store invoice record
  await db('invoices').insert({id: invoiceId, user_id, payment_id, path: filename, created_at: new Date()});
  res.json({ok:true, path: filename});
});

// download invoice
router.get('/:id/download', async (req, res) => {
  const inv = await db('invoices').where({id:req.params.id}).first();
  if(!inv) return res.status(404).json({error:'not found'});
  const filepath = path.join(process.cwd(), 'uploads', inv.path);
  res.download(filepath);
});

module.exports = router;
