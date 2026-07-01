-- Tabelle: milers_registrations
-- Ausführen in: Supabase Dashboard > SQL Editor (Projekt: proathletes-events)

create table if not exists milers_registrations (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  vorname       text,
  nachname      text not null,
  email         text not null,
  geburtsjahr   text,
  zielzeit_10k  text,
  trainingsplan boolean not null default false
);

-- Row Level Security: nur via Service-Key schreibbar (Anon-Key Insert erlauben)
alter table milers_registrations enable row level security;

create policy "anon insert" on milers_registrations
  for insert to anon
  with check (true);

-- Optional: Lesen nur für authentifizierte Admins
create policy "auth select" on milers_registrations
  for select to authenticated
  using (true);
