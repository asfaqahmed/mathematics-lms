import axios from 'axios';
import {useRouter} from 'next/router';
import Link from 'next/link';
import {useState,useEffect} from 'react';
export default function CoursePage(){
  const router = useRouter();
  const {id} = router.query;
  const [course,setCourse]=useState(null);
  useEffect(()=>{ if(id) axios.get(process.env.NEXT_PUBLIC_API_BASE + '/courses/'+id).then(r=>setCourse(r.data)) },[id]);
  if(!course) return <div>Loading...</div>
  return (
    <div style={{maxWidth:900, margin:'0 auto', padding:20}}>
      <h1>{course.title}</h1>
      <p>{course.description}</p>
      <p>Price: LKR {course.price}</p>
      <div style={{marginTop:20}}>
        <button onClick={async ()=> {
          // create simulated payhere payment and open simulate_url
          const user_id = 'replace-with-logged-in-user-id';
          const res = await axios.post(process.env.NEXT_PUBLIC_API_BASE + '/payments/create-payhere', {user_id, course_id: course.id});
          window.open(res.data.simulate_url, '_blank');
        }}>Pay with PayHere (Simulated)</button>
        <div style={{marginTop:10}}>
          <p>Bank transfer? Use the following bank details:</p>
          <pre>Account Name: Tutor Name
Bank: Example Bank
Account No: 123456789
Branch: Colombo</pre>
          <a href={'https://wa.me/?text=' + encodeURIComponent(`Hello, I paid LKR ${course.price} for course ${course.title}. My name: ___ . Receipt attached.`)} target="_blank">Send receipt via WhatsApp</a>
        </div>
      </div>
    </div>
  )
}
