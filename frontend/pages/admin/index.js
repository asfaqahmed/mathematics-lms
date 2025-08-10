import axios from 'axios';
import {useEffect, useState} from 'react';
export default function Admin(){
  const [payments, setPayments] = useState([]);
  useEffect(()=> {
    const token = localStorage.getItem('token');
    axios.get(process.env.NEXT_PUBLIC_API_BASE + '/admin/payments', {headers:{Authorization:'Bearer '+token}}).then(r=>setPayments(r.data));
  },[]);
  async function approve(id){
    const token = localStorage.getItem('token');
    await axios.post(process.env.NEXT_PUBLIC_API_BASE + '/payments/approve-bank/' + id, {}, {headers:{Authorization:'Bearer '+token}});
    alert('Approved');
  }
  return (
    <div style={{maxWidth:1000, margin:'20px auto'}}>
      <h2>Admin Dashboard - Payments</h2>
      {payments.map(p=>(
        <div key={p.id} style={{border:'1px solid #ccc', padding:12, margin:10}}>
          <div>{p.id} — {p.method} — {p.status}</div>
          {p.method==='bank' && p.status==='pending' && <button onClick={()=>approve(p.id)}>Approve</button>}
        </div>
      ))}
    </div>
  )
}
