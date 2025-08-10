import {useState} from 'react';
import axios from 'axios';
import Router from 'next/router';
export default function Login(){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  async function submit(e){
    e.preventDefault();
    const res = await axios.post(process.env.NEXT_PUBLIC_API_BASE + '/auth/login', {email, password});
    if(res.data.token){
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      Router.push('/');
    }else alert('Login failed');
  }
  return (
    <div style={{maxWidth:400, margin:'40px auto'}}>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <br/>
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <br/>
        <button>Login</button>
      </form>
    </div>
  )
}
