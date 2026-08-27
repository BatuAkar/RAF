-- Supabase Database Schema for RAF Book Club

-- 1. PROFILES TABLE (Kullanıcı profilleri)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text check (char_length(bio) <= 240),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;

create policy "Profiller herkes tarafından görüntülenebilir" on public.profiles
  for select using (true);

create policy "Kullanıcılar kendi profillerini güncelleyebilir" on public.profiles
  for update using (auth.uid() = id);

-- 2. BOOKS TABLE (Arama veya manuel eklenen kitapların önbelleğe alınması)
create table public.books (
  id text primary key, -- Google Books API ID veya özel ID
  title text not null,
  authors text[] not null,
  cover_url text,
  published_date text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Books
alter table public.books enable row level security;

create policy "Kitaplar herkes tarafından görüntülenebilir" on public.books
  for select using (true);

create policy "Kullanıcılar kitap ekleyebilir" on public.books
  for insert with check (auth.role() = 'authenticated');

-- 3. USER BOOKS STATUS TABLE (Okuma Durumları, Favoriler ve Puanlar)
create table public.user_books_status (
  user_id uuid references public.profiles(id) on delete cascade,
  book_id text references public.books(id) on delete cascade,
  status text check (status in ('to_read', 'reading', 'read')), -- okuyacaklarım, okuyorum, okudum
  is_favorite boolean default false not null,
  rating integer check (rating >= 1 and rating <= 10), -- 10 üzerinden puan
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, book_id)
);

-- Enable RLS for User Books Status
alter table public.user_books_status enable row level security;

create policy "Okuma durumları herkes tarafından görüntülenebilir" on public.user_books_status
  for select using (true);

create policy "Kullanıcılar kendi okuma durumlarını yönetebilir" on public.user_books_status
  for all using (auth.uid() = user_id);

-- 4. FOLLOWS TABLE (Takip Mekanizması)
create table public.follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  following_id uuid references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (follower_id, following_id),
  constraint cannot_follow_self check (follower_id <> following_id)
);

-- Enable RLS for Follows
alter table public.follows enable row level security;

create policy "Takip ilişkileri herkes tarafından görüntülenebilir" on public.follows
  for select using (true);

create policy "Kullanıcılar başkalarını takip edebilir/takibi bırakabilir" on public.follows
  for all using (auth.uid() = follower_id);

-- 5. AUTOMATIC PROFILE TRIGGER (Kullanıcı kaydolduğunda otomatik profil oluşturma)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
