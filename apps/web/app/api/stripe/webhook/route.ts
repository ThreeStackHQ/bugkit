import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { db, subscriptions, eq } from "@bugkit/db";

export const dynamic = "force-dynamic";

type Tier = "free" | "pro" | "business";

function tierFromMetadata(metadata: Stripe.Metadata | null): Tier {
  const raw = metadata?.["tier"];
  if (raw === "pro" || raw === "business") return raw;
  return "free";
}

async function upsertSubscription(
  userId: string,
  data: {
    tier: Tier;
    status: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    currentPeriodEnd?: Date;
  }
): Promise<void> {
  const [existing] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (existing) {
    await db
      .update(subscriptions)
      .set({
        tier: data.tier,
        status: data.status,
        stripeCustomerId: data.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        currentPeriodEnd: data.currentPeriodEnd ?? null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, userId));
  } else {
    await db.insert(subscriptions).values({
      userId,
      tier: data.tier,
      status: data.status,
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      currentPeriodEnd: data.currentPeriodEnd ?? null,
    });
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  const stripe = getStripe();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing stripe signature or webhook secret" },
      { status: 400 }
    );
  }

  const rawBody = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe/webhook] Invalid signature:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const userId = checkoutSession.metadata?.["userId"];
        const tier = tierFromMetadata(checkoutSession.metadata);

        if (!userId) break;

        const stripeCustomerId =
          typeof checkoutSession.customer === "string"
            ? checkoutSession.customer
            : (checkoutSession.customer?.id ?? null);

        const stripeSubscriptionId =
          typeof checkoutSession.subscription === "string"
            ? checkoutSession.subscription
            : (checkoutSession.subscription?.id ?? null);

        await upsertSubscription(userId, {
          tier,
          status: "active",
          stripeCustomerId,
          stripeSubscriptionId,
        });

        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.["userId"];

        if (!userId) break;

        const tier = tierFromMetadata(sub.metadata);
        const currentPeriodEnd = new Date(sub.current_period_end * 1000);
        const stripeCustomerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;

        await upsertSubscription(userId, {
          tier,
          status: sub.status,
          stripeCustomerId,
          stripeSubscriptionId: sub.id,
          currentPeriodEnd,
        });

        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.["userId"];

        if (!userId) break;

        await db
          .update(subscriptions)
          .set({ status: "canceled", updatedAt: new Date() })
          .where(eq(subscriptions.userId, userId));

        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook] Handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
