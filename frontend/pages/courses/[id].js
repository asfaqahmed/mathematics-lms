import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function CourseDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [course, setCourse] = useState(null);
  useEffect(() => {
    if (!id) return;
    fetch(process.env.NEXT_PUBLIC_API_URL + '/api/courses/' + id).then(r => r.json()).then(j => setCourse(j.course));
  }, [id]);

  if (!course) return <div>Loading...</div>;

  const handleBuyPayHere = async () => {
    const user_id = localStorage.getItem('profile_id') || 'anonymous';
    const create = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/create-payhere', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, course_id: course.id, amount: course.price })
    }).then(r => r.json());
    const { payhereParams } = create;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://sandbox.payhere.lk/pay/checkout';
    Object.entries(payhereParams).forEach(([k,v]) => {
      const input = document.createElement('input');
      input.type = 'hidden'; input.name = k; input.value = v;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  };

  const handleBank = () => {
    const message = encodeURIComponent(`Hi Admin, I paid LKR ${course.price} for course "${course.title}". My email: [your email]. Please confirm and grant access. Thank you.`);
    const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold">{course.title}</h1>
      <img src={course.thumbnail || '/placeholder.png'} className="w-full max-h-80 object-cover mt-4" />
      <p className="mt-4">{course.description}</p>
      <p className="mt-4 font-bold">LKR {course.price}</p>
      <div className="mt-6 space-x-3">
        <button onClick={handleBuyPayHere} className="bg-green-600 text-white px-4 py-2 rounded">Pay with PayHere</button>
        <button onClick={handleBank} className="bg-yellow-600 text-white px-4 py-2 rounded">Pay via Bank / Send Receipt on WhatsApp</button>
      </div>
    </div>
  );
}