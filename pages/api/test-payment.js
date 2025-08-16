import { supabase } from '../../lib/supabase-admin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Test minimal payment record - use valid enum values
    const testPayment = {
      user_id: 'b525756a-40a8-4efb-b3f6-5a553d708515', // Replace with a real user ID
      course_id: '4609a50a-845f-4033-a164-a63db4ddc27d', // Replace with a real course ID
      amount: 500000, // 5000 LKR in cents
      method: 'payhere', // Common enum values: payhere, stripe, bank_transfer
      status: 'pending'
    }

    console.log('Testing payment insert with:', testPayment)

    const { data, error } = await supabase
      .from('payments')
      .insert(testPayment)
      .select()

    if (error) {
      return res.status(400).json({ 
        error: 'Payment insert failed', 
        details: error,
        message: error.message,
        hint: error.hint,
        code: error.code
      })
    }

    // If successful, clean up the test record
    await supabase
      .from('payments')
      .delete()
      .eq('id', data[0].id)

    res.status(200).json({ 
      success: true, 
      message: 'Payment table structure is working',
      testData: testPayment
    })

  } catch (error) {
    res.status(500).json({ 
      error: 'Server error', 
      details: error.message 
    })
  }
}