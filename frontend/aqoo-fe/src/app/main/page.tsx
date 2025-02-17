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
import { useSFX } from "@/hooks/useSFX"; // ✅ useSFX 가져오기

// 🔹 물고기 데이터 타입 정의
interface FishData {
  aquariumId: number;
  fishId: number;
  fishTypeId: number;
  fishName: string;
  fishImage: string;
  size: "XS" | "S" | "M" | "L" | "XL";
}

export default function MainPage() {
  const { auth } = useAuth(); // 로그인한 유저 정보 가져오기
  const router = useRouter();
  const [background, setBackground] = useState("/background-1.png");
  const [activeComponent, setActiveComponent] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [fishes, setFishes] = useState<FishData[]>([]);
  const [aquariumData, setAquariumData] = useState<AquariumData | null>(null);

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

  //알람 처리
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [newNotifications, setNewNotifications] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 모달 상태 중앙 관리
  const [showFishTicketModal, setShowFishTicketModal] = useState(false);

  const API_BASE_URL = "https://i12e203.p.ssafy.io/api/v1";

  // MainPage에도 필요하다면 Electron 감지 (추가 기능에 사용 가능)
  const isElectron =
    typeof navigator !== "undefined" &&
    navigator.userAgent.toLowerCase().includes("electron");

  // 메인 페이지에 있던 오버레이 토글 함수 (이제 BottomMenuBar로 전달)
  const handleToggleOverlay = async () => {
    if (!auth.user?.id) {
      console.warn("사용자 정보가 없습니다.");
      return;
    }

    try {
      // 사용자 정보를 API 호출로 가져옵니다.
      const response: AxiosResponse = await axios.get(
        `${API_BASE_URL}/users/${auth.user.id}`,
        { withCredentials: true }
      );

      // API 응답에서 mainFishImage 값을 추출합니다.
      const fishPath = response.data.mainFishImage;
      if (!fishPath) {
        console.warn("API 응답에 mainFishImage 값이 없습니다.");
        return;
      }
      console.log("[MainPage] 오버레이 토글 - fishPath:", fishPath);

      // electronAPI.toggleOverlay를 통해 오버레이를 토글합니다.
      (window as any).electronAPI.toggleOverlay(fishPath);
    } catch (error) {
      console.error("사용자 정보를 불러오는 중 오류 발생:", error);
    }
  };

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration: ServiceWorkerRegistration) => {
          console.log("✅ 서비스 워커 등록 완료:", registration);
        })
        .catch((err: unknown) =>
          console.error("🔥 서비스 워커 등록 실패:", err)
        );
    }

    const fetchIsFirstLogin = async () => {
      if (!auth.user) return; // ✅ auth.user가 없으면 실행 X

      try {
        const response = await axios.get<boolean>(
          `${API_BASE_URL}/users/isFirst/${auth.user.id}`
        );
        console.log("첫 로그인인지 아닌지:", response.data);
        setFirstLoginStatus(response.data); // ✅ true/false 할당
      } catch (error) {
        console.error("API 호출 중 오류 발생:", error);
      }
    };

    fetchIsFirstLogin();
  }, []);

  useEffect(() => {
    if (firstLoginStatus) {
      setFirstLoginModal({ status: true }); // ✅ 첫 로그인 모달 자동 활성화
    }
  }, [firstLoginStatus]); // ✅ firstLoginStatus 변경 시 실행

  useEffect(() => {
    if (levelUpInfo) {
      console.log("🔔 levelUpInfo가 변경!", levelUpInfo);
    }
  }, [levelUpInfo]);

  // 어항 상태 새로고침 함수 추가
  const refreshAquariumData = async () => {
    if (!userInfo?.mainAquarium) return;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/aquariums/${userInfo.mainAquarium}`
      );
      console.log("✅ 어항 상태 갱신:", response.data);
      setAquariumData(response.data);
    } catch (error) {
      console.error("❌ 어항 상태 불러오기 실패", error);
    }
  };

  const hungrySounds = [
    "/sounds/hungry_1.mp3",
    "/sounds/hungry_2.mp3",
    "/sounds/hungry_3.mp3",
    "/sounds/hungry_4.mp3",
  ];

  const { play, setSrc } = useSFX(hungrySounds[0]); // 초기 소리 설정

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const playRandomHungrySound = () => {
      if (!aquariumData || aquariumData.feedStatus > 3) return;

      // ✅ 랜덤한 소리 선택 후 setSrc()로 변경
      const randomSound =
        hungrySounds[Math.floor(Math.random() * hungrySounds.length)];
      setSrc(randomSound);
      console.log("꼬르륵");
      play();

      // ✅ feedStatus 값에 따라 다른 시간 간격 설정
      let minDelay, maxDelay;
      switch (aquariumData.feedStatus) {
        case 3:
          minDelay = 40000; // 40초
          maxDelay = 60000; // 60초
          break;
        case 2:
          minDelay = 30000; // 30초
          maxDelay = 50000; // 50초
          break;
        case 1:
          minDelay = 20000; // 20초
          maxDelay = 40000; // 40초
          break;
        case 0:
          minDelay = 10000; // 10초
          maxDelay = 30000; // 30초
          break;
        default:
          return;
      }

      const randomDelay = Math.floor(
        Math.random() * (maxDelay - minDelay) + minDelay
      );
      timeoutId = setTimeout(playRandomHungrySound, randomDelay);
    };

    if (aquariumData && aquariumData.feedStatus <= 3) {
      playRandomHungrySound();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [aquariumData]);

  // 경험치 증가 & 레벨업 체크 함수
  const handleIncreaseExp = async (earnedExp: number) => {
    if (!auth.user?.id) return;

    const prevLevel = userInfo?.level ?? 1; // 기존 레벨 저장

    // 경험치 증가 API 호출
    const updatedExpData = await increaseUserExp(auth.user.id, earnedExp);

    if (updatedExpData) {
      console.log("✅ 경험치 증가 API 응답:", updatedExpData);

      // 레벨업 확인
      if (updatedExpData.userLevel > prevLevel) {
        console.log("🎉 레벨업 발생! 새로운 레벨:", updatedExpData.userLevel);
        setLevelUpInfo({
          level: updatedExpData.userLevel,
          expProgress: updatedExpData.expProgress,
        });

        playLevelUp();

        const updatedFishTicket = await increaseFishTicket(auth.user.id);
        if (updatedFishTicket !== null) {
          setUserInfo((prevUserInfo) => ({
            ...prevUserInfo!,
            fishTicket: updatedFishTicket,
          }));
        }
      }

      await refreshUserInfo();
    }
  };

  const refreshUserInfo = async () => {
    if (!auth.user?.id) return;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/users/${auth.user.id}`
      );
      console.log("✅ 유저 정보 갱신 완료:", response.data);
      setUserInfo(response.data);
    } catch (error) {
      console.error("❌ 유저 정보 불러오기 실패", error);
    }
  };

  useEffect(() => {
    if (!auth.user?.id) return; // 로그인한 유저 ID가 없으면 API 호출 안 함

    axios
      .get(`${API_BASE_URL}/users/${auth.user.id}`)
      .then((response: AxiosResponse<UserInfo>) => {
        console.log("✅ 유저 정보:", response.data);
        setUserInfo(response.data);
      })
      .catch((error) => {
        console.error("❌ 유저 정보 불러오기 실패", error);
      });
  }, [auth.user?.id]);

  useEffect(() => {
    if (!auth.user?.id || userInfo?.mainAquarium === undefined) return;

    // 물고기 데이터 불러오기 (API 호출)
    axiosInstance
      .get(`aquariums/fish/${userInfo.mainAquarium}`, { withCredentials: true })
      .then((response: AxiosResponse<FishData[] | { message: string }>) => {
        console.log("🐠 내 물고기 목록:", response.data);
        if (Array.isArray(response.data)) {
          setFishes(response.data);
        } else {
          console.warn("⚠️ 물고기 데이터가 없습니다.");
          setFishes([]);
        }
      })
      .catch((error) => {
        console.error("❌ 물고기 데이터 불러오기 실패", error);
      });
  }, [auth.user?.id, userInfo?.mainAquarium]);

  useEffect(() => {
    if (!userInfo?.mainAquarium) return;

    console.log("🐠 메인 아쿠아리움 ID:", userInfo.mainAquarium);

    axios
      .get(`${API_BASE_URL}/aquariums/${userInfo.mainAquarium}`)
      .then((res: AxiosResponse<AquariumData>) => {
        console.log("✅ 어항 상세 정보:", res.data);
        setAquariumData(res.data);

        const BACKGROUND_BASE_URL = "https://i12e203.p.ssafy.io/images";
        const savedBg = BACKGROUND_BASE_URL + res.data.aquariumBackground;
        if (savedBg) {
          setBackground(savedBg);
        }
      })
      .catch((err) => console.error("❌ 어항 정보 불러오기 실패", err));
  }, [userInfo]);

  useEffect(() => {
    const checkUnreadNotifications = async () => {
      if (!auth.user?.id) return;

      axios
        .get(`${API_BASE_URL}/notification/${auth.user.id}`)
        .then((response: AxiosResponse<Notification[]>) => {
          console.log("🔔 알림 데이터:", response.data);
          setNotifications(response.data);

          const unreadNotifications = response.data.filter(
            (notif) => notif.status === false
          );
          setNewNotifications(unreadNotifications.length > 0);
        })
        .catch((error) => {
          console.error("❌ 알림 불러오기 실패", error);
          setError("알림을 불러오는데 실패했습니다.");
        })
        .finally(() => setLoading(false));
    };
    checkUnreadNotifications();
  }, [auth.user?.id]);

  useEffect(() => {
    if (newNotifications) {
      playPush(); // 푸시 알림 효과음 재생
    }
  }, [newNotifications]);

  if (!userInfo)
    return (
      <div className="absolute inset-0 bg-cover bg-center w-full h-full text-white text-xl text-center flex flex-col items-center justify-center before:absolute before:inset-0 before:bg-white/30 bg-[url(/background-1.png)]">
        <svg
          aria-hidden="true"
          className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600 mb-4"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
        유저 정보 불러오는 중...
      </div>
    );
  if (!aquariumData)
    return (
      <div className="absolute inset-0 bg-cover bg-center w-full h-full text-white text-xl text-center flex flex-col items-center justify-center before:absolute before:inset-0 before:bg-white/30 bg-[url(/background-1.png)]">
        <svg
          aria-hidden="true"
          className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600 mb-4"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
        아쿠아리움 정보 로딩 중...
      </div>
    );

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <title>AQoO</title>

      {/* ✅ 추방 모달 */}
      <KickedModal />

      {/* 🖼 배경 이미지 */}
      <div
        className="absolute inset-0 bg-cover bg-center w-full h-full"
        style={{ backgroundImage: `url(${background})` }}
      ></div>

      {/* 🖼 화면 효과 오버레이 */}
      <OverlayEffect aquariumData={aquariumData} />

      {/* 🐠 떠다니는 물고기 */}
      {fishes.map((fish) => (
        <Fish key={fish.fishId} fish={fish} />
      ))}

      {/* 📌 하단 메뉴바 (오버레이 토글 버튼은 BottomMenuBar 내부에서 함께 이동) */}
      <BottomMenuBar
        setActiveComponent={setActiveComponent}
        activeComponent={activeComponent}
        userInfo={userInfo}
        aquariumData={aquariumData}
        refreshAquariumData={refreshAquariumData}
        onOpenFishModal={() => setShowFishTicketModal(true)}
        handleIncreaseExp={handleIncreaseExp}
        newNotifications={newNotifications}
        handleToggleOverlay={handleToggleOverlay} // 오버레이 토글 함수 전달
      />

      {/* ✅ 추가 컴포넌트들 */}
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

      <NotificationComponent
        refreshAquariumData={refreshAquariumData}
        setNewNotifications={setNewNotifications}
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
    </div>
  );
}
