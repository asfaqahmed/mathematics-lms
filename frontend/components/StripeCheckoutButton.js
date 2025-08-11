import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function StripeCheckoutButton({ courseId }) {
  const handleCheckout = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });

      const data = await res.json();
      if (data.sessionId) {
        const stripe = await stripePromise;
        await stripe.redirectToCheckout({ sessionId: data.sessionId });
      } else {
        console.error('Failed to create checkout session');
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Buy Now
    </button>
  );
}
