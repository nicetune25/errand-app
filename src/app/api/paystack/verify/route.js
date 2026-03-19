// src/app/api/paystack/verify/route.js
// Verifies a Paystack payment reference server-side.
// The PAYSTACK_SECRET_KEY never reaches the browser.

export async function POST(request) {
  const { reference } = await request.json();

  if (!reference) {
    return Response.json({ error: "Missing payment reference" }, { status: 400 });
  }

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return Response.json({ error: "PAYSTACK_SECRET_KEY not set" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = await res.json();

    if (!data.status) {
      return Response.json({ error: data.message || "Verification failed" }, { status: 400 });
    }

    const tx = data.data;

    return Response.json({
      verified: tx.status === "success",
      amount: tx.amount / 100, // convert from kobo to naira
      reference: tx.reference,
      email: tx.customer?.email,
      paid_at: tx.paid_at,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
