-- Supabase schema for Math LMS (Phase 1)
create extension if not exists "uuid-ossp";

create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  auth_uid uuid unique,
  email text not null,
  name text,
  role text default 'student',
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists courses (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  price integer not null,
  category text,
  thumbnail text,
  intro_video text,
  featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists lessons (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references courses(id) on delete cascade,
  title text,
  description text,
  type text default 'video',
  content text,
  duration integer,
  "order" integer default 0,
  is_preview boolean default false,
  created_at timestamptz default now()
);

create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete set null,
  course_id uuid references courses(id) on delete set null,
  amount integer,
  method text,
  status text default 'pending',
  payment_id text,
  receipt_url text,
  invoice_url text,
  created_at timestamptz default now(),
  approved_at timestamptz
);

create table if not exists purchases (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  course_id uuid references courses(id),
  payment_id uuid references payments(id),
  access_granted boolean default false,
  purchase_date timestamptz default now()
);

create table if not exists email_logs (
  id uuid primary key default uuid_generate_v4(),
  to_email text,
  subject text,
  template_type text,
  success boolean default false,
  error_message text,
  created_at timestamptz default now()
);