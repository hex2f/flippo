import DiscordActivitySDK from "../../components/_discordsdk";
export const dynamic = "force-dynamic";

export default async function DiscordActivityPage() {
	return (
    <main className="flex flex-col items-center justify-center flex-1">
			<DiscordActivitySDK />
		</main>
	)
}