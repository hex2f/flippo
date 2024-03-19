'use client'

import { DiscordSDK } from "@discord/embedded-app-sdk";
import { useEffect, useMemo, useState } from "react";

export default function DiscordActivitySDK() {
	const discordSdk = useMemo(() => new DiscordSDK("1219687171565293638"), []);
	const [ready, setReady] = useState(false);
	
	useMemo(() => {
		discordSdk.ready().then(async () => {
			setReady(true);
		});
	}, [discordSdk]);

	if (!ready) {
		return <div>Loading...</div>;
	}

	return (
		<div>
			<h1>Discord Activity</h1>
			<p>Channel: {discordSdk.channelId}</p>
			<p>Instance: {discordSdk.instanceId}</p>
		</div>
	);
}