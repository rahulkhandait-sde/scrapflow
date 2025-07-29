"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function debugUserBalance() {
	const { userId } = await auth();

	if (!userId) {
		throw new Error("Unauthenticated");
	}

	console.log("Debug: Checking balance for user:", userId);

	const balance = await prisma.userBalance.findUnique({
		where: {
			userId,
		},
	});

	console.log("Debug: Current balance record:", balance);

	const purchases = await prisma.userPurchase.findMany({
		where: {
			userId,
		},
		orderBy: {
			date: "desc",
		},
	});

	console.log("Debug: User purchases:", purchases);

	return {
		userId,
		balance,
		purchases,
	};
}

export async function resetUserBalance() {
	const { userId } = await auth();

	if (!userId) {
		throw new Error("Unauthenticated");
	}

	// Delete existing balance record
	await prisma.userBalance.deleteMany({
		where: {
			userId,
		},
	});

	// Create new balance record with 200 credits
	const newBalance = await prisma.userBalance.create({
		data: {
			userId,
			credits: 200,
		},
	});

	console.log("Reset balance for user:", userId, "to:", newBalance.credits);

	return newBalance;
}
