import GameProvider from '@/components/game_context';
import { cookies } from 'next/headers';

export default function LobbyPage({ params }: { params: { id: string }}) {
  const iam = cookies().get('iam')?.value ?? undefined

  return (
    <main className="flex flex-col items-center justify-center flex-1">
      <GameProvider lobbyId={params.id} iam={iam} />
    </main>
  );
}
