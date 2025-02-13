'use client';

import { getStompClient } from '@/lib/stompclient';
import { useCallback, useEffect, useRef, useState } from 'react';

interface GameProps {
  roomId: string;
  userName: string;
  initialPlayers: Player[]; // GAME_STARTED 메시지에서 받은 플레이어 목록 (각각 mainFishImage 포함)
  onResultConfirmed: () => void;
}

interface Player {
  userName: string;
  totalPressCount: number;
  mainFishImage: string;
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
  // Countdown: 테스트용 3초, 실제로는 적절히 조정 가능
  const [countdown, setCountdown] = useState(3);
  const [hasCountdownFinished, setHasCountdownFinished] = useState(false);

  // 게임 진행 상태
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  // 본인 tap 효과 상태
  const [isTapping, setIsTapping] = useState(false);
  // 다른 사용자 wind effect 상태
  const [windEffects, setWindEffects] = useState<Record<string, boolean>>({});

  // **추가**: 게임 시작 여부를 판단하는 상태
  const [hasStarted, setHasStarted] = useState(false);

  // 이전 플레이어 상태 (비교용)
  const previousPlayersRef = useRef<Player[]>(initialPlayers);

  // 경주 트랙 컨테이너 크기를 측정하기 위한 ref 및 상태
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackDims, setTrackDims] = useState({ width: 0, height: 0 });

  // 컨테이너 크기 측정 (초기 렌더 및 리사이즈 시 업데이트)
  useEffect(() => {
    function updateDims() {
      if (trackRef.current) {
        const rect = trackRef.current.getBoundingClientRect();
        setTrackDims({ width: rect.width, height: rect.height });
      }
    }
    updateDims();
    window.addEventListener('resize', updateDims);
    return () => window.removeEventListener('resize', updateDims);
  }, []);

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

  // Countdown 효과: 매 초 countdown 값을 감소, 0이 되면 게임 시작
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
    setHasCountdownFinished(true);
  }, [countdown]);

  // 스페이스바 tap 이벤트 핸들러 (게임 진행 중)
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (!hasCountdownFinished || gameEnded || e.code !== 'Space') return;
      e.preventDefault();

      // 첫 스페이스바 입력 시 게임 시작 상태로 변경
      if (!hasStarted) {
        setHasStarted(true);
      }

      // 본인 tap 효과: 300ms 동안 표시
      setIsTapping(true);
      setTimeout(() => setIsTapping(false), 300);

      publishMessage('/app/game.press', { roomId, userName, pressCount: 1 });
      console.log('Press message sent:', { roomId, userName, pressCount: 1 });
    },
    [hasCountdownFinished, gameEnded, roomId, userName, hasStarted]
  );

  // Countdown 종료 후 keyup 이벤트 리스너 등록
  useEffect(() => {
    if (hasCountdownFinished) {
      window.addEventListener('keyup', handleKeyPress);
      return () => window.removeEventListener('keyup', handleKeyPress);
    }
  }, [hasCountdownFinished, handleKeyPress]);

  // 백엔드 게임 업데이트 메시지 구독 (PRESS_UPDATED, GAME_ENDED)
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

  // 다른 사용자의 totalPressCount 증가 시 wind effect 트리거
  useEffect(() => {
    players.forEach((player) => {
      if (player.userName !== userName) {
        const prevPlayer = previousPlayersRef.current.find(
          (p) => p.userName === player.userName
        );
        if (
          !prevPlayer ||
          player.totalPressCount > prevPlayer.totalPressCount
        ) {
          setWindEffects((prev) => ({ ...prev, [player.userName]: true }));
          setTimeout(() => {
            setWindEffects((prev) => ({ ...prev, [player.userName]: false }));
          }, 300);
        }
      }
    });
    previousPlayersRef.current = players;
  }, [players, userName]);

  // 게임 종료 후 결과 확인 버튼 클릭 시
  const handleResultCheck = () => {
    onResultConfirmed();
  };

  // 만약 countdown이 끝났는데 아직 게임이 시작되지 않았다면, 강제로 스페이스바 이벤트 발생!
  useEffect(() => {
    if (hasCountdownFinished && !hasStarted) {
      // 잠시 딜레이 후에 합성 이벤트 발생 (딜레이를 줘서 이벤트 등록이 완료되도록)
      setTimeout(() => {
        const syntheticEvent = new KeyboardEvent('keyup', { code: 'Space' });
        window.dispatchEvent(syntheticEvent);
      }, 500);
    }
  }, [hasCountdownFinished, hasStarted]);

  // 게임 종료 화면은 그대로 별도 렌더링
  if (gameEnded) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gradient-to-br'>
        <div className='bg-white/80 shadow-lg rounded-xl p-10 text-center max-w-md w-full mx-4'>
          <h1 className='text-4xl font-extrabold text-gray-800 mb-4'>
            Game Over
          </h1>
          <p className='text-xl text-gray-600 mb-6'>
            Winner:{' '}
            <span className='font-bold text-gray-900'>
              {winner || 'No Winner'}
            </span>
          </p>
          <button
            onClick={handleResultCheck}
            className='w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition duration-300'
          >
            Check Result & Exit
          </button>
        </div>
      </div>
    );
  }

  // 게임 진행 화면: 경주 트랙 영역은 항상 렌더링되고, countdown 전에는 오버레이로 설명을 보여줍니다.
  return (
    <div
      className='w-full h-screen bg-cover bg-center bg-no-repeat relative overflow-hidden'
      style={{ backgroundImage: "url('/chat_images/game_bg.gif')" }}
      ref={trackRef}
    >
      {/* 시작 및 도착 라인 마커 */}
      <div className='absolute left-[10%] top-0 h-full pointer-events-none'>
        <div className='h-full border-l-4 border-green-500'></div>
        <div className='absolute top-2 -translate-x-1/2 text-green-500 font-bold text-lg'>
          Start
        </div>
      </div>
      <div className='absolute left-[90%] top-0 h-full pointer-events-none'>
        <div className='h-full border-l-4 border-red-500'></div>
        <div className='absolute top-2 -translate-x-1/2 text-red-500 font-bold text-lg'>
          Finish
        </div>
      </div>

      {/* 경주 트랙 영역: 플레이어(대표 물고기)들을 렌더링 */}
      {players.map((player, index) => {
        // 레인 높이와 물고기 크기 계산
        const laneHeight = trackDims.height ? trackDims.height / 6 : 120;
        const fishSize = laneHeight * 0.8;
        const topPos = index * laneHeight + (laneHeight - fishSize) / 2;
        // 수평 위치 계산
        // - 출발점: 화면 너비의 10% (startOffset)
        // - 100번의 스페이스바(=50 이동 단위)로 도착점인 화면 너비의 90%에 도달하도록 moveFactor 계산
        const startOffset = trackDims.width ? trackDims.width * 0.1 : 95;
        const moveFactor = trackDims.width ? trackDims.width * 0.016 : 25; // 0.016 * width * 50 = 0.8 * width

        // **현재 사용자의 경우, 아직 게임이 시작되지 않았다면 항상 출발선 위치에 렌더링**
        const leftPos =
          player.userName === userName && !hasStarted
            ? startOffset
            : startOffset + Math.floor(player.totalPressCount / 2) * moveFactor;

        return (
          <div
            key={player.userName}
            className='absolute flex flex-col items-center'
            style={{ top: `${topPos}px`, left: `${leftPos}px`, zIndex: 10 }}
          >
            <div className='relative'>
              <img
                src={player.mainFishImage}
                alt={`${player.userName}의 대표 물고기`}
                style={{ width: fishSize, height: fishSize }}
                className='object-contain scale-x-[-1]'
              />
              {(player.userName === userName
                ? isTapping
                : windEffects[player.userName]) && (
                <img
                  src='/chat_images/wind_overlay.png'
                  alt='Wind effect'
                  style={{ width: fishSize * 0.3, height: fishSize * 0.3 }}
                  className='absolute mt-10 inset-0 object-contain pointer-events-none scale-x-[-1]'
                />
              )}
            </div>
            <span className='mt-[-25px] text-xl font-medium text-gray-900'>
              {player.userName}
            </span>
          </div>
        );
      })}

      {/* 하단 고정 안내 메시지 */}
      <p className='absolute bottom-4 left-1/2 transform -translate-x-1/2 text-2xl text-gray-900'>
        Press the <span className='font-bold'>Spacebar</span> to tap!
      </p>

      {/* 카운트다운 & 게임 설명 오버레이 (게임 시작 전) */}
      {!hasCountdownFinished && (
        <div className='absolute inset-0 flex flex-col justify-center items-center bg-white/80 z-20 p-4'>
          <div className='max-w-6xl w-full text-center bg-white/90 border-2 border-gray-600 rounded-lg shadow-lg p-6'>
            <h3 className='mb-4 text-lg sm:text-lg md:text-2xl lg:text-3xl font-bold flex items-center justify-center'>
              <img
                src='/chat_images/game_stick.png'
                alt='스페이스바'
                className='w-10 sm:w-12 md:w-14 lg:w-16 xl:w-20 h-auto mx-2 inline-block'
              />
              게임 설명
              <img
                src='/chat_images/game_stick.png'
                alt='스페이스바'
                className='w-10 sm:w-12 md:w-14 lg:w-16 xl:w-20 h-auto mx-2 inline-block'
              />
            </h3>
            <p className='text-lg md:text-xl lg:text-5xl font-medium text-gray-800 mt-4'>
              물고기 경주에 오신 걸 환영합니다!
            </p>
            <p className='text-md md:text-lg lg:text-4xl text-gray-700 mt-4'>
              물고기 경주는 친구들과 함께
              <br />
              누가 먼저 Goal에 도착하는지 대결하는 게임입니다.
            </p>
            <p className='text-md md:text-lg lg:text-4xl text-gray-700 mt-4 flex items-center justify-center'>
              친구보다
              <img
                src='/chat_images/spacebar.png'
                alt='스페이스바'
                className='w-10 sm:w-12 md:w-14 lg:w-16 xl:w-20 h-auto mx-2 inline-block'
              />
              스페이스바를 빨리 눌러 1등을 쟁취해보세요!
            </p>
            <p className='mt-8 text-2xl text-gray-800'>
              {countdown} 초 후 게임 시작
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
