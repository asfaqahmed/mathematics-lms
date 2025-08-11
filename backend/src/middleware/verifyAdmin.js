const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const { data: user, error } = await supabase.auth.api.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) return res.status(403).json({ error: 'Forbidden' });
    if (profile.role !== 'admin') return res.status(403).json({ error: 'Admins only' });

    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = verifyAdmin;
