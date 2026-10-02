-- ==========================================================
-- WAYIN DATABASE SCHEMA & ORGANIC REAL JAKARTA SEED DATA
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ffdvtpmzqokivtujxkac/sql/new
-- ==========================================================

create extension if not exists "uuid-ossp";

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. PLACES
create table if not exists public.places (
  id text primary key,
  name text not null,
  category text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  status text not null default 'accessible',
  primary_features text[] default array[]::text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- 3. ACCESS POINTS
create table if not exists public.access_points (
  id text primary key,
  place_id text not null references public.places(id) on delete cascade,
  name text not null,
  type text not null,
  condition text not null default 'good',
  availability text not null default 'available',
  verification text not null default 'unverified',
  has_no_stairs boolean default false,
  near_accessible_parking boolean default false,
  latitude double precision not null,
  longitude double precision not null,
  description text,
  photo_url text,
  score integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- 4. REPORTS
create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  access_point_id text not null references public.access_points(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'pending',
  created_at timestamptz default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- ENABLE ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.places enable row level security;
alter table public.access_points enable row level security;
alter table public.reports enable row level security;

-- Profiles
alter table public.profiles add column if not exists username text;

drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (true);

-- Automatic trigger: create public.profiles row when auth.users is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    username = coalesce(excluded.username, profiles.username),
    updated_at = now();
  return new;
exception
  when others then
    -- Prevents 'Database error saving new user' if anything goes wrong during profile write
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill existing auth users into public.profiles
insert into public.profiles (id, full_name, username)
select 
  id, 
  coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  coalesce(raw_user_meta_data->>'username', split_part(email, '@', 1))
from auth.users
on conflict (id) do nothing;

-- Places (allow anyone to read, authenticated or anon to insert/update for demo ease)
drop policy if exists "Places are viewable by everyone" on public.places;
create policy "Places are viewable by everyone" on public.places for select using (true);

drop policy if exists "Anyone can insert places" on public.places;
create policy "Anyone can insert places" on public.places for insert with check (true);

drop policy if exists "Anyone can update places" on public.places;
create policy "Anyone can update places" on public.places for update using (true);

-- Access Points (allow anyone to read, anyone to insert for community contributions)
drop policy if exists "Access points are viewable by everyone" on public.access_points;
create policy "Access points are viewable by everyone" on public.access_points for select using (true);

drop policy if exists "Anyone can insert access points" on public.access_points;
create policy "Anyone can insert access points" on public.access_points for insert with check (true);

drop policy if exists "Anyone can update access points" on public.access_points;
create policy "Anyone can update access points" on public.access_points for update using (true);

-- Reports
drop policy if exists "Reports viewable by authenticated" on public.reports;
create policy "Reports viewable by authenticated" on public.reports for select using (true);

drop policy if exists "Anyone can insert reports" on public.reports;
create policy "Anyone can insert reports" on public.reports for insert with check (true);

-- GRANTS
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.places to anon, authenticated;
grant select, insert, update on public.access_points to anon, authenticated;
grant select, insert on public.reports to anon, authenticated;
grant select, update on public.profiles to anon, authenticated;

-- REALTIME PUBLICATION
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'places') then
    alter publication supabase_realtime add table public.places;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'access_points') then
    alter publication supabase_realtime add table public.access_points;
  end if;
end $$;

-- CLEAR AND SEED REAL JAKARTA PLACES
truncate public.reports cascade;
truncate public.access_points cascade;
truncate public.places cascade;

insert into public.places (id, name, category, address, latitude, longitude, status, primary_features) values
('place-monas', 'Monumen Nasional (Monas)', 'Landmark & Wisata', 'Gambir, Kecamatan Gambir, Kota Jakarta Pusat, DKI Jakarta 10110', -6.175389, 106.827139, 'accessible', array['ramp','accessible_entrance','accessible_toilet','accessible_parking']),
('place-grand-indonesia', 'Grand Indonesia Shopping Town', 'Pusat Perbelanjaan', 'Jl. M.H. Thamrin No.1, Gondangdia, Menteng, Jakarta Pusat 10350', -6.195628, 106.821875, 'accessible', array['accessible_entrance','elevator','accessible_toilet','accessible_parking']),
('place-plaza-indonesia', 'Plaza Indonesia', 'Pusat Perbelanjaan', 'Jl. M.H. Thamrin Kav. 28-30, Gondangdia, Menteng, Jakarta Pusat 10350', -6.193056, 106.822222, 'accessible', array['accessible_entrance','elevator','accessible_toilet','accessible_parking']),
('place-gbk', 'Stadion Utama Gelora Bung Karno (GBK)', 'Fasilitas Olahraga', 'Jl. Pintu Satu Senayan, Gelora, Tanah Abang, Jakarta Pusat 10270', -6.218578, 106.802511, 'accessible', array['ramp','accessible_entrance','accessible_toilet','accessible_parking']),
('place-mrt-bundaran-hi', 'Stasiun MRT Bundaran HI', 'Transportasi Publik', 'Jl. M.H. Thamrin, Gondangdia, Menteng, Jakarta Pusat 10350', -6.192778, 106.823056, 'accessible', array['elevator','ramp','accessible_entrance','accessible_toilet']),
('place-rs-cipto', 'RSUPN Dr. Cipto Mangunkusumo (RSCM)', 'Rumah Sakit', 'Jl. Diponegoro No.71, Kenari, Senen, Jakarta Pusat 10430', -6.196389, 106.844722, 'accessible', array['ramp','elevator','accessible_toilet','accessible_parking']),
('place-museum-nasional', 'Museum Nasional Indonesia', 'Museum & Seni', 'Jl. Medan Merdeka Barat No.12, Gambir, Jakarta Pusat 10110', -6.176944, 106.824722, 'partial', array['ramp','accessible_entrance','elevator']),
('place-balai-kota', 'Balai Kota DKI Jakarta', 'Gedung Pemerintah', 'Jl. Medan Merdeka Selatan No.8-9, Gambir, Jakarta Pusat 10110', -6.170556, 106.830278, 'partial', array['ramp','accessible_entrance','accessible_toilet']),
('place-jcc', 'Jakarta Convention Center (JCC)', 'Pusat Konvensi', 'Jl. Jend. Gatot Subroto, Gelora, Tanah Abang, Jakarta Pusat 10270', -6.212500, 106.800556, 'accessible', array['ramp','elevator','accessible_toilet','accessible_parking']),
('place-sarinah', 'Sarinah Thamrin', 'Pusat Perbelanjaan & Budaya', 'Jl. M.H. Thamrin No.11, Gondangdia, Menteng, Jakarta Pusat 10350', -6.187778, 106.823611, 'accessible', array['ramp','elevator','accessible_toilet','accessible_parking']),
('place-tosari', 'Halte Transjakarta Tosari (Iconic Kapal)', 'Transportasi Publik', 'Jl. M.H. Thamrin, Menteng, Jakarta Pusat 10310', -6.197778, 106.822778, 'accessible', array['elevator','ramp','accessible_entrance']),
('place-stasiun-gambir', 'Stasiun Kereta Api Gambir', 'Transportasi Publik', 'Jl. Medan Merdeka Timur No.1, Gambir, Jakarta Pusat 10110', -6.176667, 106.830833, 'accessible', array['elevator','ramp','accessible_toilet','accessible_parking']),
('place-gunadarma', 'Universitas Gunadarma (Kampus Kenari)', 'Perguruan Tinggi', 'Jl. Kenari No. 13, Senen, Jakarta Pusat 10430', -6.192500, 106.848500, 'accessible', array['ramp','elevator','accessible_toilet','accessible_parking']),
('place-ui', 'Universitas Indonesia (Kampus Salemba)', 'Perguruan Tinggi', 'Jl. Salemba Raya No. 4, Kenari, Senen, Jakarta Pusat 10430', -6.194500, 106.850500, 'accessible', array['ramp','elevator','accessible_entrance','accessible_toilet']);

-- SEED REAL ACCESS POINTS
insert into public.access_points (id, place_id, name, type, condition, availability, verification, has_no_stairs, near_accessible_parking, latitude, longitude, description, score) values
-- Monas
('ap-monas-1', 'place-monas', 'Pintu Masuk Selatan (Ramp & Jalur Pemandu)', 'ramp', 'good', 'available', 'verified', true, true, -6.176944, 106.827500, 'Pintu masuk utama dari arah Jl. Medan Merdeka Selatan. Terdapat ramp landai, guiding block taktil, dan petugas standby.', 100),
('ap-monas-2', 'place-monas', 'Chairlift & Lift Menuju Cawan Monas', 'elevator', 'good', 'available', 'verified', true, false, -6.175500, 106.827200, 'Tersedia fasilitas kursi angkat (chairlift) dan elevator untuk akses lansia dan pengguna kursi roda ke area museum cawan.', 55),
('ap-monas-3', 'place-monas', 'Toilet Aksesibel Basement Monas', 'accessible_toilet', 'fair', 'available', 'unverified', true, false, -6.175800, 106.827300, 'Toilet khusus penyandang disabilitas di lantai basement. Pintu geser lebar dan handrail terpasang.', 30),
('ap-monas-4', 'place-monas', 'Parkir Khusus Difabel IRTI Monas', 'accessible_parking', 'good', 'available', 'verified', true, true, -6.178200, 106.826800, 'Slot parkir khusus berdekatan dengan jalur pedestrian langsung menuju gerbang selatan Monas.', 50),

-- Grand Indonesia
('ap-gi-1', 'place-grand-indonesia', 'Pintu Masuk Arjuna (Lobby West Mall)', 'accessible_entrance', 'good', 'available', 'verified', true, true, -6.195278, 106.821667, 'Pintu masuk level ground tanpa tangga dari Jl. Teluk Betung. Concierge counter menyediakan peminjaman kursi roda gratis.', 60),
('ap-gi-2', 'place-grand-indonesia', 'Lift Utama East Mall', 'elevator', 'good', 'available', 'verified', true, false, -6.195833, 106.822222, 'Lift berkapasitas besar dengan tombol braille rendah dan pengumuman audio untuk setiap lantai.', 55),
('ap-gi-3', 'place-grand-indonesia', 'Toilet Aksesibel West Mall Lantai LG', 'accessible_toilet', 'good', 'available', 'verified', true, false, -6.195556, 106.821944, 'Kamar mandi ramah disabilitas dengan tombol darurat otomatis, pintu otomatis, dan wastafel rendah.', 55),
('ap-gi-4', 'place-grand-indonesia', 'Parkir Difabel Basement 1', 'accessible_parking', 'good', 'available', 'verified', true, true, -6.196100, 106.821500, 'Area parkir khusus difabel dekat pintu elevator West Mall B1, dilengkapi rambu jelas.', 50),

-- Plaza Indonesia
('ap-pi-1', 'place-plaza-indonesia', 'Drop-off Utama Lobby Thamrin', 'accessible_entrance', 'good', 'available', 'verified', true, true, -6.192778, 106.822500, 'Drop-off rata tanpa trap tangga. Pintu geser otomatis dan petugas ramah menyambut pengguna kursi roda.', 60),
('ap-pi-2', 'place-plaza-indonesia', 'Elevator Kaca Utama', 'elevator', 'good', 'available', 'verified', true, false, -6.193056, 106.822222, 'Elevator atrium utama menghubungkan semua lantai dari basement hingga bioskop di level 6.', 55),
('ap-pi-3', 'place-plaza-indonesia', 'Toilet Difabel Lantai 3 & 4', 'accessible_toilet', 'good', 'available', 'verified', true, false, -6.193300, 106.822300, 'Toilet luas dengan pegangan tangan lengkap, kloset duduk standar aksesibilitas internasional.', 55),

-- GBK
('ap-gbk-1', 'place-gbk', 'Ramp Akses Pintu 1 Senayan (Standar Asian Para Games)', 'ramp', 'good', 'available', 'verified', true, true, -6.218333, 106.803333, 'Ramp dirancang khusus standar internasional Asian Para Games dengan gradien landai dan pegangan dua tingkat.', 100),
('ap-gbk-2', 'place-gbk', 'Tribune Kursi Roda Sisi Barat', 'accessible_entrance', 'good', 'available', 'verified', true, false, -6.218056, 106.801944, 'Area khusus pengguna kursi roda di lantai tribun utama dengan pandangan leluasa ke lapangan dan kursi pendamping.', 55),
('ap-gbk-3', 'place-gbk', 'Toilet Difabel Sektor 5 Stadion', 'accessible_toilet', 'good', 'available', 'verified', true, false, -6.217500, 106.802222, 'Toilet difabel bersih dengan ruang putar kursi roda luas dan sistem alarm darurat.', 55),
('ap-gbk-4', 'place-gbk', 'Parkir Khusus Difabel Plaza Barat GBK', 'accessible_parking', 'good', 'available', 'verified', true, true, -6.218889, 106.802778, 'Area parkir mobil bertanda khusus dengan akses langsung ke pedestrian lingkar dalam GBK.', 50),

-- MRT Bundaran HI
('ap-mrt-1', 'place-mrt-bundaran-hi', 'Elevator Street Level ke Concourse (Pintu B)', 'elevator', 'good', 'available', 'verified', true, false, -6.192500, 106.823056, 'Elevator langsung dari trotoar Jl. Thamrin menuju lantai tiket (concourse) dan berlanjut ke peron bawah tanah.', 55),
('ap-mrt-2', 'place-mrt-bundaran-hi', 'Gate Tap Khusus Kursi Roda & Guiding Block', 'accessible_entrance', 'good', 'available', 'verified', true, false, -6.192800, 106.822900, 'Gate tiket berukuran ekstra lebar untuk kursi roda atau stroller, terhubung jalur tactile paving.', 55),
('ap-mrt-3', 'place-mrt-bundaran-hi', 'Toilet Aksesibel Stasiun Concourse', 'accessible_toilet', 'good', 'available', 'verified', true, false, -6.192700, 106.822800, 'Toilet penyandang disabilitas berfasilitas lengkap di dalam area berbayar stasiun MRT.', 55),

-- RSCM
('ap-rscm-1', 'place-rs-cipto', 'Ramp Akses UGD 24 Jam', 'ramp', 'good', 'available', 'verified', true, true, -6.196111, 106.844444, 'Ramp lebar tanpa undakan di pintu masuk Instalasi Gawat Darurat. Siaga 24 jam dengan brankar & kursi roda.', 100),
('ap-rscm-2', 'place-rs-cipto', 'Lift Pasien Gedung A', 'elevator', 'fair', 'available', 'unverified', true, false, -6.196389, 106.844722, 'Elevator kapasitas tempat tidur pasien, beroperasi aktif meski sering antri pada jam pelayanan pagi.', 30),
('ap-rscm-3', 'place-rs-cipto', 'Toilet Difabel Poli Rawat Jalan', 'accessible_toilet', 'good', 'available', 'verified', true, false, -6.196600, 106.844700, 'Toilet difabel bersih berdekatan dengan poli spesialis lantai 1.', 55),

-- Museum Nasional
('ap-mn-1', 'place-museum-nasional', 'Ramp Masuk Gedung Arca (Gedung B)', 'ramp', 'good', 'available', 'verified', true, true, -6.177200, 106.824700, 'Akses masuk gedung baru dengan ramp ramah kursi roda dan elevator penghubung ruang pameran bertingkat.', 100),
('ap-mn-2', 'place-museum-nasional', 'Pintu Masuk Utama Gedung Gajah', 'accessible_entrance', 'fair', 'available', 'unverified', false, false, -6.176600, 106.824700, 'Gedung bersejarah memiliki beberapa anak tangga di pintu depan. Disarankan menggunakan ramp di sisi samping.', 0),

-- Balai Kota
('ap-bk-1', 'place-balai-kota', 'Ramp Akses Pendopo Balai Kota', 'ramp', 'good', 'available', 'verified', true, false, -6.170278, 106.830278, 'Ramp di sisi barat pendopo Balai Kota untuk akses masyarakat ke layanan aspirasi dan ruang publik.', 95),
('ap-bk-2', 'place-balai-kota', 'Toilet Aksesibel Gedung Blok G', 'accessible_toilet', 'fair', 'available', 'verified', true, false, -6.170800, 106.830500, 'Toilet difabel di lantai dasar Gedung Blok G Balai Kota DKI.', 40),

-- JCC
('ap-jcc-1', 'place-jcc', 'Pintu Masuk Assembly Hall (Ramp)', 'ramp', 'good', 'available', 'verified', true, true, -6.212222, 106.800833, 'Ramp lebar di lobby Assembly Hall dengan akses mulus langsung ke area pameran tanpa tangga.', 100),
('ap-jcc-2', 'place-jcc', 'Lift Pengunjung Gedung Cendrawasih', 'elevator', 'good', 'available', 'verified', true, false, -6.212500, 106.800556, 'Elevator penghubung lower ground dengan ruang rapat dan ruang seminar utama.', 55),
('ap-jcc-3', 'place-jcc', 'Parkir Difabel Pintu Parkir Timur JCC', 'accessible_parking', 'good', 'available', 'verified', true, true, -6.212778, 106.800278, 'Area parkir mobil difabel berdekatan dengan jalur drop-off pedestrian.', 50),

-- Sarinah
('ap-sarinah-1', 'place-sarinah', 'Ramp Lobby Barat Thamrin', 'ramp', 'good', 'available', 'verified', true, true, -6.187600, 106.823500, 'Ramp mulus dari jalur pedestrian Jl. M.H. Thamrin menuju lobby utama Sarinah pasca revitalisasi.', 100),
('ap-sarinah-2', 'place-sarinah', 'Elevator Pasar Nusantara', 'elevator', 'good', 'available', 'verified', true, false, -6.187800, 106.823700, 'Elevator kaca menuju galeri seni, amphiteater, dan pusat kerajinan nusantara.', 55),
('ap-sarinah-3', 'place-sarinah', 'Toilet Aksesibel Lantai Ground', 'accessible_toilet', 'good', 'available', 'verified', true, false, -6.188000, 106.823600, 'Toilet khusus difabel baru dan sangat terawat dengan fasilitas baby care.', 55),

-- Tosari
('ap-tosari-1', 'place-tosari', 'Lift JPO Tosari Menuju Halte', 'elevator', 'good', 'available', 'verified', true, false, -6.197600, 106.822600, 'Lift vertikal di jembatan penyeberangan orang menghubungkan trotoar Thamrin langsung ke peron bus Transjakarta.', 55),
('ap-tosari-2', 'place-tosari', 'Pelataran Halte Ramah Kursi Roda', 'accessible_entrance', 'good', 'available', 'verified', true, false, -6.197800, 106.822800, 'Lantai rata tanpa celah ke pintu bus low deck / high deck dilengkapi guiding block kuning.', 55),

-- Gambir
('ap-gambir-1', 'place-stasiun-gambir', 'Lift Penumpang Khusus Difabel (Menuju Peron Lantai 3)', 'elevator', 'good', 'available', 'verified', true, false, -6.176667, 106.830833, 'Elevator diprioritaskan bagi penyandang disabilitas dan lansia untuk naik ke peron kereta eksekutif lantai 3.', 55),
('ap-gambir-2', 'place-stasiun-gambir', 'Ramp Pintu Masuk Hall Selatan', 'ramp', 'good', 'available', 'verified', true, true, -6.177200, 106.831000, 'Ramp landai dari area drop-off mobil langsung ke ruang tunggu keberangkatan.', 100),
('ap-gambir-3', 'place-stasiun-gambir', 'Toilet Khusus Difabel Hall Keberangkatan', 'accessible_toilet', 'good', 'available', 'verified', true, false, -6.176500, 106.830700, 'Toilet difabel bersih berfasilitas handrail dan tombol bantuan di hall selatan lantai 1.', 55);