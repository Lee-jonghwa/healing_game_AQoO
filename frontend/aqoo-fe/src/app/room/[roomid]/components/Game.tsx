"use client";

import { getStompClient } from "@/lib/stompclient";
import axiosInstance from "@/services/axiosInstance";
import { User } from "@/store/authAtom";
import { useCallback, useEffect, useRef, useState } from "react";

import { useSFX } from "@/hooks/useSFX";


interface GameProps {
  roomId: string;
  // 이제 userName은 실제로 사용자의 nickname을 의미합니다.
  userName: string;
  initialPlayers: Player[];
  onResultConfirmed: () => void;
  user: User; // 로그인한 사용자의 정보 (레벨, 닉네임 등)
}

interface Player {
  userName: string;
  mainFishImage: string;
  totalPressCount: number;
  nickname: string;
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
  fishTicket: number;
}

function getExpByRank(rank: number): number {
  if (rank === 1) return 20;
  if (rank === 2) return 10;
  if (rank === 3) return 5;
  return 3;
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
  const [myEarnedExp, setMyEarnedExp] = useState<number>(0);

  // 4) 게임 진행 상태
  const [countdown, setCountdown] = useState(3);
  const [hasCountdownFinished, setHasCountdownFinished] = useState(false);
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [finishOrder, setFinishOrder] = useState<string[]>([]);

  // <-- finishOrder snapshot 추가 (요구사항 수정)
  // finishOrder 스냅샷 시 userName이 아닌 매칭되는 nickname을 저장합니다.
  const [finishOrderSnapshot, setFinishOrderSnapshot] = useState<string[]>([]);
  useEffect(() => {
    if (
      gameEnded &&
      finishOrder.length > 0 &&
      finishOrderSnapshot.length === 0
    ) {
      const snapshot = finishOrder.map((user) => {
        const player = players.find((p) => p.userName === user);
        return player ? player.nickname : user;
      });
      setFinishOrderSnapshot(snapshot);
    }
  }, [gameEnded, finishOrder, finishOrderSnapshot, players]);
  // ------------------------------

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

  // 7)  효과음
  const { play: pushSpacebar } = useSFX("/sounds/clickeffect-03.mp3"); // 스페이스바 누를때
  const { play: earnedExp } = useSFX("/sounds/짜잔.mp3"); // 게임 끝나고 경험치 얻을 때
  const { play: levelUp } = useSFX("/sounds/levelupRank.mp3"); // 레벨업할때

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
    window.addEventListener("resize", updateDims);
    return () => window.removeEventListener("resize", updateDims);
  }, []);

  // STOMP 전송 함수
  const publishMessage = (destination: string, message: object) => {
    const client = getStompClient();
    if (client && client.connected) {
      client.publish({
        destination,
        body: JSON.stringify(message),
      });
    }
  };

  // 카운트다운
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
    setHasCountdownFinished(true);
  }, [countdown]);

  // 기존 카운트다운 useEffect 아래에 추가:
  useEffect(() => {
    if (hasCountdownFinished) {
      const client = getStompClient();
      if (client && client.connected) {
        client.publish({
          destination: "/app/chat.clearReady",
          body: JSON.stringify({ roomId, sender: userName }),
        });
      }
    }
  }, [hasCountdownFinished, roomId, userName]);

  // 탭 이벤트 처리 (스페이스바 or 터치)
  const handleTap = useCallback(() => {
    pushSpacebar();
    if (!hasCountdownFinished || gameEnded) return;
    const me = players.find((p) => p.userName === userName);
    if (me && me.totalPressCount >= 100) return;
    if (!hasStarted) {
      setHasStarted(true);
    }
    setIsTapping(true);
    setTimeout(() => setIsTapping(false), 300);

    // nickname 필드로 전송 (fallback 로직 제거)
    publishMessage("/app/game.press", {
      roomId,
      userName,
      pressCount: 1,
    });
  }, [hasCountdownFinished, gameEnded, players, userName, hasStarted, roomId]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      e.preventDefault();
      handleTap();
    },
    [handleTap]
  );

  // 데스크탑과 모바일 모두를 위해 터치 이벤트 리스너 추가
  useEffect(() => {
    if (hasCountdownFinished) {
      window.addEventListener("keyup", handleKeyPress);
      window.addEventListener("touchend", handleTap);
      return () => {
        window.removeEventListener("keyup", handleKeyPress);
        window.removeEventListener("touchend", handleTap);
      };
    }
  }, [hasCountdownFinished, handleKeyPress, handleTap]);

  // STOMP 구독
  useEffect(() => {
    const client = getStompClient();
    if (client) {
      const sub = client.subscribe(`/topic/room/${roomId}`, (message) => {
        const data: RoomResponse = JSON.parse(message.body);
        setPlayers(data.players ?? []);
        if (data.message === "GAME_ENDED") {
          setGameEnded(true);
          setWinner(data.winner || null);
          if (data.finishOrder) {
            setFinishOrder(data.finishOrder);
          }
        }
      });
      return () => sub.unsubscribe();
    }
  }, [roomId]);

  // wind effect 처리
  useEffect(() => {
    players.forEach((player) => {
      if (player.nickname !== userName) {
        const prevPlayer = previousPlayersRef.current.find(
          (p) => p.nickname === player.nickname
        );
        if (
          !prevPlayer ||
          player.totalPressCount > prevPlayer.totalPressCount
        ) {
          setWindEffects((prev) => ({ ...prev, [player.nickname]: true }));
          setTimeout(() => {
            setWindEffects((prev) => ({ ...prev, [player.nickname]: false }));
          }, 300);
        }
      }
    });
    previousPlayersRef.current = players;
  }, [players, userName]);

  // 게임 타이머
  useEffect(() => {
    if (!hasStarted || gameEnded) return;
    const timer = setInterval(() => {
      setGameTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [hasStarted, gameEnded]);

  // 게임 종료 조건 체크
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
      setWinner(maxPlayer?.nickname || null);
      publishMessage("/app/game.end", { roomId });
    }
  }, [gameTime, players, hasStarted, gameEnded]);

  // countdown 끝났는데 아직 시작되지 않은 경우 강제 탭
  useEffect(() => {
    if (hasCountdownFinished && !hasStarted) {
      setTimeout(() => {
        window.dispatchEvent(new KeyboardEvent("keyup", { code: "Space" }));
      }, 0);
    }
  }, [hasCountdownFinished, hasStarted]);

  // 게임 종료 시 exp-up 처리
  useEffect(() => {
    if (!gameEnded || finishOrder.length === 0) return;
    const rank = finishOrder.indexOf(userName) + 1;
    if (rank <= 0) {
      return;
    }
    const earnedExp = getExpByRank(rank);
    setMyEarnedExp(earnedExp);
    (async () => {
      try {
        const response = await axiosInstance.post("/users/exp-up", {
          userId: userName,
          earnedExp,
        });
        setMyExpInfo(response.data);
      } catch (err) {
        console.error("경험치 지급 에러:", err);
      }
    })();
  }, [gameEnded, finishOrder, userName]);

  // 현재 유저 도착 체크
  const me = players.find((p) => p.userName === userName);
  const hasArrived = me ? me.totalPressCount >= 100 : false;

  const handleResultCheck = () => onResultConfirmed();
  const handleModalClose = () => setModalDismissed(true);

  useEffect(() => {
    if (myExpInfo) {
      setShowExpModal(true);
      earnedExp();
    }
  }, [myExpInfo]);

  const handleExpModalClose = () => {
    setShowExpModal(false);
    if (!myExpInfo) return;
    if (myExpInfo.userLevel > prevLevel) {
      levelUp();
      setShowLevelUpModal(true);
      (async () => {
        try {
          const ticketRes = await axiosInstance.get(`/fish/ticket/${userName}`);
          const ticketData: TicketResponse = ticketRes.data;
          setMyTicket(ticketData.fishTicket);
        } catch (err) {
          console.error("티켓 증가 에러:", err);
        }
      })();
    }
  };

  const handleLevelUpModalClose = () => {
    setShowLevelUpModal(false);
  };

  if (gameEnded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br">
        <div className="bg-white/80 shadow-xl rounded-2xl p-10 text-center max-w-md w-full mx-4">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-6">
            Game Over
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Winner:{" "}
            <span className="font-bold text-gray-900">
              {winner || "No Winner"}
            </span>
          </p>
          {finishOrderSnapshot.length > 0 && (
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                전체 순위
              </h2>
              <div className="bg-gray-100 rounded-lg shadow-md p-4">
                <ol className="divide-y divide-gray-300">
                  {finishOrderSnapshot.map((nickname, index) => (
                    <li
                      key={nickname}
                      className="py-2 flex justify-between items-center"
                    >
                      <span className="font-semibold text-gray-700">
                        {index + 1}.
                      </span>
                      <span className="text-gray-900">{nickname}</span>
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

        {showExpModal && myExpInfo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
            <div className="relative bg-white w-[350px] p-8 rounded-lg shadow-xl text-center">
              <h2 className="text-2xl font-extrabold text-blue-700 mb-4">
                경험치 획득!
              </h2>
              <p className="text-lg text-gray-700 mb-2">
                획득 경험치: <strong>+{myEarnedExp}</strong>
              </p>
              <p className="text-lg text-gray-700 mb-2">
                현재 레벨: <strong>{myExpInfo.userLevel}</strong>
              </p>
              <p className="text-md text-gray-600">
                경험치:{" "}
                <strong>
                  {myExpInfo.curExp} / {myExpInfo.expToNextLevel}
                </strong>
                &nbsp;({myExpInfo.expProgress}%)
              </p>
              <div className="mt-6">
                <button
                  onClick={handleExpModalClose}
                  className="px-6 py-3 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}

        {showLevelUpModal && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
            <div className="relative bg-white w-[350px] p-8 rounded-lg shadow-xl text-center">
              <h2 className="text-3xl font-extrabold text-black mb-2 flex justify-center items-center">
                🎉 <span className="mx-2">레벨 업!</span> 🎉
              </h2>
              <p className="text-lg font-medium text-gray-700 mt-3">
                레벨{" "}
                <span className="text-blue-500 font-bold">
                  {myExpInfo?.userLevel}
                </span>{" "}
                달성!
              </p>
              <hr className="my-4 border-gray-300" />
              <p className="text-lg font-medium text-gray-600 mb-6">
                티켓 +3
                {myTicket !== null && (
                  <span className="text-gray-700 ml-1">
                    (현재 {myTicket}개)
                  </span>
                )}
              </p>
              <button
                onClick={handleLevelUpModalClose}
                className="px-6 py-3 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="w-full h-screen bg-cover bg-center bg-no-repeat relative overflow-hidden"
      style={{ backgroundImage: "url('/chat_images/game_bg.gif')" }}
      ref={trackRef}
    >
      {!gameEnded && hasArrived && !modalDismissed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-30">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">결승점 도착!</h2>
            <p className="text-xl mb-4">
              다른 물고기들이 도착할 때까지 기다려주세요!
            </p>
            <button
              onClick={() => setModalDismissed(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded"
            >
              확인
            </button>
          </div>
        </div>
      )}

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
            </span>``
          </div>
        </div>
      )}

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

      {hasCountdownFinished && !gameEnded && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/80 px-4 py-2 rounded text-xl text-gray-800">
          Time: {gameTime}s
        </div>
      )}

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
            style={{
              top: `${laneAreaTopOffset + laneAreaHeight}px`,
              zIndex: 2,
            }}
          />
        </>
      )}

      {players.map((player, index) => {
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
          player.nickname === userName && !hasStarted
            ? startOffset
            : startOffset + Math.floor(player.totalPressCount / 2) * moveFactor;

        return (
          <div
            key={player.nickname}
            className="absolute"
            style={{ top: `${topPos}px`, left: `${leftPos}px`, zIndex: 10 }}
          >
            <div
              className="relative"
              style={{ width: `${fishSize}px`, height: `${fishSize}px` }}
            >
              <img
                src={player.mainFishImage}
                alt={`${player.nickname}의 대표 물고기`}
                style={{ width: fishSize, height: fishSize }}
                className="object-contain scale-x-[-1]"
              />
              {(player.nickname === userName
                ? isTapping
                : windEffects[player.nickname]) && (
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
            <span
              className="absolute text-xl font-medium text-gray-900 whitespace-nowrap"
              style={{
                top: `${fishSize - 16}px`,
                left: "50%",
                transform: "translateX(-50%)",
              }}
            >
              {player.nickname}
            </span>
          </div>
        );
      })}

      <p className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-2xl text-gray-900">
        Press the <span className="font-bold">Spacebar</span> to tap!
      </p>

      {!hasCountdownFinished && (
        <div className="absolute inset-0 flex flex-col justify-center items-center bg-white/80 z-20 p-4">
          <div className="max-w-6xl w-full text-center bg-white/90 border-2 border-gray-600 rounded-lg shadow-lg p-6">
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
              <img
                src="/chat_images/spacebar.png"
                alt="스페이스바"
                className="w-10 sm:w-12 md:w-14 lg:w-16 xl:w-20 h-auto mx-2 inline-block"
              />
              스페이스바로 친구보다 먼저 Goal에 도착하세요!
            </p>
            <p className="mt-8 text-2xl text-gray-800">
              {countdown} 초 후 게임 시작
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
