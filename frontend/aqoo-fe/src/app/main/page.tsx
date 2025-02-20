"use client";

import "@/lib/firebase"; // Firebase 초기화

import { AquariumData, AquariumListItem, Notification, UserInfo } from "@/types";
import axios, { AxiosResponse } from "axios";
import { increaseFishTicket, increaseUserExp } from "@/services/userService";
import { useEffect, useState } from "react";

import BottomMenuBar from "@/app/main/BottomMenuBar";
import FirstLoginModal from "@/app/main/components/FirstLoginModal";
import Fish from "@/components/Fish";
import FishTicketModal from "@/components/FishTicketModal"; // 물고기 뽑기 모달
import KickedModal from "@/app/main/components/KickedModal";
import LevelUpModal from "@/components/LevelUpModal"; // 레벨업 모달
import NotificationComponent from "@/components/NotificationComponent";
import OverlayEffect from "@/app/main/components/OverlayEffect";
import axiosInstance from "@/services/axiosInstance";
import { useAuth } from "@/hooks/useAuth"; // 로그인 정보 가져오기
import { useRouter } from "next/navigation";
import { useSFX } from "@/hooks/useSFX";
import { useToast } from "@/hooks/useToast";

// 🔹 물고기 데이터 타입 정의 (기존 API 응답 구조)
interface FishData {
  aquariumId: number;
  fishId: number;
  fishTypeId: number;
  fishName: string;
  fishImage: string;
  size: "XS" | "S" | "M" | "L" | "XL";
}

// 그룹화된 물고기 데이터 타입 (동일 fishName끼리 그룹화)
interface GroupedFish {
  fish: string;
  count: number; // 그룹 내 전체 개수
  fishImage: string; // 실제 이미지 URL (혹은 fishName 기반)
  size: string;
}

// 오버레이에 띄울 물고기 선택 모달 (그룹화된 데이터를 사용)
interface FishOverlayModalProps {
  fishList: FishData[];
  transparency: number;
  setTransparency: (val: number) => void;
  onConfirm: (selected: { fishImage: string; size: string; count: number }[]) => void;
  onClose: () => void;
}

// 일렉트론 전용 모달 내 투명도 조절 슬라이더더
function TransparencySlider({
  transparency,
  setTransparency,
}: {
  transparency: number;
  setTransparency: (val: number) => void;
}) {
  // 직접 입력 핸들러 (0~100 사이로 clamp)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) value = 0;
    if (value < 0) value = 0;
    if (value > 100) value = 100;
    setTransparency(value);
  };

  return (
    <div className="mt-4 mb-6">
      <label htmlFor="transparencySlider" className="block mb-1">
        투명도 (0: 완전 투명, 100: 불투명)
      </label>
      <div className="flex items-center space-x-2">
        <input
          id="transparencySlider"
          type="range"
          min="0"
          max="100"
          step="1"
          value={transparency}
          onChange={(e) => setTransparency(parseInt(e.target.value, 10))}
          className="w-full"
        />
        <input
          type="number"
          min="0"
          max="100"
          step="1"
          value={transparency}
          onChange={handleInputChange}
          className="w-20 border border-gray-300 rounded p-1 text-center"
        />
      </div>
    </div>
  );
}

function FishOverlayModal({ fishList, transparency, setTransparency, onConfirm, onClose }: FishOverlayModalProps) {
  const [groupedFish, setGroupedFish] = useState<GroupedFish[]>([]);
  const [selectedCounts, setSelectedCounts] = useState<Record<string, number>>({});
  const { showToast } = useToast();

  // 전달받은 fishList 데이터를 fishName 기준으로 그룹화
  useEffect(() => {
    const groups: Record<string, GroupedFish> = {};
    fishList.forEach((item) => {
      if (groups[item.fishName]) {
        groups[item.fishName].count += 1;
      } else {
        groups[item.fishName] = {
          fish: item.fishName,
          count: 1,
          fishImage: item.fishImage,
          size: item.size,
        };
      }
    });
    const groupsArray = Object.values(groups);
    setGroupedFish(groupsArray);

    // 초기 선택값 0으로 설정
    const initCounts: Record<string, number> = {};
    groupsArray.forEach((group) => {
      initCounts[group.fish] = 0;
    });
    setSelectedCounts(initCounts);
  }, [fishList]);

  // 전체 선택 개수 계산
  const totalSelected = Object.values(selectedCounts).reduce((a, b) => a + b, 0);

  const increment = (fish: string, max: number) => {
    if (totalSelected >= 5) {
      showToast("최대 5마리까지 선택할 수 있습니다.", "warning");
      return;
    }
    setSelectedCounts((prev) => {
      const current = prev[fish] || 0;
      if (current < max) {
        return { ...prev, [fish]: current + 1 };
      }
      return prev;
    });
  };

  const decrement = (fish: string) => {
    setSelectedCounts((prev) => {
      const current = prev[fish] || 0;
      if (current > 0) {
        return { ...prev, [fish]: current - 1 };
      }
      return prev;
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-96" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">항상 화면에서 함께 하고픈 물고기를 골라주세요!</h2>
        <div className="max-h-60 overflow-y-auto mb-4 custom-scrollbar">
          {groupedFish.length === 0 ? (
            <div>선택 가능한 물고기가 없습니다.</div>
          ) : (
            groupedFish.map((group) => (
              <div
                key={group.fish}
                className="flex items-center justify-between mb-2 p-2 rounded-lg transition duration-200 hover:bg-gray-100"
              >
                <div className="flex items-center space-x-2">
                  <img src={group.fishImage} alt={group.fish} className="w-8 h-8 object-cover rounded-full" />
                  <span>
                    {group.fish} (최대 {group.count}마리)
                  </span>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => decrement(group.fish)}
                    className="px-2 py-1 bg-gray-300 rounded-l transition duration-200 hover:bg-gray-400"
                  >
                    -
                  </button>
                  <span className="px-3">{selectedCounts[group.fish] || 0}</span>
                  <button
                    onClick={() => increment(group.fish, group.count)}
                    className="px-2 py-1 bg-gray-300 rounded-r transition duration-200 hover:bg-gray-400"
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mb-2">
          <span>전체 선택: {totalSelected} / 5</span>
        </div>

        {/* 투명도 설정 슬라이더 추가 */}
        <TransparencySlider transparency={transparency} setTransparency={setTransparency} />

        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded transition duration-200 hover:bg-gray-400">
            취소
          </button>
          <button
            onClick={() => {
              const selectedArray = Object.entries(selectedCounts)
                .filter(([, count]) => count > 0)
                .map(([fish, count]) => {
                  const group = groupedFish.find((g) => g.fish === fish);
                  return group
                    ? { fishImage: group.fishImage, size: group.size, count }
                    : { fishImage: "", size: "", count };
                });
              if (selectedArray.length === 0) {
                showToast("물고기를 한 마리 이상 선택해주세요.", "warning");
                return;
              }
              onConfirm(selectedArray);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded transition duration-200 hover:bg-blue-700"
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
  const [manualSelected, setManualSelected] = useState(false);

  const [aquariumList, setAquariumList] = useState<AquariumListItem[]>([]);
  const [selectedAquariumId, setSelectedAquariumId] = useState<number | null>(null);

  const [viewportHeight, setViewportHeight] = useState("100vh");
  const [transparency, setTransparency] = useState(1); // 투명도 상태 선언

  useEffect(() => {
    const updateHeight = () => {
      setViewportHeight(`${window.innerHeight}px`);
    };

    updateHeight(); // 초기 적용
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const [levelUpInfo, setLevelUpInfo] = useState<{
    level: number;
    expProgress: number;
  } | null>(null);
  const [firstLoginStatus, setFirstLoginStatus] = useState<boolean | null>(null);
  const [firstLoginModal, setFirstLoginModal] = useState<{
    status: boolean;
  } | null>(null);

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
  const isElectron = typeof navigator !== "undefined" && navigator.userAgent.toLowerCase().includes("electron");

  // 오버레이 토글 함수: 활성화 상태면 끄고, 아니면 모달로 진행
  const handleToggleOverlay = async () => {
    if (!auth.user?.id) {
      console.warn("사용자 정보가 없습니다.");
      return;
    }
    if (overlayActive) {
      (window as any).electronAPI.toggleOverlay();
      setOverlayActive(false);
    } else {
      setShowOverlayModal(true);
    }
  };

  const onOverlayModalConfirm = (selected: { fishImage: string; size: string; count: number }[]) => {
    // 각 항목을 "fishImage:size:count" 형식으로 변환하고, 이를 콤마로 연결한 후 "|" 구분자로 투명도 값을 추가
    const overlayParam =
      selected.map((item) => `${item.fishImage}:${item.size}:${item.count}`).join(",") + "|" + transparency;
    (window as any).electronAPI.toggleOverlay(overlayParam);
    setOverlayActive(true);
    setShowOverlayModal(false);
  };

  const onOverlayModalClose = () => {
    setShowOverlayModal(false);
  };

  // []
  useEffect(() => {
    // 웹 푸시용 서비스 워커 등록
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration: ServiceWorkerRegistration) => {})
        .catch((err: unknown) => console.error("🔥 서비스 워커 등록 실패:", err));
    }

    // 첫 로그인 여부 확인용 메소드 -> 모달 set
    const fetchIsFirstLogin = async () => {
      if (!auth.user) return;
      try {
        const response = await axiosInstance.get<boolean>(`/users/isFirst/${auth.user.id}`);
        setFirstLoginStatus(response.data);
      } catch (error) {
        console.error("API 호출 중 오류 발생:", error);
      }
    };

    fetchIsFirstLogin();
  }, []);

  // 첫 로그인자에게 모달 띄워주기 (동작하는지 체크 후 삭제)
  useEffect(() => {
    if (firstLoginStatus) {
      setFirstLoginModal({ status: true });
    }
  }, [firstLoginStatus]);

  // 페이지에서 정의했던 함수
  const refreshAquariumData = async () => {
    if (!selectedAquariumId) return; // ✅ selectedAquariumId가 없다면 return
    try {
      const response = await axiosInstance.get(`/aquariums/${selectedAquariumId}`); // ✅ 여기서도 selectedAquariumId 사용
      setAquariumData(response.data);
    } catch (error) {
      console.error("어항 상태 불러오기 실패", error);
    }
  };

  // 배고픔 상태에 따른 효과음 처리리
  const hungrySounds = ["/sounds/hungry_1.mp3", "/sounds/hungry_2.mp3", "/sounds/hungry_3.mp3", "/sounds/hungry_4.mp3"];
  const { play, setSrc } = useSFX(hungrySounds[0]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    const playRandomHungrySound = () => {
      if (!aquariumData || aquariumData.feedStatus > 3) return;
      const randomSound = hungrySounds[Math.floor(Math.random() * hungrySounds.length)];
      setSrc(randomSound);
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

  // 경험치 증가 및 레벨 업 메소드
  const handleIncreaseExp = async (earnedExp: number) => {
    if (!auth.user?.id) return;

    const prevLevel = userInfo?.level ?? 1; // 이전 레벨 기록
    const updatedExpData = await increaseUserExp(auth.user.id, earnedExp);

    if (updatedExpData) {
      if (updatedExpData.userLevel > prevLevel) {
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

  // 사용자 정보 갱신 메소드 (경험치, level 등)
  const refreshUserInfo = async () => {
    if (!auth.user?.id) return;
    try {
      const response = await axiosInstance.get(`/users/${auth.user.id}`);
      setUserInfo(response.data);
    } catch (error) {}
  };

  // 유저 정보
  useEffect(() => {
    if (!auth.user?.id) return;
    refreshUserInfo();
  }, [auth.user?.id]);

  // ② 어항 리스트 조회 (유저 정보와 auth.user.id가 준비되면)
  useEffect(() => {
    if (!auth.user?.id) return;

    Promise.all([
      axiosInstance.get(`/users/${auth.user.id}`),
      axiosInstance.get(`/aquariums/all/${auth.user.id}`),
    ]).then(([userRes, aqRes]) => {
      const newUserInfo = userRes.data;
      const newAquariums = aqRes.data.aquariums;
      setUserInfo(newUserInfo);
      setAquariumList(newAquariums);

      // 만약 selectedAquariumId가 아직 null이면, mainAquarium (또는 0번)을 기본값으로
      if (selectedAquariumId === null) {
        const defaultId = newUserInfo.mainAquarium ?? newAquariums[0]?.id ?? null;
        setSelectedAquariumId(defaultId);
      }
    });
  }, [auth.user?.id]);

  // 최종 형태 (단 하나의 effect만 존재)
  useEffect(() => {
    if (!userInfo?.mainAquarium) return;
    if (aquariumList.length === 0) return;

    const exists = aquariumList.some((aq) => aq.id === userInfo.mainAquarium);
    if (exists && !manualSelected) {
      setSelectedAquariumId(userInfo.mainAquarium);
    }
  }, [userInfo?.mainAquarium, aquariumList, manualSelected]);

  // ④ 선택된 어항 ID로 물고기 리스트 조회
  useEffect(() => {
    if (!selectedAquariumId) return;
    axiosInstance
      .get(`/aquariums/fish/${selectedAquariumId}`, { withCredentials: true })
      .then((response: AxiosResponse<FishData[] | { message: string }>) => {
        if (Array.isArray(response.data)) {
          setFishes(response.data);
        } else {
          setFishes([]);
        }
      })
      .catch((error) => console.error("물고기 데이터 불러오기 실패", error));
  }, [selectedAquariumId, auth.user?.id]);

  // ③ 선택된 어항 ID로 어항 상세 정보 조회
  useEffect(() => {
    if (!selectedAquariumId) return;
    axiosInstance
      .get(`/aquariums/${selectedAquariumId}`)
      .then((res: AxiosResponse<AquariumData>) => {
        setAquariumData(res.data);
        const BACKGROUND_BASE_URL = "https://i12e203.p.ssafy.io/images";
        setBackground(BACKGROUND_BASE_URL + res.data.aquariumBackground);
      })
      .catch((err) => console.error("어항 정보 불러오기 실패", err));
  }, [selectedAquariumId]);

  // 알림 체크 및 Ping
  useEffect(() => {
    const checkUnreadNotifications = async () => {
      if (!auth.user?.id) return;
      axiosInstance
        .get(`/notification/${auth.user.id}`)
        .then((response: AxiosResponse<Notification[]>) => {
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

  // 새로운 알림 발생 시, SFX
  useEffect(() => {
    if (newNotifications) {
      playPush();
    }
  }, [newNotifications]);

  // TODO 유저 정보 없을 때 띄울 뷰 => 컴포넌트로 빼서 쓰기
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
    <div className="fixed w-full min-h-full overflow-hidden" style={{ height: viewportHeight }}>
      <title>AQoO</title>
      <KickedModal />
      <div
        className="absolute inset-0 bg-cover bg-center w-full h-full"
        style={{
          backgroundImage: `url(${background})`,
          height: viewportHeight, // 👈 여기서 강제 적용!
        }}
      ></div>

      <OverlayEffect aquariumData={aquariumData} />
      {fishes.map((fish) => (
        <Fish key={fish.fishId} fish={fish} handleIncreaseExp={handleIncreaseExp} />
      ))}

      <NotificationComponent refreshAquariumData={refreshAquariumData} setNewNotifications={setNewNotifications} />

      {/* BottomMenuBar에 오버레이 토글 함수 전달 */}
      <BottomMenuBar
        userInfo={userInfo}
        aquariumData={aquariumData}
        refreshAquariumData={refreshAquariumData}
        onOpenFishModal={() => setShowFishTicketModal(true)}
        handleIncreaseExp={handleIncreaseExp}
        newNotifications={newNotifications}
        setNewNotifications={setNewNotifications}
        handleToggleOverlay={handleToggleOverlay}
        overlayActive={overlayActive}
        aquariumList={aquariumList}
        selectedAquariumId={selectedAquariumId}
        setSelectedAquariumId={setSelectedAquariumId}
        manualSelected={manualSelected}
        setManualSelected={setManualSelected}
      />

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
          fishList={fishes}
          transparency={transparency}
          setTransparency={setTransparency}
          onConfirm={onOverlayModalConfirm}
          onClose={onOverlayModalClose}
        />
      )}
    </div>
  );
}
