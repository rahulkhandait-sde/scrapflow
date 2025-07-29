import "server-only";
import Stripe from "stripe";
import { getCreditsPack, PackId } from "../billing";
import prisma from "../prisma";

export async function handleCheckoutSessionCompleted(
	event: Stripe.Checkout.Session
) {
	console.log("Processing checkout session completed:", event.id);

	if (!event.metadata) {
		console.error("Missing metadata in checkout session:", event.id);
		throw new Error("Missing metadata");
	}

	const { userId, packId } = event.metadata;
	console.log("Processing for userId:", userId, "packId:", packId);

	if (!userId) {
		console.error("Missing user id in metadata");
		throw new Error("Missing user id");
	}
	if (!packId) {
		console.error("Missing pack id in metadata");
		throw new Error("Missing pack id");
	}

	const purchasedPack = getCreditsPack(packId as PackId);
	if (!purchasedPack) {
		console.error("Purchase pack not found for packId:", packId);
		throw new Error("Purchase pack not found");
	}

	console.log("Adding credits:", purchasedPack.credits, "to user:", userId);

	try {
		await prisma.userBalance.upsert({
			where: {
				userId,
			},
			create: {
				userId,
				credits: purchasedPack.credits,
			},
			update: {
				credits: {
					increment: purchasedPack.credits,
				},
			},
		});

		console.log("Successfully updated user balance");

		await prisma.userPurchase.create({
			data: {
				userId,
				stripeId: event.id,
				description: `${purchasedPack.name} - ${purchasedPack.credits} credits`,
				amount: event.amount_total!,
				currency: event.currency!,
			},
		});

		console.log("Successfully created purchase record");
	} catch (error) {
		console.error("Database error while processing payment:", error);
		throw error;
	}
}
