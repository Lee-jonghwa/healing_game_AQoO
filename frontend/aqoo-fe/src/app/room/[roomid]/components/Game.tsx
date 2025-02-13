"use client";

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
  // 게임 진행 시간: 초기 30초부터 시작
  const [countdown, setCountdown] = useState(30);
  
  // 게임 진행 상태
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  // 전체 순위(finishOrder)
  const [finishOrder, setFinishOrder] = useState<string[]>([]);

  // 본인 tap 효과 상태
  const [isTapping, setIsTapping] = useState(false);
  // 다른 사용자 wind effect 상태
  const [windEffects, setWindEffects] = useState<Record<string, boolean>>({});

  // 게임 시작 여부를 판단하는 상태
  const [hasStarted, setHasStarted] = useState(false);

  // 모달 창 닫힘 상태 (확인 버튼 클릭 시 true)
  const [modalDismissed, setModalDismissed] = useState(false);

  // 이전 플레이어 상태 (비교용)
  const previousPlayersRef = useRef<Player[]>(initialPlayers);

  // 경주 트랙 컨테이너 크기 측정용 ref 및 상태
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackDims, setTrackDims] = useState({ width: 0, height: 0 });

  // 항상 총 6개 레인
  const totalLanes = 6;
  // 레인 영역 크기 및 위치 계산
  const laneAreaFactor = 0.7;
  const laneAreaHeight = trackDims.height * laneAreaFactor;
  const laneAreaTopOffset = (trackDims.height - laneAreaHeight) / 2;
  const laneHeight = laneAreaHeight ? laneAreaHeight / totalLanes : 120;

  // 컨테이너 크기 측정 (초기 렌더 및 리사이즈)
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

  // 게임 시작 전 안내 및 countdown 오버레이: 게임 시작 전에는 오버레이를 보여줍니다.
  // (게임이 시작되면 hasStarted가 true가 되어 오버레이는 사라집니다.)
  
  // 스페이스바 tap 이벤트 핸들러
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      // 게임이 종료되었거나, 스페이스바가 아닐 경우 무시
      if (gameEnded || e.code !== 'Space') return;
      e.preventDefault();

      // 게임이 아직 시작되지 않았다면 게임 시작 처리
      if (!hasStarted) {
        setHasStarted(true);
        return; // 첫 스페이스바는 게임 시작만 담당
      }

      // 게임 진행 중 추가 탭 처리 (현재 유저가 이미 100에 도달한 경우 무시)
      const currentUserPlayer = players.find((p) => p.userName === userName);
      if (currentUserPlayer && currentUserPlayer.totalPressCount >= 100) return;

      // 본인 tap 효과
      setIsTapping(true);
      setTimeout(() => setIsTapping(false), 300);

      publishMessage('/app/game.press', { roomId, userName, pressCount: 1 });
      console.log('Press message sent:', { roomId, userName, pressCount: 1 });
    },
    [gameEnded, hasStarted, players, roomId, userName]
  );

  // 키 이벤트 리스너 등록 (항상 등록)
  useEffect(() => {
    window.addEventListener('keyup', handleKeyPress);
    return () => window.removeEventListener('keyup', handleKeyPress);
  }, [handleKeyPress]);

  // 게임 시작 후 countdown 타이머: 게임이 시작되면 1초마다 countdown 감소, 0이 되면 게임 종료 처리
  useEffect(() => {
    if (hasStarted && !gameEnded) {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        // countdown이 0이면 게임 종료 처리
        setGameEnded(true);
        const maxPlayer = players.reduce((prev, cur) =>
          cur.totalPressCount > prev.totalPressCount ? cur : prev,
          players[0]
        );
        setWinner(maxPlayer?.userName || null);
        publishMessage('/app/game.end', { roomId });
      }
    }
  }, [hasStarted, gameEnded, countdown, players, roomId]);

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
            console.log("winner:", data.winner);
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

  // 결승 모달 닫기 핸들러
  const handleModalClose = () => {
    setModalDismissed(true);
  };

  // 게임 종료 후 결과 확인 버튼 클릭 시
  const handleResultCheck = () => {
    onResultConfirmed();
  };

  // 현재 유저의 플레이어 정보 확인
  const currentUserPlayer = players.find((p) => p.userName === userName);
  const hasArrived = currentUserPlayer ? currentUserPlayer.totalPressCount >= 100 : false;

  // 게임 종료 화면
  if (gameEnded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br">
        <div className="bg-white/80 shadow-xl rounded-2xl p-10 text-center max-w-md w-full mx-4">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-6">Game Over</h1>
          <p className="text-xl text-gray-600 mb-8">
            Winner: <span className="font-bold text-gray-900">{winner || 'No Winner'}</span>
          </p>
          {finishOrder.length > 0 && (
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">전체 순위</h2>
              <div className="bg-gray-100 rounded-lg shadow-md p-4">
                <ol className="divide-y divide-gray-300">
                  {finishOrder.map((user, index) => (
                    <li key={user} className="py-2 flex justify-between items-center">
                      <span className="font-semibold text-gray-700">{index + 1}.</span>
                      <span className="text-gray-900">{user}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
          <button
            onClick={handleResultCheck}
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition duration-300"
          >
            채팅방으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-screen bg-cover bg-center bg-no-repeat relative overflow-hidden"
      style={{ backgroundImage: "url('/chat_images/game_bg.gif')" }}
      ref={trackRef}
    >
      {/* 결승점 도착 모달 (게임 종료 전) */}
      {!gameEnded && hasArrived && !modalDismissed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-30">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">결승점 도착!</h2>
            <p className="text-xl mb-4">다른 물고기들이 도착할 때까지 기다려주세요!</p>
            <button
              onClick={handleModalClose}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded transition duration-300"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 시작 마커 */}
      {trackDims.height > 0 && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: trackDims.width ? trackDims.width * 0.1 : 95,
            top: laneAreaTopOffset,
            height: laneAreaHeight,
          }}
        >
          <div className="h-full border-l-4 border-green-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-green-500 font-bold text-lg bg-white/70 px-2 py-1 rounded">
              Start
            </span>
          </div>
        </div>
      )}

      {/* Finish 마커 */}
      {trackDims.width > 0 && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: trackDims.width ? trackDims.width * 0.9 : 0,
            top: laneAreaTopOffset,
            height: laneAreaHeight,
          }}
        >
          <div className="h-full border-l-4 border-red-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-red-500 font-bold text-lg bg-white/70 px-2 py-1 rounded">
              Goal
            </span>
          </div>
        </div>
      )}

      {/* 게임 진행 중 타이머 */}
      {hasStarted && !gameEnded && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/80 px-4 py-2 rounded text-xl text-gray-800">
          Time: {countdown}s
        </div>
      )}

      {/* 레인 구분선 */}
      {trackDims.height > 0 && (
        <>
          <div
            className="absolute left-0 w-full border-t border-gray-300 pointer-events-none"
            style={{ top: `${laneAreaTopOffset}px`, zIndex: 2 }}
          />
          {Array.from({ length: totalLanes - 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute left-0 w-full border-t border-gray-300 pointer-events-none"
              style={{
                top: `${laneAreaTopOffset + (i + 1) * laneHeight}px`,
                zIndex: 2,
              }}
            />
          ))}
          <div
            className="absolute left-0 w-full border-t border-gray-300 pointer-events-none"
            style={{ top: `${laneAreaTopOffset + laneAreaHeight}px`, zIndex: 2 }}
          />
        </>
      )}

      {/* 플레이어(물고기) 렌더링 */}
      {players.map((player, index) => {
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
            className="absolute flex flex-col items-center"
            style={{ top: `${topPos}px`, left: `${leftPos}px`, zIndex: 10 }}
          >
            <div className="relative">
              <img
                src={player.mainFishImage}
                alt={`${player.userName}의 대표 물고기`}
                style={{ width: fishSize, height: fishSize }}
                className="object-contain scale-x-[-1]"
              />
              {(player.userName === userName
                ? isTapping
                : windEffects[player.userName]) && (
                <img
                  src="/chat_images/wind_overlay.png"
                  alt="Wind effect"
                  style={{
                    width: fishSize * 0.4,
                    height: fishSize * 0.4,
                    position: "absolute",
                    top: "50%",
                    left: `-${fishSize * 0.4}px`,
                    transform: "translateY(-50%) scaleX(-1)",
                  }}
                  className="object-contain pointer-events-none"
                />
              )}
            </div>
            <span className="mt-[-25px] text-xl font-medium text-gray-900">
              {player.userName}
            </span>
          </div>
        );
      })}

      {/* 하단 고정 안내 메시지 */}
      <p className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-2xl text-gray-900">
        Press the <span className="font-bold">Spacebar</span> to tap!
      </p>

      {/* 게임 설명 & countdown 오버레이 (게임 시작 전) */}
      {!hasStarted && (
        <div className="absolute inset-0 flex flex-col justify-center items-center bg-white/90 z-20 p-4">
          <div className="max-w-6xl w-full text-center border-2 border-gray-600 rounded-lg shadow-lg p-6 bg-white/90">
            <h3 className="mb-4 text-lg sm:text-lg md:text-2xl lg:text-3xl font-bold flex items-center justify-center">
              <img
                src="/chat_images/game_stick.png"
                alt="스페이스바"
                className="w-10 sm:w-12 md:w-14 lg:w-16 xl:w-20 h-auto mx-2 inline-block"
              />
              게임 설명
              <img
                src="/chat_images/game_stick.png"
                alt="스페이스바"
                className="w-10 sm:w-12 md:w-14 lg:w-16 xl:w-20 h-auto mx-2 inline-block"
              />
            </h3>
            <p className="text-lg md:text-xl lg:text-5xl font-medium text-gray-800 mt-4">
              물고기 경주에 오신 걸 환영합니다!
            </p>
            <p className="text-md md:text-lg lg:text-4xl text-gray-700 mt-4">
              물고기 경주는 친구들과 함께
              <br />
              누가 먼저 Goal에 도착하는지 대결하는 게임입니다.
            </p>
            <p className="text-md md:text-lg lg:text-4xl text-gray-700 mt-4 flex items-center justify-center">
              친구보다
              <img
                src="/chat_images/spacebar.png"
                alt="스페이스바"
                className="w-10 sm:w-12 md:w-14 lg:w-16 xl:w-20 h-auto mx-2 inline-block"
              />
              스페이스바를 빨리 눌러 1등을 쟁취해보세요!
            </p>
            <p className="mt-8 text-2xl text-gray-800">
              {countdown} 초 후 게임 종료
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
