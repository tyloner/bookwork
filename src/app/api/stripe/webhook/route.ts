import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (userId && session.subscription) {
          const subscription = await getStripe().subscriptions.retrieve(
            session.subscription as string
          );

          await prisma.user.update({
            where: { id: userId },
            data: {
              tier: "PREMIUM",
              stripeSubId: subscription.id,
              tierExpiresAt: new Date(
                subscription.current_period_end * 1000
              ),
            },
          });

          await prisma.notification.create({
            data: {
              userId,
              type: "SUBSCRIPTION",
              title: "Welcome to Premium!",
              body: "Your account has been upgraded. Enjoy unlimited matches and more.",
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const user = await prisma.user.findUnique({
          where: { stripeSubId: subscription.id },
        });

        if (user) {
          const isActive = ["active", "trialing"].includes(subscription.status);
          await prisma.user.update({
            where: { id: user.id },
            data: {
              tier: isActive ? "PREMIUM" : "FREE",
              tierExpiresAt: new Date(
                subscription.current_period_end * 1000
              ),
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const user = await prisma.user.findUnique({
          where: { stripeSubId: subscription.id },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              tier: "FREE",
              stripeSubId: null,
              tierExpiresAt: null,
            },
          });

          await prisma.notification.create({
            data: {
              userId: user.id,
              type: "SUBSCRIPTION",
              title: "Subscription ended",
              body: "Your Premium subscription has ended. You can resubscribe anytime.",
            },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
