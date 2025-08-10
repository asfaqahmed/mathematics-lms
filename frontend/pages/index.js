import axios from 'axios';
import Link from 'next/link';
import {useEffect, useState} from 'react';
export default function Home(){
  const [courses,setCourses]=useState([]);
  useEffect(()=>{ axios.get(process.env.NEXT_PUBLIC_API_BASE + '/courses').then(r=>setCourses(r.data)) },[]);
  return (
    <div style={{maxWidth:900, margin:'0 auto', padding:20}}>
      <h1>Math LMS — Featured Courses</h1>
      <div>
        {courses.map(c=>(
          <div key={c.id} style={{border:'1px solid #ddd', padding:12, margin:10}}>
            <h3>{c.title} — LKR {c.price}</h3>
            <p>{c.description}</p>
            <Link href={'/course/'+c.id}><a>View Course</a></Link>
          </div>
        ))}
      </div>
    </div>
  )
}
