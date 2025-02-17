"use client";

import "@/lib/firebase"; // Firebase 초기화

import { AquariumData, Notification, UserInfo } from "@/types";
import axios, { AxiosResponse } from "axios";
import { increaseFishTicket, increaseUserExp } from "@/services/userService";
import { useEffect, useState } from "react";

import BottomMenuBar from "@/app/main/BottomMenuBar";
import CleanComponent from "@/app/main/CleanComponent";
import FirstLoginModal from "@/app/main/components/FirstLoginModal";
import Fish from "@/components/Fish";
import FishTicketModal from "@/components/FishTicketModal"; // 물고기 뽑기 모달
import FriendsList from "@/app/main/FriendsList";
import KickedModal from "@/app/main/components/KickedModal";
import LevelUpModal from "@/components/LevelUpModal"; // 레벨업 모달
import NotificationComponent from "@/components/NotificationComponent";
import OverlayEffect from "@/app/main/components/OverlayEffect";
import PushNotifications from "@/app/main/PushNotifications";
import axiosInstance from "@/services/axiosInstance";
import { useAuth } from "@/hooks/useAuth"; // 로그인 정보 가져오기
import { useRouter } from "next/navigation";
import { useSFX } from "@/hooks/useSFX";

// API_BASE_URL를 페이지 최상단에 전역으로 선언
const API_BASE_URL = "https://i12e203.p.ssafy.io/api/v1";

// 🔹 물고기 데이터 타입 정의
interface FishData {
  aquariumId: number;
  fishId: number;
  fishTypeId: number;
  fishName: string;
  fishImage: string;
  size: "XS" | "S" | "M" | "L" | "XL";
}

// 오버레이에 띄울 물고기 선택 모달
interface FishItem {
  fish: string;
  cnt: number;
}
interface FishOverlayModalProps {
  aquariumId: number;
  onConfirm: (selected: { fish: string; count: number }[]) => void;
  onClose: () => void;
}
function FishOverlayModal({ aquariumId, onConfirm, onClose }: FishOverlayModalProps) {
  const [fishList, setFishList] = useState<FishItem[]>([]);
  // 각 물고기별 선택 개수를 객체로 관리 (예: { Goldfish: 2, Angelfish: 1 })
  const [selectedCounts, setSelectedCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 어항 내 물고기 리스트 조회
    axios
      .get(`${API_BASE_URL}/aquariums/${aquariumId}`)
      .then((res: AxiosResponse<{ fishes: FishItem[] }>) => {
        const fishes = res.data.fishes || [];
        setFishList(fishes);
        // 초기 선택값은 0으로 설정
        const initCounts: Record<string, number> = {};
        fishes.forEach((item) => {
          initCounts[item.fish] = 0;
        });
        setSelectedCounts(initCounts);
      })
      .catch((err) => {
        console.error("물고기 리스트 조회 실패", err);
      })
      .finally(() => setLoading(false));
  }, [aquariumId]);

  // 전체 선택 개수 계산
  const totalSelected = Object.values(selectedCounts).reduce((a, b) => a + b, 0);

  const increment = (fishName: string, max: number) => {
    // 전체 선택이 5 이상이면 더 이상 증가 안함
    if (totalSelected >= 5) {
      alert("전체 최대 5마리까지 선택할 수 있습니다.");
      return;
    }
    setSelectedCounts((prev) => {
      const current = prev[fishName] || 0;
      if (current < max) {
        return { ...prev, [fishName]: current + 1 };
      }
      return prev;
    });
  };

  const decrement = (fishName: string) => {
    setSelectedCounts((prev) => {
      const current = prev[fishName] || 0;
      if (current > 0) {
        return { ...prev, [fishName]: current - 1 };
      }
      return prev;
    });
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div className="bg-white rounded-lg p-6 w-96" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">오버레이에 띄울 물고기 선택</h2>
        {loading ? (
          <div>로딩 중...</div>
        ) : (
          <div className="max-h-60 overflow-y-auto mb-4">
            {fishList.length === 0 ? (
              <div>선택 가능한 물고기가 없습니다.</div>
            ) : (
              fishList.map((item) => (
                <div key={item.fish} className="flex items-center justify-between mb-2">
                  <span>
                    {item.fish} (최대 {item.cnt}마리)
                  </span>
                  <div className="flex items-center">
                    <button
                      onClick={() => decrement(item.fish)}
                      className="px-2 py-1 bg-gray-300 rounded-l"
                    >
                      -
                    </button>
                    <span className="px-3">{selectedCounts[item.fish] || 0}</span>
                    <button
                      onClick={() => increment(item.fish, item.cnt)}
                      className="px-2 py-1 bg-gray-300 rounded-r"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        <div className="mb-2">
          <span>전체 선택: {totalSelected} / 5</span>
        </div>
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
            취소
          </button>
          <button
            onClick={() =>
              // 필터링: count > 0인 항목들만 전달
              onConfirm(
                Object.entries(selectedCounts)
                  .filter(([, count]) => count > 0)
                  .map(([fish, count]) => ({ fish, count }))
              )
            }
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MainPage() {
  const { auth } = useAuth();
  const router = useRouter();
  const [background, setBackground] = useState("/background-1.png");
  const [activeComponent, setActiveComponent] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [fishes, setFishes] = useState<FishData[]>([]);
  const [aquariumData, setAquariumData] = useState<AquariumData | null>(null);

  const [levelUpInfo, setLevelUpInfo] = useState<{ level: number; expProgress: number } | null>(null);
  const [firstLoginStatus, setFirstLoginStatus] = useState<boolean | null>(null);
  const [firstLoginModal, setFirstLoginModal] = useState<{ status: boolean } | null>(null);

  const { play: playPush } = useSFX("/sounds/알림-03.mp3");
  const { play: playLevelUp } = useSFX("/sounds/levelupRank.mp3");

  // 알림 처리 등...
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [newNotifications, setNewNotifications] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 모달 상태 관리
  const [showFishTicketModal, setShowFishTicketModal] = useState(false);

  // 오버레이 관련 상태
  const [overlayActive, setOverlayActive] = useState(false);
  const [showOverlayModal, setShowOverlayModal] = useState(false);

  // Electron 감지
  const isElectron =
    typeof navigator !== "undefined" &&
    navigator.userAgent.toLowerCase().includes("electron");

  // 오버레이 토글 함수: 오버레이가 활성화되어 있다면 끄고, 아니면 모달로 진행
  const handleToggleOverlay = async () => {
    if (!auth.user?.id) {
      console.warn("사용자 정보가 없습니다.");
      return;
    }
    if (overlayActive) {
      (window as any).electronAPI.toggleOverlay();
      setOverlayActive(false);
      return;
    }
    setShowOverlayModal(true);
  };

  const onOverlayModalConfirm = (selected: { fish: string; count: number }[]) => {
    const overlayParam = selected.map(item => `${item.fish}:${item.count}`).join(",");
    (window as any).electronAPI.toggleOverlay(overlayParam);
    setOverlayActive(true);
    setShowOverlayModal(false);
  };

  const onOverlayModalClose = () => {
    setShowOverlayModal(false);
  };

  // 기존 API 호출 및 정보 갱신 로직
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration: ServiceWorkerRegistration) => {
          console.log("✅ 서비스 워커 등록 완료:", registration);
        })
        .catch((err: unknown) => console.error("🔥 서비스 워커 등록 실패:", err));
    }
    const fetchIsFirstLogin = async () => {
      if (!auth.user) return;
      try {
        const response = await axios.get<boolean>(`${API_BASE_URL}/users/isFirst/${auth.user.id}`);
        console.log("첫 로그인 여부:", response.data);
        setFirstLoginStatus(response.data);
      } catch (error) {
        console.error("API 호출 중 오류 발생:", error);
      }
    };
    fetchIsFirstLogin();
  }, []);

  useEffect(() => {
    if (firstLoginStatus) {
      setFirstLoginModal({ status: true });
    }
  }, [firstLoginStatus]);

  useEffect(() => {
    if (levelUpInfo) {
      console.log("레벨업 정보 변경:", levelUpInfo);
    }
  }, [levelUpInfo]);

  const refreshAquariumData = async () => {
    if (!userInfo?.mainAquarium) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/aquariums/${userInfo.mainAquarium}`);
      console.log("어항 상태 갱신:", response.data);
      setAquariumData(response.data);
    } catch (error) {
      console.error("어항 상태 불러오기 실패", error);
    }
  };

  const hungrySounds = [
    "/sounds/hungry_1.mp3",
    "/sounds/hungry_2.mp3",
    "/sounds/hungry_3.mp3",
    "/sounds/hungry_4.mp3",
  ];
  const { play, setSrc } = useSFX(hungrySounds[0]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    const playRandomHungrySound = () => {
      if (!aquariumData || aquariumData.feedStatus > 3) return;
      const randomSound = hungrySounds[Math.floor(Math.random() * hungrySounds.length)];
      setSrc(randomSound);
      console.log("꼬르륵");
      play();
      let minDelay, maxDelay;
      switch (aquariumData.feedStatus) {
        case 3:
          minDelay = 40000;
          maxDelay = 60000;
          break;
        case 2:
          minDelay = 30000;
          maxDelay = 50000;
          break;
        case 1:
          minDelay = 20000;
          maxDelay = 40000;
          break;
        case 0:
          minDelay = 10000;
          maxDelay = 30000;
          break;
        default:
          return;
      }
      const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay) + minDelay);
      timeoutId = setTimeout(playRandomHungrySound, randomDelay);
    };
    if (aquariumData && aquariumData.feedStatus <= 3) {
      playRandomHungrySound();
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [aquariumData]);

  const handleIncreaseExp = async (earnedExp: number) => {
    if (!auth.user?.id) return;
    const prevLevel = userInfo?.level ?? 1;
    const updatedExpData = await increaseUserExp(auth.user.id, earnedExp);
    if (updatedExpData) {
      console.log("경험치 증가 API 응답:", updatedExpData);
      if (updatedExpData.userLevel > prevLevel) {
        console.log("레벨업 발생! 새로운 레벨:", updatedExpData.userLevel);
        setLevelUpInfo({
          level: updatedExpData.userLevel,
          expProgress: updatedExpData.expProgress,
        });
        playLevelUp();
        const updatedFishTicket = await increaseFishTicket(auth.user.id);
        if (updatedFishTicket !== null) {
          setUserInfo((prev) => ({ ...prev!, fishTicket: updatedFishTicket }));
        }
      }
      await refreshUserInfo();
    }
  };

  const refreshUserInfo = async () => {
    if (!auth.user?.id) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${auth.user.id}`);
      console.log("유저 정보 갱신 완료:", response.data);
      setUserInfo(response.data);
    } catch (error) {
      console.error("유저 정보 불러오기 실패", error);
    }
  };

  useEffect(() => {
    if (!auth.user?.id) return;
    axios
      .get(`${API_BASE_URL}/users/${auth.user.id}`)
      .then((response: AxiosResponse<UserInfo>) => {
        console.log("유저 정보:", response.data);
        setUserInfo(response.data);
      })
      .catch((error) => console.error("유저 정보 불러오기 실패", error));
  }, [auth.user?.id]);

  useEffect(() => {
    if (!auth.user?.id || userInfo?.mainAquarium === undefined) return;
    axiosInstance
      .get(`aquariums/fish/${userInfo.mainAquarium}`, { withCredentials: true })
      .then((response: AxiosResponse<FishData[] | { message: string }>) => {
        console.log("내 물고기 목록:", response.data);
        if (Array.isArray(response.data)) {
          setFishes(response.data);
        } else {
          console.warn("물고기 데이터가 없습니다.");
          setFishes([]);
        }
      })
      .catch((error) => console.error("물고기 데이터 불러오기 실패", error));
  }, [auth.user?.id, userInfo?.mainAquarium]);

  useEffect(() => {
    if (!userInfo?.mainAquarium) return;
    console.log("메인 아쿠아리움 ID:", userInfo.mainAquarium);
    axios
      .get(`${API_BASE_URL}/aquariums/${userInfo.mainAquarium}`)
      .then((res: AxiosResponse<AquariumData>) => {
        console.log("어항 상세 정보:", res.data);
        setAquariumData(res.data);
        const BACKGROUND_BASE_URL = "https://i12e203.p.ssafy.io/images";
        const savedBg = BACKGROUND_BASE_URL + res.data.aquariumBackground;
        if (savedBg) {
          setBackground(savedBg);
        }
      })
      .catch((err) => console.error("어항 정보 불러오기 실패", err));
  }, [userInfo]);

  useEffect(() => {
    const checkUnreadNotifications = async () => {
      if (!auth.user?.id) return;
      axios
        .get(`${API_BASE_URL}/notification/${auth.user.id}`)
        .then((response: AxiosResponse<Notification[]>) => {
          console.log("알림 데이터:", response.data);
          setNotifications(response.data);
          const unreadNotifications = response.data.filter((notif) => notif.status === false);
          setNewNotifications(unreadNotifications.length > 0);
        })
        .catch((error) => {
          console.error("알림 불러오기 실패", error);
          setError("알림을 불러오는데 실패했습니다.");
        })
        .finally(() => setLoading(false));
    };
    checkUnreadNotifications();
  }, [auth.user?.id]);

  useEffect(() => {
    if (newNotifications) {
      playPush();
    }
  }, [newNotifications]);

  if (!userInfo)
    return (
      <div className="absolute inset-0 bg-cover bg-center w-full h-full text-white text-xl flex flex-col items-center justify-center before:absolute before:inset-0 before:bg-white/30 bg-[url(/background-1.png)]">
        로딩 중...
      </div>
    );
  if (!aquariumData)
    return (
      <div className="absolute inset-0 bg-cover bg-center w-full h-full text-white text-xl flex flex-col items-center justify-center before:absolute before:inset-0 before:bg-white/30 bg-[url(/background-1.png)]">
        아쿠아리움 정보 로딩 중...
      </div>
    );

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <title>AQoO</title>
      <KickedModal />
      <div
        className="absolute inset-0 bg-cover bg-center w-full h-full"
        style={{ backgroundImage: `url(${background})` }}
      ></div>
      <OverlayEffect aquariumData={aquariumData} />
      {fishes.map((fish) => (
        <Fish key={fish.fishId} fish={fish} />
      ))}
      {/* BottomMenuBar에 오버레이 토글 함수 전달 */}
      <BottomMenuBar
        setActiveComponent={setActiveComponent}
        activeComponent={activeComponent}
        userInfo={userInfo}
        aquariumData={aquariumData}
        refreshAquariumData={refreshAquariumData}
        onOpenFishModal={() => setShowFishTicketModal(true)}
        handleIncreaseExp={handleIncreaseExp}
        newNotifications={newNotifications}
        handleToggleOverlay={handleToggleOverlay}
      />
      {/* 추가 컴포넌트들 */}
      {activeComponent === "clean" && (
        <div className="absolute bottom-[130px] right-[100px] z-50">
          <CleanComponent
            onClose={() => setActiveComponent(null)}
            onCleanSuccess={refreshAquariumData}
            handleIncreaseExp={handleIncreaseExp}
            aquariumId={userInfo.mainAquarium}
          />
        </div>
      )}
      {activeComponent === "friends" && (
        <div className="absolute bottom-[130px] left-[100px] z-50">
          <FriendsList onClose={() => setActiveComponent(null)} userId={userInfo.id} />
        </div>
      )}
      {activeComponent === "push" && (
        <div className="absolute bottom-[130px] left-[100px] z-50">
          <PushNotifications onClose={() => setActiveComponent(null)} setNewNotifications={setNewNotifications} />
        </div>
      )}
      <NotificationComponent refreshAquariumData={refreshAquariumData} setNewNotifications={setNewNotifications} />
      {levelUpInfo && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <LevelUpModal
            level={levelUpInfo.level}
            onClose={() => setLevelUpInfo(null)}
            onOpenFishModal={() => setShowFishTicketModal(true)}
          />
        </div>
      )}
      {firstLoginStatus && firstLoginModal && (
        <FirstLoginModal
          onClose={() => setFirstLoginModal(null)}
          onOpenFishModal={() => {
            setFirstLoginModal(null);
            setShowFishTicketModal(true);
          }}
        />
      )}
      {showFishTicketModal && userInfo && (
        <FishTicketModal
          level={userInfo.level}
          fishTicket={userInfo.fishTicket}
          refreshUserInfo={refreshUserInfo}
          onClose={() => setShowFishTicketModal(false)}
          isFirstLogin={firstLoginStatus ?? false}
        />
      )}
      {/* 오버레이 물고기 선택 모달 */}
      {showOverlayModal && userInfo && (
        <FishOverlayModal
          aquariumId={userInfo.mainAquarium}
          onConfirm={onOverlayModalConfirm}
          onClose={onOverlayModalClose}
        />
      )}
    </div>
  );
}
