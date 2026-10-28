create extension if not exists vector with schema extensions;
create table if not exists public.fms_enrollments (
    id uuid primary key default gen_random_uuid(),
    person_id text not null,
    person_type text not null check (person_type in ('customer','employee')),
    full_name text not null,
    branch text,
    face_embedding extensions.vector(512) not null,
    model_name text not null default 'buffalo_l',
    created_at timestamptz not null default now(),
    unique(person_type,person_id)
);
create table if not exists public.fms_attendance (
    id uuid primary key default gen_random_uuid(),
    employee_id text not null,
    event_type text not null check (event_type in ('check-in','check-out')),
    similarity double precision,
    created_at timestamptz not null default now()
);
alter table public.fms_enrollments enable row level security;
alter table public.fms_attendance enable row level security;
-- Do not grant anonymous access to biometric data.
