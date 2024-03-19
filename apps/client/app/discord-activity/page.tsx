import dynamic from 'next/dynamic';

const DiscordActivitySDK = dynamic(
	() => import('@/components/_discordsdk'),
	{ ssr: false }
);

export default async function DiscordActivityPage() {
	return (
    <main className="flex flex-col items-center justify-center flex-1">
			<DiscordActivitySDK />
		</main>
	)
}