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
  winner?: string;
  finishOrder?: string[];
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
  // **추가**: 전체 순위(finishOrder)를 저장할 상태
  const [finishOrder, setFinishOrder] = useState<string[]>([]);

  // 본인 tap 효과 상태
  const [isTapping, setIsTapping] = useState(false);
  // 다른 사용자 wind effect 상태
  const [windEffects, setWindEffects] = useState<Record<string, boolean>>({});

  // **추가**: 게임 시작 여부를 판단하는 상태
  const [hasStarted, setHasStarted] = useState(false);

  // **추가**: 게임 시간 상태 (게임 시작 후 1초마다 증가)
  const [gameTime, setGameTime] = useState(0);

  // 이전 플레이어 상태 (비교용)
  const previousPlayersRef = useRef<Player[]>(initialPlayers);

  // 경주 트랙 컨테이너 크기를 측정하기 위한 ref 및 상태
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackDims, setTrackDims] = useState({ width: 0, height: 0 });

  // 항상 총 6개 레인으로 고정
  const totalLanes = 6;
  // 레인 영역을 전체 화면의 70%로 제한하고 중앙에 배치
  const laneAreaFactor = 0.7;
  const laneAreaHeight = trackDims.height * laneAreaFactor;
  const laneAreaTopOffset = (trackDims.height - laneAreaHeight) / 2;
  const laneHeight = laneAreaHeight ? laneAreaHeight / totalLanes : 120;

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
            setGameEnded(true);
            setWinner(data.winner || null);
            if (data.finishOrder) {
              setFinishOrder(data.finishOrder);
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
        if (!prevPlayer || player.totalPressCount > prevPlayer.totalPressCount) {
          setWindEffects((prev) => ({ ...prev, [player.userName]: true }));
          setTimeout(() => {
            setWindEffects((prev) => ({ ...prev, [player.userName]: false }));
          }, 300);
        }
      }
    });
    previousPlayersRef.current = players;
  }, [players, userName]);

  // **추가**: 게임 시작 후 1초마다 gameTime 상태 증가
  useEffect(() => {
    if (!hasStarted || gameEnded) return;
    const timer = setInterval(() => {
      setGameTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [hasStarted, gameEnded]);

  // **추가**: 모든 플레이어가 100번 이상 탭하거나 gameTime이 100초에 도달하면 게임 종료
  useEffect(() => {
    if (!hasStarted || gameEnded) return;
    if (
      gameTime >= 100 ||
      (players.length > 0 && players.every((player) => player.totalPressCount >= 100))
    ) {
      setGameEnded(true);
      const maxPlayer = players.reduce((prev, cur) =>
        cur.totalPressCount > prev.totalPressCount ? cur : prev,
        players[0]
      );
      setWinner(maxPlayer?.userName || null);
    }
  }, [gameTime, players, hasStarted, gameEnded]);

  // 만약 countdown이 끝났는데 아직 게임이 시작되지 않았다면, 강제로 스페이스바 이벤트 발생!
  useEffect(() => {
    if (hasCountdownFinished && !hasStarted) {
      setTimeout(() => {
        const syntheticEvent = new KeyboardEvent('keyup', { code: 'Space' });
        window.dispatchEvent(syntheticEvent);
      }, 500);
    }
  }, [hasCountdownFinished, hasStarted]);

  // 게임 종료 후 결과 확인 버튼 클릭 시
  const handleResultCheck = () => {
    onResultConfirmed();
  };

  // 게임 종료 화면 렌더링 (finishOrder 목록도 표시)
  if (gameEnded) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gradient-to-br'>
        <div className='bg-white/80 shadow-lg rounded-xl p-10 text-center max-w-md w-full mx-4'>
          <h1 className='text-4xl font-extrabold text-gray-800 mb-4'>Game Over</h1>
          <p className='text-xl text-gray-600 mb-6'>
            Winner:{' '}
            <span className='font-bold text-gray-900'>{winner || 'No Winner'}</span>
          </p>
          {finishOrder.length > 0 && (
            <div className='mb-6'>
              <h2 className='text-2xl font-bold mb-2'>전체 순위</h2>
              <ol className='text-xl text-gray-700'>
                {finishOrder.map((user, index) => (
                  <li key={user}>
                    {index + 1}. {user}
                  </li>
                ))}
              </ol>
            </div>
          )}
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

  // 게임 진행 화면
  return (
    <div
      className='w-full h-screen bg-cover bg-center bg-no-repeat relative overflow-hidden'
      style={{ backgroundImage: "url('/chat_images/game_bg.gif')" }}
      ref={trackRef}
    >
      {/* 시작 마커 - 레일 영역 내에 표시 */}
      {trackDims.height > 0 && (
        <div
          className='absolute pointer-events-none'
          style={{
            left: trackDims.width ? trackDims.width * 0.1 : 95,
            top: laneAreaTopOffset,
            height: laneAreaHeight,
          }}
        >
          <div className='h-full border-l-4 border-green-500'></div>
          <div className='absolute inset-0 flex items-center justify-center'>
            <span className='text-green-500 font-bold text-lg bg-white/70 px-2 py-1 rounded'>
              Start
            </span>
          </div>
        </div>
      )}

      {/* Finish 마커 - 레일 영역 내에 표시 */}
      {trackDims.width > 0 && (
        <div
          className='absolute pointer-events-none'
          style={{
            left: trackDims.width ? trackDims.width * 0.9 : 0,
            top: laneAreaTopOffset,
            height: laneAreaHeight,
          }}
        >
          <div className='h-full border-l-4 border-red-500'></div>
          <div className='absolute inset-0 flex items-center justify-center'>
            <span className='text-red-500 font-bold text-lg bg-white/70 px-2 py-1 rounded'>
              Goal
            </span>
          </div>
        </div>
      )}

      {/* **변경**: 게임 진행 중 상단 중앙에 게임 시간 표시 */}
      {hasCountdownFinished && !gameEnded && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/80 px-4 py-2 rounded text-xl text-gray-800">
          Time: {gameTime}s
        </div>
      )}

      {/* 레인 구분선 (상단, 하단 경계 포함) */}
      {trackDims.height > 0 && (
        <>
          {/* 상단 경계 */}
          <div
            className='absolute left-0 w-full border-t border-gray-300 pointer-events-none'
            style={{ top: `${laneAreaTopOffset}px`, zIndex: 2 }}
          />
          {/* 중간 경계 */}
          {Array.from({ length: totalLanes - 1 }).map((_, i) => (
            <div
              key={i}
              className='absolute left-0 w-full border-t border-gray-300 pointer-events-none'
              style={{
                top: `${laneAreaTopOffset + (i + 1) * laneHeight}px`,
                zIndex: 2,
              }}
            />
          ))}
          {/* 하단 경계 */}
          <div
            className='absolute left-0 w-full border-t border-gray-300 pointer-events-none'
            style={{ top: `${laneAreaTopOffset + laneAreaHeight}px`, zIndex: 2 }}
          />
        </>
      )}

      {/* 플레이어(물고기) 렌더링 */}
      {players.map((player, index) => {
        // 플레이어가 총 6마리 미만인 경우 중앙 정렬을 위한 오프셋 계산
        const offset =
          players.length < totalLanes
            ? Math.floor((totalLanes - players.length) / 2)
            : 0;
        const laneIndex = index + offset;
        const fishSize = laneHeight * 0.8;
        const topPos =
          laneAreaTopOffset + laneIndex * laneHeight + (laneHeight - fishSize) / 2;
        const startOffset = trackDims.width ? trackDims.width * 0.1 : 95;
        const moveFactor = trackDims.width ? trackDims.width * 0.016 : 25;
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
                  style={{
                    width: fishSize * 0.4,
                    height: fishSize * 0.4,
                    position: 'absolute',
                    top: '50%',
                    left: `-${fishSize * 0.4}px`,
                    transform: 'translateY(-50%) scaleX(-1)',
                  }}
                  className='object-contain pointer-events-none'
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
