export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getStripe } from "@/lib/stripe";
import { db, users, eq } from "@bugkit/db";

const CheckoutSchema = z.object({
  tier: z.enum(["pro", "business"]),
});

export async function POST(req: NextRequest): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const { tier } = parsed.data;
  const stripe = getStripe();

  // Find or create Stripe customer
  const customers = await stripe.customers.list({
    email: session.user.email,
    limit: 1,
  });

  let customerId: string;
  if (customers.data.length > 0) {
    customerId = customers.data[0]!.id;
  } else {
    const customer = await stripe.customers.create({
      email: session.user.email,
      name: session.user.name ?? undefined,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
  }

  const priceId =
    tier === "pro"
      ? process.env.STRIPE_PRICE_PRO
      : process.env.STRIPE_PRICE_BUSINESS;

  if (!priceId) {
    return NextResponse.json(
      { error: `Stripe price not configured for tier: ${tier}` },
      { status: 500 }
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard?upgrade=success`,
    cancel_url: `${baseUrl}/dashboard?upgrade=canceled`,
    metadata: {
      userId: session.user.id,
      tier,
    },
    subscription_data: {
      metadata: {
        userId: session.user.id,
        tier,
      },
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
