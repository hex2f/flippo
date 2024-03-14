import { Button } from '@/components/ui/button';
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation';

export default function Home() {
  async function createNewLobby() {
    'use server'
    try {
      const res = await (await fetch ('/api/lobby')).json()
      redirect(`/lobby/${res.id}`)
    } catch (err) {
      if (err.message === 'NEXT_REDIRECT') throw err
      console.log(err.message)
    }
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
