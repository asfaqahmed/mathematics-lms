import {useState} from 'react';
import axios from 'axios';
import Router from 'next/router';
export default function Register(){
  const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  async function submit(e){
    e.preventDefault();
    const res = await axios.post(process.env.NEXT_PUBLIC_API_BASE + '/auth/register', {name,email, password});
    if(res.data.ok){
      Router.push('/login');
    }else alert('Register failed');
  }
  return (
    <div style={{maxWidth:400, margin:'40px auto'}}>
      <h2>Register</h2>
      <form onSubmit={submit}>
        <input placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />
        <br/>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <br/>
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <br/>
        <button>Register</button>
      </form>
    </div>
  )
}
