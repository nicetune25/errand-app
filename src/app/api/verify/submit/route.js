// src/app/api/verify/submit/route.js
// Stores a verification submission. BVN is masked before storage.
// In production: trigger NIMC/CAC webhook here.

export async function POST(request) {
  const { user_id, type, id_type, id_number, bvn, cac_number } = await request.json();
  if (!user_id || !type)
    return Response.json({ error: "Missing required fields" }, { status: 400 });

  try {
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/verifications`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          user_id, type, id_type,
          id_number: id_number ? "***" + id_number.slice(-3) : null,
          bvn: bvn ? "*".repeat(7) + bvn.slice(-4) : null,
          cac_number,
          status: "pending",
          submitted_at: new Date().toISOString(),
        }),
      }
    );
    const data = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(data));
    return Response.json({ ok: true, id: data[0]?.id });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

/*  SQL for Supabase — add to your SQL Editor:

create table public.verifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  type text check (type in ('shopper','store')) not null,
  id_type text,
  id_number text,
  bvn text,
  cac_number text,
  status text default 'pending' check (status in ('pending','verified','rejected')),
  reviewer_id uuid,
  rejection_note text,
  submitted_at timestamptz default now(),
  reviewed_at timestamptz
);
alter table public.verifications enable row level security;
create policy "Users can view own verifications" on public.verifications
  for select using (auth.uid() = user_id);
create policy "Users can insert own verifications" on public.verifications
  for insert with check (auth.uid() = user_id);
alter publication supabase_realtime add table public.verifications;
*/
