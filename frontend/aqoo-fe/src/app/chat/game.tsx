'use client';

import { getStompClient } from '@/lib/stompclient';
import { useCallback, useEffect, useState } from 'react';

interface GameProps {
  roomId: string;
  userName: string;
  onResultConfirmed: () => void;
}

interface Player {
  userName: string;
  totalPressCount: number;
}

interface RoomResponse {
  roomId: string;
  players: Player[];
  message: string;
}

export default function Game({
  roomId,
  userName,
  onResultConfirmed,
}: GameProps) {
  // Countdown 상태: 3초 카운트 후 게임 시작
  const [countdown, setCountdown] = useState(3);
  const [hasCountdownFinished, setHasCountdownFinished] = useState(false);

  // 게임 진행 상태
  const [pressCount, setPressCount] = useState(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  // HELPER: STOMP 메시지 전송 함수
  const publishMessage = (destination: string, message: object) => {
    const client = getStompClient();
    if (client && client.connected) {
      client.publish({
        destination,
        body: JSON.stringify(message),
      });
    } else {
      console.error('STOMP client is not connected yet.');
    }
  };

  // Countdown 효과: 1초마다 countdown 값을 감소시키고, 0이 되면 게임 시작 상태로 전환
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
    setHasCountdownFinished(true);
  }, [countdown]);

  // 스페이스바를 통한 tap 이벤트 핸들러 (게임 진행 중에만 작동)
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (!hasCountdownFinished || gameEnded || e.code !== 'Space') return;
      e.preventDefault();
      setPressCount((prev) => prev + 1);
      publishMessage('/app/game.press', { roomId, userName, pressCount: 1 });
      console.log('Press message sent:', { roomId, userName, pressCount: 1 });
    },
    [hasCountdownFinished, gameEnded, roomId, userName]
  );

  // Countdown이 끝나면 keyup 이벤트 리스너 등록
  useEffect(() => {
    if (hasCountdownFinished) {
      window.addEventListener('keyup', handleKeyPress);
      return () => window.removeEventListener('keyup', handleKeyPress);
    }
  }, [hasCountdownFinished, handleKeyPress]);

  // 백엔드에서 게임 업데이트 메시지 구독 (PRESS_UPDATED, GAME_ENDED 등)
  useEffect(() => {
    const client = getStompClient();
    if (client) {
      const subscription = client.subscribe(
        `/topic/room/${roomId}`,
        (message) => {
          const data: RoomResponse = JSON.parse(message.body);
          console.log('Room update received:', data);
          setPlayers(data.players);
          if (data.message === 'GAME_ENDED') {
            // 예시 조건: 플레이어의 totalPressCount가 100 이상이면 승리로 간주
            const winningPlayer = data.players.find(
              (player) => player.totalPressCount >= 100
            );
            if (winningPlayer) {
              setGameEnded(true);
              setWinner(winningPlayer.userName);
            }
          }
        }
      );
      return () => subscription.unsubscribe();
    }
  }, [roomId]);

  // 게임 종료 후 결과 확인 버튼 클릭 시 호출되는 콜백
  const handleResultCheck = () => {
    onResultConfirmed();
  };

  // 렌더링: 카운트다운, 게임 진행, 게임 종료 화면 분기 처리

  // Countdown 화면
  if (!hasCountdownFinished) {
    return (
      <div className='p-6 mt-6 bg-white rounded shadow text-center'>
        <h3 className='text-3xl font-bold mb-6 text-gray-900'>Get Ready!</h3>
        <p className='text-xl text-gray-800'>
          Game starts in {countdown} second{countdown > 1 ? 's' : ''}...
        </p>
      </div>
    );
  }

  // 게임 종료 화면
  if (gameEnded) {
    return (
      <div className='p-6 mt-6 bg-white rounded shadow text-center'>
        <h3 className='mb-4 text-2xl font-bold text-gray-900'>Game Over</h3>
        <p className='mb-6 text-xl text-gray-800'>
          Winner: <span className='font-bold'>{winner || 'No Winner'}</span>
        </p>
        <button
          onClick={handleResultCheck}
          className='px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors'
        >
          Check Result & Exit
        </button>
      </div>
    );
  }

  // 게임 진행 화면
  return (
    <div className='p-6 mt-6 bg-white rounded shadow'>
      <h3 className='mb-4 text-2xl font-bold text-gray-900'>
        Game in Progress
      </h3>
      <p className='text-lg text-gray-900'>
        Your tap count (this session): {pressCount}
      </p>
      <div className='mt-6'>
        <h4 className='text-xl font-semibold text-gray-900'>Scoreboard:</h4>
        <ul className='mt-2 space-y-2'>
          {players.map((player, index) => (
            <li key={index} className='text-lg text-gray-800'>
              {player.userName}: {player.totalPressCount} taps
            </li>
          ))}
        </ul>
      </div>
      <p className='mt-4 text-base text-gray-600'>
        Press the <span className='font-bold text-gray-900'>Spacebar</span> to
        tap!
      </p>
    </div>
  );
}
