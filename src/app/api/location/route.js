// src/app/api/location/route.js
// Shopper pushes GPS updates here every 4s.
// Writes lat/lng to Supabase orders.shopper_location — triggers realtime for customer.

export async function POST(request) {
  const { order_id, lat, lng, accuracy } = await request.json();
  if (!order_id || lat == null || lng == null)
    return Response.json({ error: "Missing fields" }, { status: 400 });

  try {
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/orders?id=eq.${order_id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ shopper_location: { lat, lng, accuracy, ts: Date.now() } }),
      }
    );
    if (!r.ok) throw new Error(await r.text());
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
