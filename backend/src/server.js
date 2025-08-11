require('dotenv').config();
const express = require('express');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const verifyAdmin = require('./middleware/verifyAdmin');
const Stripe = require('stripe');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();

app.use(cors({
  origin: 'http://localhost:3000', // frontend origin
  credentials: true,
}));

app.use(express.json());

const upload = multer({ dest: 'uploads/' });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.post('/api/create-payhere', async (req, res) => {
  try {

    if (!req.user || !req.user.id) {
  return res.status(400).json({ error: "User not logged in" });
}


    const { user_id, course_id, amount } = req.body;
    const { data: payment, error } = await supabase
      .from('payments')
      .insert([{ user_id, course_id, amount, method: 'payhere', status: 'pending' }])
      .select()
      .single();

    if (error) throw error;

    const payhereParams = {
      merchant_id: process.env.PAYHERE_MERCHANT_ID,
      return_url: process.env.PAYHERE_RETURN_URL,
      cancel_url: process.env.PAYHERE_CANCEL_URL,
      notify_url: process.env.PAYHERE_NOTIFY_URL,
      order_id: payment.id,
      items: `Course Purchase ${course_id}`,
      currency: 'LKR',
      amount: amount,
    };

    res.json({ ok: true, payment, payhereParams });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/payhere/notify', async (req, res) => {
  console.log('PayHere notify:', req.body);
  try {
    const { merchant_id, order_id, status_code, payment_id } = req.body;

    if (merchant_id !== process.env.PAYHERE_MERCHANT_ID) {
      return res.status(400).send('Invalid merchant');
    }

    const paid = status_code === '2' || status_code === 2 || req.body.status === 'paid';

    if (paid) {
      const { error: updateError } = await supabase
        .from('payments')
        .update({ status: 'approved', payment_id, approved_at: new Date().toISOString() })
        .eq('id', order_id);

      if (updateError) throw updateError;

      const { data: paymentData, error: paymentFetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', order_id)
        .single();

      if (paymentFetchError) throw paymentFetchError;

      const p = paymentData;

      await supabase.from('purchases').insert([{
        user_id: p.user_id,
        course_id: p.course_id,
        payment_id: p.id,
        access_granted: true,
        purchase_date: new Date().toISOString(),
      }]);

      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', p.user_id)
        .single();

      if (userError) throw userError;

      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', p.course_id)
        .single();

      if (courseError) throw courseError;

      const invoicePath = await generateInvoiceAndEmail(userData, courseData, p, 'PayHere');

      await supabase
        .from('payments')
        .update({ invoice_url: invoicePath })
        .eq('id', p.id);

      return res.send('OK');
    } else {
      await supabase
        .from('payments')
        .update({ status: 'rejected' })
        .eq('id', order_id);
      return res.send('Rejected');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.post('/api/bank/receipt', upload.single('receipt'), async (req, res) => {
  try {
    const { user_id, course_id, amount } = req.body;
    const receiptUrl = req.file ? req.file.path : null;

    const { data, error } = await supabase
      .from('payments')
      .insert([{
        user_id,
        course_id,
        amount,
        method: 'bank',
        status: 'pending',
        receipt_url: receiptUrl,
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({ ok: true, payment: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/admin/payments/:id/approve', async (req, res) => {
  try {
    const paymentId = req.params.id;

    const { error: updateError } = await supabase
      .from('payments')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', paymentId);

    if (updateError) throw updateError;

    const { data: paymentData, error: paymentFetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (paymentFetchError) throw paymentFetchError;

    const p = paymentData;

    await supabase.from('purchases').insert([{
      user_id: p.user_id,
      course_id: p.course_id,
      payment_id: p.id,
      access_granted: true,
      purchase_date: new Date().toISOString(),
    }]);

    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', p.user_id)
      .single();

    if (userError) throw userError;

    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', p.course_id)
      .single();

    if (courseError) throw courseError;

    const invoicePath = await generateInvoiceAndEmail(userData, courseData, p, 'Bank Transfer (Admin Approved)');

    await supabase
      .from('payments')
      .update({ invoice_url: invoicePath })
      .eq('id', p.id);

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

async function generateInvoiceAndEmail(user, course, payment, method) {
  return new Promise(async (resolve, reject) => {
    try {
      const invoiceId = 'INV-' + Date.now();
      const filename = `invoices/${invoiceId}.pdf`;
      if (!fs.existsSync('invoices')) fs.mkdirSync('invoices');

      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(filename);
      doc.pipe(stream);

      doc.fontSize(20).text('Invoice', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Invoice #: ${invoiceId}`);
      doc.text(`Date: ${new Date().toLocaleString()}`);
      doc.text(`Student: ${user.name || user.email}`);
      doc.text(`Email: ${user.email}`);
      doc.moveDown();
      doc.text(`Course: ${course.title}`);
      doc.text(`Amount: LKR ${payment.amount}`);
      doc.text(`Payment method: ${method}`);
      doc.moveDown();
      doc.text('Tutor details:');
      doc.text(process.env.TUTOR_NAME || 'Math Tutor');
      doc.text(process.env.TUTOR_EMAIL || '');
      doc.end();

      stream.on('finish', async () => {
        const mailOptions = {
          from: process.env.FROM_EMAIL,
          to: user.email,
          subject: 'Payment Confirmation & Course Access',
          text: `Dear ${user.name || ''},\n\nThank you for your purchase. Attached is your invoice.\n\nRegards,\n${process.env.TUTOR_NAME}`,
          attachments: [{ filename: `${invoiceId}.pdf`, path: filename }],
        };

        try {
          await transporter.sendMail(mailOptions);
        } catch (emailErr) {
          console.error('Email error', emailErr);
        }

        resolve(filename);
      });
    } catch (err) {
      reject(err);
    }
  });
}

app.post('/api/admin/courses', async (req, res) => {
  try {
    const { title, description, price, category, thumbnail, intro_video } = req.body;
    const { data, error } = await supabase
      .from('courses')
      .insert([{ title, description, price, category, thumbnail, intro_video }])
      .select()
      .single();

    if (error) throw error;

    res.json({ ok: true, course: data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/courses', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.json({ courses: data });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/courses/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (courseError) throw courseError;

    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', id)
      .order('order', { ascending: true });

    if (lessonsError) throw lessonsError;

    res.json({ ok: true, course, lessons });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/create-profile', async (req, res) => {
  const { id, email, name, role } = req.body;
  try {
    const { data, error } = await supabase.from('profiles').insert([{ id, email, name, role }]);
    if (error) throw error;
    res.json({ ok: true, profile: data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// app.post('/api/create-checkout-session', async (req, res) => {
//   const { course_id, user_id, price } = req.body;
//   try {
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       mode: 'payment',
//       line_items: [{
//         price_data: {
//           currency: 'lkr',
//           product_data: { name: `Course ${course_id}` },
//           unit_amount: price,
//         },
//         quantity: 1,
//       }],
//       success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
//       metadata: { user_id, course_id },
//     });

//     res.json({ sessionId: session.id });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

app.post('/create-checkout-session', async (req, res) => {
  console.log("📥 Incoming Stripe request body:", req.body);

  try {
    const { course_id, amount, user_id } = req.body;
    console.log(`🛠 Creating Stripe session for: 
      User ID: ${user_id}
      Course ID: ${course_id}
      Amount: ${amount}
    `);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd', // change if needed
          product_data: { name: `Course ID: ${course_id}` },
          unit_amount: amount * 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment-success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
    });

    console.log("✅ Stripe session created:", session.id);
    res.json({ id: session.id });

  } catch (error) {
    console.error("❌ Stripe session creation failed:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Register user

// app.post('/api/create-checkout-session', async (req, res) => {
//   try {
//     const { course_id, amount } = req.body;

//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       line_items: [
//         {
//           price_data: {
//             currency: 'usd',
//             product_data: { name: `Course #${course_id}` },
//             unit_amount: Math.round(amount * 100), // in cents
//           },
//           quantity: 1,
//         },
//       ],
//       mode: 'payment',
//       success_url: `${process.env.FRONTEND_URL}/${course_id}?payment=success`,
//       cancel_url: `${process.env.FRONTEND_URL}/${course_id}?payment=cancel`,
//     });

//     res.json({ id: session.id });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const { user, error } = await supabase.auth.api.createUser({
      email,
      password,
      user_metadata: { name, role: 'student' }
    });

    if (error) throw error;

    // Insert into profiles table with role
    await supabase.from('profiles').insert([{ id: user.id, email, name, role: 'student' }]);

    res.json({ ok: true, user });
  } catch (err) {
    console.error(err);
    res.status(400).json({ ok: false, error: err.message });
  }
});

// Login user (return JWT token)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.api.signInWithEmail(email, password);
    if (error) throw error;
    res.json({ ok: true, session: data });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});




const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Backend running on ${port}`));
