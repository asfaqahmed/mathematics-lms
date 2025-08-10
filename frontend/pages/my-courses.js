import axios from 'axios';
import {useEffect, useState} from 'react';
export default function MyCourses(){
  const [courses, setCourses] = useState([]);
  useEffect(()=> {
    const token = localStorage.getItem('token');
    if(!token) return;
    axios.get(process.env.NEXT_PUBLIC_API_BASE + '/me/courses', {headers:{Authorization:'Bearer '+token}}).then(r=>setCourses(r.data)).catch(()=>{});
  },[]);
  return (
    <div style={{maxWidth:900, margin:'20px auto'}}>
      <h2>My Courses</h2>
      {courses.length===0 && <p>No courses yet.</p>}
      {courses.map(c=>(
        <div key={c.id} style={{border:'1px solid #ddd', padding:12, margin:10}}>
          <h3>{c.title}</h3>
          <p>Purchased at: {new Date(c.purchased_at).toLocaleString()}</p>
          <a href={'/course/'+c.id}>Open Course</a>
        </div>
      ))}
    </div>
  )
}
