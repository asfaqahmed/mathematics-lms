import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '../../../lib/supabase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { searchParams } = new URL(`http://localhost${req.url}`);
  const action = searchParams.get('action');
  const body = req.body;

  const merchant_id = process.env.PAYHERE_MERCHANT_ID;
  const merchant_secret = process.env.PAYHERE_MERCHANT_SECRET;

  if (!merchant_id || !merchant_secret) {
    return res.status(500).json({ error: 'PayHere credentials not configured' });
  }

  // Generate hash for payment start
  if (action === 'start') {
    const { courseId, userId, amount, title } = body;

    if (!courseId || !userId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate unique order ID
    const order_id = crypto.randomUUID();

    // Create payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        id: order_id,
        user_id: userId,
        course_id: courseId,
        amount: amount,
        status: 'pending',
        method: 'payhere'
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment creation error:', paymentError);
      return res.status(500).json({ error: 'Failed to create payment record' });
    }

    // Generate PayHere hash
    const hash = crypto
      .createHash('md5')
      .update(
        merchant_id +
          order_id +
          parseFloat(amount).toFixed(2) +
          'LKR' +
          crypto
            .createHash('md5')
            .update(merchant_secret)
            .digest('hex')
            .toUpperCase()
      )
      .digest('hex')
      .toUpperCase();

    return res.json({ 
      hash, 
      merchant_id,
      order_id,
      amount: parseFloat(amount).toFixed(2)
    });
  }

  // Verify payment notification
  if (action === 'notify') {
    const { order_id, payhere_amount, payhere_currency, status_code, md5sig, payment_id } = body;

    console.log('PayHere callback received:', body);

    // Generate local hash for verification
    const local_md5sig = crypto
      .createHash('md5')
      .update(
        merchant_id +
          order_id +
          payhere_amount +
          payhere_currency +
          status_code +
          crypto
            .createHash('md5')
            .update(merchant_secret)
            .digest('hex')
            .toUpperCase()
      )
      .digest('hex')
      .toUpperCase();

    if (local_md5sig === md5sig && status_code === '2') {
      // Update payment status in database
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          payhere_payment_id: payment_id
        })
        .eq('id', order_id);

      if (updateError) {
        console.error('Payment update error:', updateError);
        return res.status(500).json({ error: 'Failed to update payment' });
      }

      console.log(`Payment successful for order: ${order_id}`);
      return res.json({ status: 'success' });
    }

    console.log(`Payment verification failed for order: ${order_id}`);
    return res.status(400).json({ error: 'Invalid payment' });
  }

  return res.status(400).json({ error: 'Invalid action' });
}