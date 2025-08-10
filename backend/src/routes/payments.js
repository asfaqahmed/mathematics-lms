const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');
const axios = require('axios');

// Create Stripe PaymentIntent
router.post('/create-stripe-payment', async (req, res) => {
  try{
    const { user_id, course_id } = req.body;
    const course = await db('courses').where({id:course_id}).first();
    if(!course) return res.status(404).json({error:'course not found'});
    // amount in cents -> since currency LKR, Stripe expects amount in smallest currency unit (cents equivalent). LKR uses 100 cents? Use amount * 100.
    const amount = (parseInt(course.price) || 0) * 100;
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'lkr',
      // you can add metadata to identify user/course
      metadata: { user_id, course_id }
    });
    // create payment record pending
    const id = uuidv4();
    await db('payments').insert({id, user_id, course_id, method:'stripe', status:'pending', created_at:new Date()});
    res.json({clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, paymentRecordId: id});
  }catch(e){ console.error(e); res.status(500).json({error:'server'}); }
});

// Stripe webhook to handle payment succeeded
router.post('/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try{
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  }catch(err){
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if(event.type === 'payment_intent.succeeded'){
    const pi = event.data.object;
    const metadata = pi.metadata || {};
    // find payment record by metadata or update by payment intent mapping
    const paymentRow = await db('payments').where({method:'stripe', status:'pending'}).first();
    // For demo, grant access by matching metadata:
    if(metadata.user_id && metadata.course_id){
      const paymentId = uuidv4();
      await db('payments').insert({id: paymentId, user_id: metadata.user_id, course_id: metadata.course_id, method:'stripe', status:'paid', paid_at: new Date(), created_at: new Date()});
      await db('user_courses').insert({id: uuidv4(), user_id: metadata.user_id, course_id: metadata.course_id, purchased_at: new Date(), method:'stripe'});
      // generate invoice
      // simplified: create invoice record and generate PDF
      const invoiceId = uuidv4();
      const filename = `invoices/invoice-${invoiceId}.pdf`;
      const filepath = path.join(process.cwd(), 'uploads', filename);
      fs.mkdirSync(path.dirname(filepath), {recursive:true});
      const doc = new PDFDocument();
      doc.pipe(fs.createWriteStream(filepath));
      doc.fontSize(18).text('Invoice', {align:'center'});
      doc.moveDown();
      doc.fontSize(12).text(`Invoice #: ${invoiceId}`);
      doc.text(`Student ID: ${metadata.user_id}`);
      doc.text(`Course ID: ${metadata.course_id}`);
      doc.text(`Amount: LKR ${(pi.amount_received/100).toFixed(2)}`);
      doc.end();
      await db('invoices').insert({id: invoiceId, user_id: metadata.user_id, payment_id: paymentId, path: filename, created_at: new Date()});
    }
  }
  res.json({received:true});
});

// PayHere: create form payload (return a form to frontend or URL)
router.post('/create-payhere', async (req, res) => {
  const { user_id, course_id, sandbox } = req.body;
  const course = await db('courses').where({id:course_id}).first();
  if(!course) return res.status(404).json({error:'course not found'});
  // Create payment record pending
  const id = uuidv4();
  await db('payments').insert({id, user_id, course_id, method:'payhere', status:'pending', created_at:new Date()});
  // Build PayHere form fields per their Checkout API
  const merchant_id = process.env.PAYHERE_MERCHANT_ID;
  const return_url = process.env.PAYHERE_RETURN_URL;
  const notify_url = process.env.PAYHERE_NOTIFY_URL;
  const cancel_url = process.env.PAYHERE_RETURN_URL;
  const amount = course.price;
  const order_id = id;
  const form = {
    merchant_id,
    return_url,
    cancel_url,
    notify_url,
    order_id,
    items: course.title,
    currency: 'LKR',
    amount
  };
  // For demo return JSON instructing client to POST to PayHere endpoint with these fields
  res.json({ok:true, payhere: form, payhere_url: sandbox ? 'https://sandbox.payhere.lk/pay/checkout' : 'https://sandbox.payhere.lk/pay/checkout'});
});

// PayHere notify URL: validate checksum and mark paid
router.post('/payhere-notify', express.urlencoded({extended:true}), async (req, res) => {
  // PayHere sends various fields and a md5 checksum. For real validation refer to PayHere docs.
  const body = req.body;
  console.log('PayHere notify', body);
  const status = body.status;
  const order_id = body.order_id;
  const p = await db('payments').where({id: order_id}).first();
  if(!p) return res.status(404).send('NOT FOUND');
  if(status === 'COMPLETE' || status === 'paid' || status === 'Success' || body.status_code === '2'){
    await db('payments').where({id:order_id}).update({status:'paid', paid_at: new Date()});
    await db('user_courses').insert({id: uuidv4(), user_id: p.user_id, course_id: p.course_id, purchased_at: new Date(), method:'payhere'});
    // generate invoice and send email (simplified)
    // send 200 OK to PayHere
    return res.send('ok');
  }else{
    await db('payments').where({id:order_id}).update({status:'failed'});
    return res.send('failed');
  }
});

// Bank transfer intent
router.post('/bank-intent', async (req, res) => {
  try{
    const { user_id, course_id, bank_reference } = req.body;
    const id = uuidv4();
    await db('payments').insert({id, user_id, course_id, method:'bank', status:'pending', bank_reference, created_at:new Date()});
    res.json({ok:true, id});
  }catch(e){ console.error(e); res.status(500).json({error:'server'}); }
});

// Admin approves bank payment
router.post('/approve-bank/:id', async (req, res) => {
  try{
    const paymentId = req.params.id;
    const p = await db('payments').where({id:paymentId}).first();
    if(!p) return res.status(404).json({error:'not found'});
    await db('payments').where({id:paymentId}).update({status:'paid', paid_at: new Date()});
    await db('user_courses').insert({id: uuidv4(), user_id: p.user_id, course_id: p.course_id, purchased_at: new Date(), method:'bank'});
    // generate invoice and email (omitted here for brevity)
    res.json({ok:true});
  }catch(e){ console.error(e); res.status(500).json({error:'server'}); }
});

module.exports = router;
