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

  const merchant_id = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID;
  const merchant_secret = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_SECRET;

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
      const { data: payment, error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          payhere_payment_id: payment_id
        })
        .eq('id', order_id)
        .select()
        .single();

      if (updateError) {
        console.error('Payment update error:', updateError);
        return res.status(500).json({ error: 'Failed to update payment' });
      }

      if (payment) {
        // Create purchase record to grant course access
        try {
          const { data: existingPurchase } = await supabase
            .from('purchases')
            .select('id')
            .eq('user_id', payment.user_id)
            .eq('course_id', payment.course_id)
            .single()

          if (!existingPurchase) {
            const { error: purchaseError } = await supabase
              .from('purchases')
              .insert({
                user_id: payment.user_id,
                course_id: payment.course_id,
                payment_id: payment.id,
                access_granted: true,
                purchase_date: new Date().toISOString()
              })

            if (purchaseError) {
              console.error('Error creating purchase record:', purchaseError)
            } else {
              console.log(`Purchase record created for user: ${payment.user_id}, course: ${payment.course_id}`)
            }
          } else {
            // Update existing purchase to grant access
            await supabase
              .from('purchases')
              .update({
                access_granted: true,
                payment_id: payment.id
              })
              .eq('id', existingPurchase.id)
            
            console.log(`Purchase access granted for existing record: ${existingPurchase.id}`)
          }
        } catch (purchaseError) {
          console.error('Error handling purchase record:', purchaseError)
        }
      }

      console.log(`Payment successful for order: ${order_id}`);
      return res.json({ status: 'success' });
    }

    console.log(`Payment verification failed for order: ${order_id}`);
    return res.status(400).json({ error: 'Invalid payment' });
  }

  return res.status(400).json({ error: 'Invalid action' });
}