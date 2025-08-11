import '../styles/globals.css';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ,
  process.env.NEXT_PUBLIC_SUPABASE_KEY  
);

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} supabase={supabase} />
}

export default MyApp;
