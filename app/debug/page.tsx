"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { debugUserBalance, resetUserBalance } from "@/actions/debug";

export default function DebugPage() {
	const [debugData, setDebugData] = useState<any>(null);
	const [loading, setLoading] = useState(false);

	const handleDebugBalance = async () => {
		setLoading(true);
		try {
			const data = await debugUserBalance();
			setDebugData(data);
		} catch (error) {
			console.error("Debug error:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleResetBalance = async () => {
		setLoading(true);
		try {
			await resetUserBalance();
			alert("Balance has been reset to 200 credits");
			// Refresh debug data
			await handleDebugBalance();
		} catch (error) {
			console.error("Reset error:", error);
			alert("Error resetting balance");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='container mx-auto p-6 space-y-6'>
			<h1 className='text-3xl font-bold'>Debug Balance Issue</h1>

			<div className='flex gap-4'>
				<Button onClick={handleDebugBalance} disabled={loading}>
					Check Balance Debug Info
				</Button>

				<Button
					onClick={handleResetBalance}
					disabled={loading}
					variant='destructive'>
					Reset Balance (200 credits)
				</Button>
			</div>

			{debugData && (
				<Card>
					<CardHeader>
						<CardTitle>Debug Information</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							<div>
								<h3 className='font-semibold'>User ID:</h3>
								<p className='font-mono'>{debugData.userId}</p>
							</div>

							<div>
								<h3 className='font-semibold'>Balance Record:</h3>
								<pre className='bg-gray-100 p-4 rounded text-sm overflow-auto'>
									{JSON.stringify(debugData.balance, null, 2)}
								</pre>
							</div>

							<div>
								<h3 className='font-semibold'>Recent Purchases:</h3>
								<pre className='bg-gray-100 p-4 rounded text-sm overflow-auto'>
									{JSON.stringify(debugData.purchases, null, 2)}
								</pre>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
