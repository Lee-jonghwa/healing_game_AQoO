'use client';

import { getStompClient } from '@/lib/stompclient';
import { User } from '@/store/authAtom';
import { useCallback, useEffect, useRef, useState } from 'react';

interface GameProps {
  roomId: string;
  userName: string;
  initialPlayers: Player[];
  onResultConfirmed: () => void;
  user: User; // 로그인한 사용자의 정보 (레벨, 닉네임 등)
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

interface ExpResponse {
  curExp: number;
  expToNextLevel: number;
  expProgress: number;
  userLevel: number;
  message: string;
}

interface TicketResponse {
  userId: string;
  fishTicket: number; // 증가 후 현재 티켓 수
}

// 등수별 경험치 계산 함수
function getExpByRank(rank: number): number {
  if (rank === 1) return 20;
  if (rank === 2) return 10;
  if (rank === 3) return 5;
  return 3; // 4등~6등은 3
}

export default function Game({
  roomId,
  userName,
  initialPlayers,
  onResultConfirmed,
  user,
}: GameProps) {
  // 1) 게임 시작 전 레벨
  const [prevLevel] = useState<number>(user.level ?? 0);

  // 2) 모달 표시 상태
  const [showExpModal, setShowExpModal] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);

  // 3) 티켓, 경험치 정보
  const [myTicket, setMyTicket] = useState<number | null>(null);
  const [myExpInfo, setMyExpInfo] = useState<ExpResponse | null>(null);

  // **추가**: “획득 경험치(earnedExp)”를 저장할 상태
  const [myEarnedExp, setMyEarnedExp] = useState<number>(0);

  // 4) 게임 진행 상태
  const [countdown, setCountdown] = useState(3);
  const [hasCountdownFinished, setHasCountdownFinished] = useState(false);

  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [finishOrder, setFinishOrder] = useState<string[]>([]);

  const [isTapping, setIsTapping] = useState(false);
  const [windEffects, setWindEffects] = useState<Record<string, boolean>>({});

  const [hasStarted, setHasStarted] = useState(false);
  const [gameTime, setGameTime] = useState(30);

  const [modalDismissed, setModalDismissed] = useState(false);

  // 5) 이전 players
  const previousPlayersRef = useRef<Player[]>(initialPlayers);

  // 6) 트랙 크기 측정
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackDims, setTrackDims] = useState({ width: 0, height: 0 });

  const totalLanes = 6;
  const laneAreaFactor = 0.7;
  const laneAreaHeight = trackDims.height * laneAreaFactor;
  const laneAreaTopOffset = (trackDims.height - laneAreaHeight) / 2;
  const laneHeight = laneAreaHeight ? laneAreaHeight / totalLanes : 120;

  // -----------------------------
  // (A) 트랙 사이즈 측정
  // -----------------------------
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

  // (B) STOMP 전송 함수
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

  // (C) 카운트다운
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
    setHasCountdownFinished(true);
  }, [countdown]);

  // (D) 탭(스페이스바 또는 마우스 클릭) 시 호출되는 함수
  const handleTap = useCallback(() => {
    if (!hasCountdownFinished || gameEnded) return;
    const me = players.find((p) => p.userName === userName);
    if (me && me.totalPressCount >= 100) {
      return;
    }
    if (!hasStarted) {
      setHasStarted(true);
    }
    setIsTapping(true);
    setTimeout(() => setIsTapping(false), 300);

    publishMessage('/app/game.press', { roomId, userName, pressCount: 1 });
  }, [hasCountdownFinished, gameEnded, players, userName, hasStarted, roomId]);

  // (E) 스페이스바 keyup 이벤트 핸들러
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      handleTap();
    },
    [handleTap]
  );

  // (F) countdown 끝 → keyup, click 이벤트 등록
  useEffect(() => {
    if (hasCountdownFinished) {
      window.addEventListener('keyup', handleKeyPress);
      window.addEventListener('click', handleTap);
      return () => {
        window.removeEventListener('keyup', handleKeyPress);
        window.removeEventListener('click', handleTap);
      };
    }
  }, [hasCountdownFinished, handleKeyPress, handleTap]);

  // (G) STOMP 구독
  useEffect(() => {
    const client = getStompClient();
    if (client) {
      const sub = client.subscribe(`/topic/room/${roomId}`, (message) => {
        const data: RoomResponse = JSON.parse(message.body);
        setPlayers(data.players ?? []);
        if (data.message === 'GAME_ENDED') {
          setGameEnded(true);
          setWinner(data.winner || null); // 서버 우승자
          if (data.finishOrder) {
            setFinishOrder(data.finishOrder);
          }
        }
      });
      return () => sub.unsubscribe();
    }
  }, [roomId]);

  // (H) wind effect
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

  // (I) 1초마다 gameTime--
  useEffect(() => {
    if (!hasStarted || gameEnded) return;
    const timer = setInterval(() => {
      setGameTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [hasStarted, gameEnded]);

  // (J) gameTime=0 or 모두 100탭 → 종료
  useEffect(() => {
    if (!hasStarted || gameEnded) return;
    if (
      gameTime <= 0 ||
      (players.length > 0 && players.every((p) => p.totalPressCount >= 100))
    ) {
      setGameEnded(true);

      const maxPlayer = players.reduce(
        (prev, cur) =>
          cur.totalPressCount > prev.totalPressCount ? cur : prev,
        players[0]
      );
      setWinner(maxPlayer?.userName || null);

      publishMessage('/app/game.end', { roomId });
    }
  }, [gameTime, players, hasStarted, gameEnded]);

  // (K) countdown 끝났는데 안시작 → 강제 tap
  useEffect(() => {
    if (hasCountdownFinished && !hasStarted) {
      setTimeout(() => {
        window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
      }, 0);
    }
  }, [hasCountdownFinished, hasStarted]);

  // (L) 게임 종료 & finishOrder가 있으면, 내 등수별로 exp-up
  useEffect(() => {
    if (!gameEnded || finishOrder.length === 0) return;

    // 내 등수
    const rank = finishOrder.indexOf(userName) + 1;
    if (rank <= 0) {
      console.log('내 이름이 finishOrder에 없음 (관전자?)');
      return;
    }
    // 등수별 경험치
    const earnedExp = getExpByRank(rank);
    setMyEarnedExp(earnedExp); // ★ 획득 경험치 저장

    // exp-up API 호출
    (async () => {
      try {
        const response = await fetch(
          'https://i12e203.p.ssafy.io/api/v1/users/exp-up',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userName, earnedExp }),
          }
        );
        if (!response.ok) {
          throw new Error('경험치 지급 실패');
        }
        const data: ExpResponse = await response.json();
        setMyExpInfo(data);
        console.log('내 경험치 갱신 성공:', data);
      } catch (err) {
        console.error('경험치 지급 에러:', err);
      }
    })();
  }, [gameEnded, finishOrder, userName]);

  // (M) 현재 유저 도착 체크
  const me = players.find((p) => p.userName === userName);
  const hasArrived = me ? me.totalPressCount >= 100 : false;

  // (N) 결과 확인 버튼
  const handleResultCheck = () => onResultConfirmed();

  // (O) 결승점 모달 닫기
  const handleModalClose = () => setModalDismissed(true);

  // (P) 내 expInfo 생성 시, 경험치 모달 표시
  useEffect(() => {
    if (myExpInfo) {
      setShowExpModal(true);
    }
  }, [myExpInfo]);

  // (Q) 경험치 모달 닫기 -> 레벨 업 확인
  const handleExpModalClose = () => {
    setShowExpModal(false);
    if (!myExpInfo) return;

    // 레벨 업이면 모달 열기 + 티켓 +1
    if (myExpInfo.userLevel > prevLevel) {
      setShowLevelUpModal(true);

      (async () => {
        try {
          const ticketRes = await fetch(
            `https://i12e203.p.ssafy.io/api/v1/fish/ticket/${userName}`,
            { method: 'GET' }
          );
          if (!ticketRes.ok) throw new Error('티켓 증가 실패');

          const ticketData: TicketResponse = await ticketRes.json();
          setMyTicket(ticketData.fishTicket);
          console.log('티켓 +1 성공:', ticketData.fishTicket);
        } catch (err) {
          console.error('티켓 증가 에러:', err);
        }
      })();
    }
  };

  // (R) 레벨 업 모달 닫기
  const handleLevelUpModalClose = () => {
    setShowLevelUpModal(false);
  };

  // -----------------------------
  // 게임 종료 화면
  // -----------------------------
  if (gameEnded) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gradient-to-br'>
        <div className='bg-white/80 shadow-xl rounded-2xl p-10 text-center max-w-md w-full mx-4'>
          <h1 className='text-4xl font-extrabold text-gray-800 mb-6'>
            Game Over
          </h1>

          {/* (1) 우승자 (서버에서 준 winner) */}
          <p className='text-xl text-gray-600 mb-6'>
            Winner:{' '}
            <span className='font-bold text-gray-900'>
              {winner || 'No Winner'}
            </span>
          </p>

          {/* (2) 전체 순위 */}
          {finishOrder.length > 0 && (
            <div className='mb-8'>
              <h2 className='text-3xl font-bold text-gray-800 mb-4'>
                전체 순위
              </h2>
              <div className='bg-gray-100 rounded-lg shadow-md p-4'>
                <ol className='divide-y divide-gray-300'>
                  {finishOrder.map((user, index) => (
                    <li
                      key={user}
                      className='py-2 flex justify-between items-center'
                    >
                      <span className='font-semibold text-gray-700'>
                        {index + 1}.
                      </span>
                      <span className='text-gray-900'>{user}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          <button
            onClick={handleResultCheck}
            className='w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition duration-300'
          >
            채팅방으로 돌아가기
          </button>
        </div>

        {/* (S) 경험치 모달 */}
        {showExpModal && myExpInfo && (
          <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50'>
            <div className='relative bg-white w-[350px] p-8 rounded-lg shadow-xl text-center'>
              <h2 className='text-2xl font-extrabold text-blue-700 mb-4'>
                경험치 획득!
              </h2>

              {/* ★ 내가 저장한 “myEarnedExp” 표시 */}
              <p className='text-lg text-gray-700 mb-2'>
                획득 경험치: <strong>+{myEarnedExp}</strong>
              </p>

              <p className='text-lg text-gray-700 mb-2'>
                현재 레벨: <strong>{myExpInfo.userLevel}</strong>
              </p>
              <p className='text-md text-gray-600'>
                경험치:{' '}
                <strong>
                  {myExpInfo.curExp} / {myExpInfo.expToNextLevel}
                </strong>
                &nbsp;({myExpInfo.expProgress}%)
              </p>

              <div className='mt-6'>
                <button
                  onClick={handleExpModalClose}
                  className='px-6 py-3 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors'
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}

        {/* (T) 레벨 업 모달 */}
        {showLevelUpModal && (
          <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50'>
            <div className='relative bg-white w-[350px] p-8 rounded-lg shadow-xl text-center'>
              <h2 className='text-3xl font-extrabold text-black mb-2 flex justify-center items-center'>
                🎉 <span className='mx-2'>레벨 업!</span> 🎉
              </h2>

              <p className='text-lg font-medium text-gray-700 mt-3'>
                레벨{' '}
                <span className='text-blue-500 font-bold'>
                  {myExpInfo?.userLevel}
                </span>{' '}
                달성!
              </p>

              <hr className='my-4 border-gray-300' />

              <p className='text-lg font-medium text-gray-600 mb-6'>
                티켓 +1
                {myTicket !== null && (
                  <span className='text-gray-700 ml-1'>
                    (현재 {myTicket}개)
                  </span>
                )}
              </p>

              <button
                onClick={handleLevelUpModalClose}
                className='px-6 py-3 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors'
              >
                확인
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -----------------------------
  // 게임 진행 중 화면
  // -----------------------------
  return (
    <div
      className='w-full h-screen bg-cover bg-center bg-no-repeat relative overflow-hidden'
      style={{ backgroundImage: "url('/chat_images/game_bg.gif')" }}
      ref={trackRef}
    >
      {/* 결승점 도착 모달 */}
      {!gameEnded && hasArrived && !modalDismissed && (
        <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-30'>
          <div className='bg-white p-8 rounded-lg shadow-lg text-center'>
            <h2 className='text-2xl font-bold mb-4'>결승점 도착!</h2>
            <p className='text-xl mb-4'>
              다른 물고기들이 도착할 때까지 기다려주세요!
            </p>
            <button
              onClick={() => setModalDismissed(true)}
              className='px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded'
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* Start 라인 */}
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

      {/* Goal 라인 */}
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

      {/* 상단 중앙에 남은 시간 */}
      {hasCountdownFinished && !gameEnded && (
        <div className='absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/80 px-4 py-2 rounded text-xl text-gray-800'>
          Time: {gameTime}s
        </div>
      )}

      {/* 레인 구분선 */}
      {trackDims.height > 0 && (
        <>
          <div
            className='absolute left-0 w-full border-t border-gray-300 pointer-events-none'
            style={{ top: `${laneAreaTopOffset}px`, zIndex: 2 }}
          />
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
          <div
            className='absolute left-0 w-full border-t border-gray-300 pointer-events-none'
            style={{
              top: `${laneAreaTopOffset + laneAreaHeight}px`,
              zIndex: 2,
            }}
          />
        </>
      )}

      {/* 물고기(플레이어) 렌더링 */}
      {players.map((player, index) => {
        // 총 6개 레인 중, 실제 플레이어 수에 맞춰 중앙 정렬
        const offset =
          players.length < totalLanes
            ? Math.floor((totalLanes - players.length) / 2)
            : 0;
        const laneIndex = index + offset;
        const fishSize = laneHeight * 0.8;
        const topPos =
          laneAreaTopOffset +
          laneIndex * laneHeight +
          (laneHeight - fishSize) / 2;

        const startOffset = trackDims.width ? trackDims.width * 0.1 : 95;
        const moveFactor = trackDims.width ? trackDims.width * 0.016 : 25;
        const leftPos =
          player.userName === userName && !hasStarted
            ? startOffset
            : startOffset + Math.floor(player.totalPressCount / 2) * moveFactor;

        return (
          <div
            key={player.userName}
            className='absolute'
            style={{ top: `${topPos}px`, left: `${leftPos}px`, zIndex: 10 }}
          >
            <div
              className='relative'
              style={{ width: `${fishSize}px`, height: `${fishSize}px` }}
            >
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
            {/* 텍스트의 top 값을 줄여서 물고기 바로 아래에 위치시킴 */}
            <span
              className='absolute text-xl font-medium text-gray-900'
              style={{
                top: `${fishSize - 16}px`,
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            >
              {player.userName}
            </span>
          </div>
        );
      })}

      {/* 하단 안내 */}
      <p className='absolute bottom-4 left-1/2 transform -translate-x-1/2 text-2xl text-gray-900'>
        Press the <span className='font-bold'>Spacebar</span> or touch anywhere to tap!
      </p>

      {/* 카운트다운 & 게임 설명 */}
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
              <img
                src='/chat_images/spacebar.png'
                alt='스페이스바'
                className='w-10 sm:w-12 md:w-14 lg:w-16 xl:w-20 h-auto mx-2 inline-block'
              />
              스페이스바 or 터치로 친구보다 먼저 Goal에 도착하세요!
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
