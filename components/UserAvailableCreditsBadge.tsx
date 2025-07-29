"use client";

import { getAvailableCredits } from "@/actions/billings";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Coins, Loader2 } from "lucide-react";
import Link from "next/link";
import React from "react";
import ReactCountUpWrapper from "./ReactCountUpWrapper";
import { buttonVariants } from "./ui/button";

function UserAvailableCreditsBadge() {
	const query = useQuery({
		queryKey: ["userAvailableCredits"],
		queryFn: () => getAvailableCredits(),
		refetchInterval: 30 * 1000,
	});

	return (
		<Link
			href={"/billing"}
			className={cn(
				"w-full space-x-2 items-center",
				buttonVariants({
					variant: "outline",
				})
			)}>
			<Coins size={20} className='text-primary' />
			<span className='font-semibold capitalize'>
				{query.isLoading && <Loader2 className='w-4 h-4 animate-spin' />}
				{!query.isLoading && query.data !== undefined && query.data >= 0 && (
					<ReactCountUpWrapper value={query.data} />
				)}
				{!query.isLoading &&
					(query.data === undefined || query.data < 0) &&
					"0"}
			</span>
		</Link>
	);
}

export default UserAvailableCreditsBadge;
