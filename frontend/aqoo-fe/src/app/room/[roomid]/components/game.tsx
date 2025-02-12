'use client';

import { getStompClient } from '@/lib/stompclient';
import { useCallback, useEffect, useState } from 'react';

interface GameProps {
  roomId: string;
  userName: string;
  initialPlayers: Player[]; // 추가된 prop
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
  initialPlayers,
  onResultConfirmed,
}: GameProps) {
  // Countdown 상태: 3초 카운트 후 게임 시작
  const [countdown, setCountdown] = useState(5);
  const [hasCountdownFinished, setHasCountdownFinished] = useState(false);

  // 게임 진행 상태
  const [pressCount, setPressCount] = useState(0);
  // 초기 상태를 initialPlayers로 설정합니다.
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
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
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
    setHasCountdownFinished(true);
  }, [countdown]);

  // 스페이스바를 통한 tap 이벤트 핸들러 (게임 진행 중에만 작동)
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (!hasCountdownFinished || gameEnded || e.code !== 'Space') return;
      e.preventDefault();
      setPressCount(prev => prev + 1);
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
          setPlayers(data.players ?? []);
          if (data.message === 'GAME_ENDED') {
            const winningPlayer = (data.players ?? []).find(
              player => player.totalPressCount >= 100
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
  if (!hasCountdownFinished) {
    return (
      <div className="relative flex flex-col justify-center items-center min-h-screen px-4">
        <div className="p-8 bg-white/60 rounded-lg shadow-lg text-center w-[90%] max-w-6xl h-full min-h-[80vh] border-2 border-gray-300 flex flex-col justify-center items-center relative">
          
          {/* 게임 설명 박스를 겹쳐서 배치 */}
          <h3 className="absolute top-[-50px] left-1/2 transform -translate-x-1/2 px-6 py-2 bg-white/80 border-2 border-gray-600 rounded-lg shadow-lg flex items-center text-lg sm:text-lg md:text-2xl lg:text-3xl font-bold">
          <img src="/images/game_stick.png" alt="스페이스바"
              className="w-10 sm:w-12 md:w-14 lg:w-16 xl:w-20 h-auto mx-2 inline-block"
          />
          게임 설명 
          <img src="/images/game_stick.png" alt="스페이스바"
              className="w-10 sm:w-12 md:w-14 lg:w-16 xl:w-20 h-auto mx-2 inline-block"
          />
          </h3>

          <p className="text-lg md:text-xl lg:text-5xl font-medium text-gray-800 text-center mt-10">
            물고기 경주에 오신걸 환영합니다!
          </p>

          <p className="text-md md:text-lg lg:text-4xl text-gray-700 mt-4 text-center">
            물고기 경주는 친구들과 함께<br /><br />
            누가 먼저 Goal에 도착하는지 대결하는 게임입니다.
          </p>

          <p className="text-md md:text-lg lg:text-4xl text-gray-700 mt-4 flex items-center justify-center">
            친구보다
            <img src="/images/spacebar.png" alt="스페이스바"
              className="w-10 sm:w-12 md:w-14 lg:w-16 xl:w-20 h-auto mx-2 inline-block"
            />
            스페이스바를 빨리 눌러 1등을 쟁취해보세요!
          </p>
          <br /><br />
          <p className="text-lg md:text-xl lg:text-2xl text-gray-800">
            {countdown} 초 후 게임시작{countdown > 1 ? '' : ''}
          </p>
        </div>
      </div>
    );
        
  }

  if (gameEnded) {
    return (
      <div className="p-6 mt-6 bg-white rounded shadow text-center">
        <h3 className="mb-4 text-2xl font-bold text-gray-900">Game Over</h3>
        <p className="mb-6 text-xl text-gray-800">
          Winner: <span className="font-bold">{winner || 'No Winner'}</span>
        </p>
        <button
          onClick={handleResultCheck}
          className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          Check Result & Exit
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 mt-6 bg-white rounded shadow">
      <h3 className="mb-4 text-2xl font-bold text-gray-900">Game in Progress</h3>
      <p className="text-lg text-gray-900">
        Your tap count (this session): {pressCount}
      </p>
      <div className="mt-6">
        <h4 className="text-xl font-semibold text-gray-900">Scoreboard:</h4>
        <ul className="mt-2 space-y-2">
          {players.map((player, index) => (
            <li key={index} className="text-lg text-gray-800">
              {player.userName}: {player.totalPressCount} taps
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-4 text-base text-gray-600">
        Press the <span className="font-bold text-gray-900">Spacebar</span> to tap!
      </p>
    </div>
  );
}
