-- 1. Users Table
CREATE TABLE public.users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL, -- Used to login (e.g., ahmet123)
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'yetkili', 'personel')),
  password text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- İlk Admin Kullanıcısı
INSERT INTO public.users (email, name, role, password)
VALUES ('admin', 'Admin Kullanıcı', 'admin', 'admin123');

-- 2. Services Table
CREATE TABLE public.services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  prices jsonb NOT NULL, -- Array of { vehicleType, price }
  is_ppf boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Sales Table
CREATE TABLE public.sales (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plate text NOT NULL,
  vehicle_type text NOT NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  service_name text NOT NULL,
  amount numeric NOT NULL,
  staff_id text NOT NULL, -- string ID representing `users.id`
  staff_name text NOT NULL,
  date timestamp with time zone NOT NULL,
  note text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Expenses Table
CREATE TABLE public.expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL CHECK (category IN ('Fatura', 'Maaş', 'Kira', 'Malzeme', 'Diğer')),
  amount numeric NOT NULL,
  note text NOT NULL,
  date timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- GÜVENLİK (Row Level Security - RLS)
-- Şu aşamada MVP için herkesin okuyup yazabileceği bir ayar kullanıyoruz (ya da RLS'i tamamen kapatıyoruz)
-- Eğer Supabase'de tabloyu gizli yapmak isterseniz bu kısımlar devreye girer. Biz şimdilik RLS devre dışı olarak oluşturuyoruz.
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
