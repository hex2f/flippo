import { Button } from '@/components/ui/button';
import { cookies } from 'next/headers'
import { useSearchParams, redirect  } from 'next/navigation';

import dynamicImport from "next/dynamic"

const DiscordActivitySDK = dynamicImport(
	() => import("@/components/_discordsdk"),
	{ ssr: false }
)

export const dynamic = "force-dynamic";

export default function Home() {
  const query = useSearchParams();

  async function createNewLobby() {
    'use server'
    try {
      const res = await (await fetch ('http://localhost:3031/api/lobby')).json()
      redirect(`/lobby/${res.id}`)
    } catch (err) {
      // @ts-expect-error
      if (err.message === 'NEXT_REDIRECT') throw err
      // @ts-expect-error
      console.log(err.message)
    }
  }

  if (query.has('instance_id')) {
    return (
      <main className="flex flex-col items-center justify-center flex-1">
        <DiscordActivitySDK />
      </main>
    )
  }

  return (
    <main className="flex flex-col items-center justify-center flex-1">
      <h1 className="text-4xl font-bold mb-4">
        <span className="animate-3d-flip inline-block delay-100">FLI</span>
        <span className="animate-3d-flip inline-block delay-300">PPO</span>
      </h1>
      <form action={createNewLobby}>
        <Button type="submit">Create new lobby</Button>
      </form>
    </main>
  );
}
