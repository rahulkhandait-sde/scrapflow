import { handleCheckoutSessionCompleted } from "@/lib/stripe/handleCheckoutSessionCompleted";
import { stripe } from "@/lib/stripe/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	const body = await request.text();

	const signatureHeaders = headers().get("stripe-signature") as string;

	try {
		const event = stripe.webhooks.constructEvent(
			body,
			signatureHeaders,
			process.env.STRIPE_WEBHOOK_SECRET!
		);

		switch (event.type) {
			case "checkout.session.completed":
				console.log(
					"Processing checkout.session.completed event:",
					event.data.object.id
				);
				await handleCheckoutSessionCompleted(event.data.object);
				console.log("Successfully processed checkout.session.completed event");
				break;

			default:
				console.log("Unhandled event type:", event.type);
				break;
		}

		return new NextResponse(null, { status: 200 });
	} catch (error) {
		console.error("Stripe webhook error", error);
		return new NextResponse("webhook error", { status: 400 });
	}
}
