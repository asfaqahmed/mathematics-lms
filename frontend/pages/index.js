import Link from 'next/link';
import { useEffect, useState } from 'react';



export default function Home() {
  const [courses, setCourses] = useState([]);
  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_API_URL + '/api/courses').then(r => r.json()).then(j => setCourses(j.courses || []));
  }, []);
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Math Courses</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {courses.map(c => (
          <div key={c.id} className="border rounded p-4">
            <img src={c.thumbnail || '/placeholder.png'} className="w-full h-40 object-cover mb-2" />
            <h2 className="text-xl font-semibold">{c.title}</h2>
            <p className="mt-2">{c.description?.slice(0, 120)}</p>
            <p className="mt-2 font-bold">LKR {c.price}</p>
            <Link legacyBehavior href={`/courses/${c.id}`}><a className="inline-block bg-blue-600 text-white px-4 py-2 rounded mt-3">View Course</a></Link>
          </div>
        ))}
      </div>
    </div>
  );
}