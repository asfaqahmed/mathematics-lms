import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

export default function CourseDetail() {
  const router = useRouter();
  const { id, payment } = router.query;

  const [course, setCourse] = useState(null);
  const supabase = useSupabaseClient();
  const user = useUser();

  // Redirect to login if not logged in
  useEffect(() => {
    if (user === null) {
      console.warn("🚫 No user found, redirecting to /login");
      router.push('/login'); 
    }
  }, [user, router]);

  // Fetch course details after login check
  useEffect(() => {
    if (!id || !user) return;
    console.log("📦 Fetching course details for:", id);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses/${id}`)
      .then(r => r.json())
      .then(j => {
        console.log("✅ Course data received:", j.course);
        setCourse(j.course);
      })
      .catch(err => console.error("❌ Error fetching course:", err));
  }, [id, user]);

  // Payment status alerts
  useEffect(() => {
    if (payment === 'success') alert('✅ Payment successful!');
    if (payment === 'cancel') alert('❌ Payment canceled.');
  }, [payment]);

  if (!user) {
    return <div className="p-6 text-center">🔒 Redirecting to login...</div>;
  }

  if (!course) return <div className="p-6 text-center">⏳ Loading course...</div>;

  const handleBuyPayHere = async () => {
    console.log("💳 PayHere clicked by:", user);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/create-payhere`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId: course.id,
        userId: user.id,
      }),
    });

    const data = await res.json();
    console.log("PayHere response:", data);

    if (data?.payment_url) {
      window.location.href = data.payment_url;
    } else {
      alert("Payment failed. Please try again.");
    }
  };

  const handleBuyStripe = async () => {
    console.log("🖱 Stripe button clicked");
    const user_id = user?.id;
    console.log("📦 Sending to backend:", { user_id, course_id: course.id, amount: course.price });

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/create-checkout-session`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, course_id: course.id, amount: course.price })
      });

      const data = await res.json();
      console.log("💳 Stripe session data received:", data);

      if (data.id) {
        const stripe = Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);
        console.log("🔄 Redirecting to Stripe checkout...");
        await stripe.redirectToCheckout({ sessionId: data.id });
      } else {
        console.error("❌ No Stripe session ID returned.");
      }
    } catch (error) {
      console.error("🚨 Stripe payment error:", error);
    }
  };

  const handleBank = () => {
    const message = encodeURIComponent(
      `Hi Admin, I paid LKR ${course.price} for course "${course.title}". My email: ${user?.email}. Please confirm and grant access. Thank you.`
    );
    const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold">{course.title}</h1>
      <img
        src={course.thumbnail || '/placeholder.png'}
        className="w-full max-h-80 object-cover mt-4"
        alt={course.title}
      />
      <p className="mt-4">{course.description}</p>
      <p className="mt-4 font-bold">LKR {course.price}</p>
      <div className="mt-6 space-x-3">
        <button
          onClick={handleBuyPayHere}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Pay with PayHere
        </button>
        <button
          onClick={handleBuyStripe}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Pay with Stripe
        </button>
        <button
          onClick={handleBank}
          className="bg-yellow-600 text-white px-4 py-2 rounded"
        >
          Pay via Bank / Send Receipt on WhatsApp
        </button>
      </div>
    </div>
  );
}
