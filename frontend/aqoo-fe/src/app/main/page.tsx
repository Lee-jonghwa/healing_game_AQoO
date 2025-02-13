"use client";

import "@/lib/firebase"; // Firebase 초기화

import { AquariumData, UserInfo } from "@/types";
import React, { useEffect, useRef, useState } from "react";
import axios, { AxiosResponse } from "axios";
import { increaseFishTicket, increaseUserExp } from "@/services/userService";

import BottomMenuBar from "@/app/main/BottomMenuBar";
import CleanComponent from "@/app/main/CleanComponent";
import FirstLoginModal from "@/app/main/components/FirstLoginModal";
import FishTicketModal from "@/components/FishTicketModal"; // 물고기 뽑기 모달
import FriendsList from "@/app/main/FriendsList";
import Image from "next/image";
import KickedModal from "@/app/main/components/KickedModal";
import LevelUpModal from "@/components/LevelUpModal"; // 레벨업 모달
import Link from "next/link";
import NotificationComponent from "@/components/NotificationComponent";
import PushNotifications from "@/app/main/PushNotifications";
import { gsap } from "gsap";
import { useAuth } from "@/hooks/useAuth"; // 로그인 정보 가져오기

// 🔹 물고기 데이터 타입 정의
interface FishData {
  aquariumId: number;
  fishId: number;
  fishTypeId: number;
  fishName: string;
  fishImage: string;
}

export default function MainPage() {
  const { auth } = useAuth(); // 로그인한 유저 정보 가져오기

  const [background, setBackground] = useState("/background-1.png");
  const [activeComponent, setActiveComponent] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [fishes, setFishes] = useState<FishData[]>([]);
  const [aquariumData, setAquariumData] = useState<AquariumData | null>(null);
  const [levelUpInfo, setLevelUpInfo] = useState<{ level: number; expProgress: number } | null>(null);
  const [firstLoginStatus, setFirstLoginStatus] = useState<boolean | null>(null);
  const [firstLoginModal, setFirstLoginModal] = useState<{ status: boolean } | null>(null);

  // 모달 상태 중앙 관리
  const [showFishTicketModal, setShowFishTicketModal] = useState(false);

  const API_BASE_URL = "https://i12e203.p.ssafy.io/api/v1";

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
      if (!auth.user) return; // ✅ auth.user가 없으면 실행 X

      try {
        const response = await axios.get<boolean>(`${API_BASE_URL}/users/isFirst/${auth.user.id}`);
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
      console.log("🔔 levelUpInfo가 변경됨!", levelUpInfo);
    }
  }, [levelUpInfo]);

  // 어항 상태 새로고침 함수 추가
  const refreshAquariumData = async () => {
    if (!userInfo?.mainAquarium) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/aquariums/${userInfo.mainAquarium}`);
      console.log("✅ 어항 상태 갱신:", response.data);
      setAquariumData(response.data);
    } catch (error) {
      console.error("❌ 어항 상태 불러오기 실패", error);
    }
  };

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
        setLevelUpInfo({ level: updatedExpData.userLevel, expProgress: updatedExpData.expProgress }); // ✅ 물고기 티켓 증가 API 호출

        const updatedFishTicket = await increaseFishTicket(auth.user.id);
        if (updatedFishTicket !== null) {
          setUserInfo((prevUserInfo) => ({
            ...prevUserInfo!,
            fishTicket: updatedFishTicket, // ✅ 물고기 티켓 업데이트
          }));
        }
      }

      await refreshUserInfo();
    }
  };

  const refreshUserInfo = async () => {
    if (!auth.user?.id) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/users/${auth.user.id}`);
      console.log("✅ 유저 정보 갱신 완료:", response.data);
      setUserInfo(response.data);
    } catch (error) {
      console.error("❌ 유저 정보 불러오기 실패", error);
    }
  };

  useEffect(() => {
    // TODO  배경화면 제대로 불러오기 로직 추가
    const savedBg = localStorage.getItem("background");
    if (savedBg) {
      setBackground(savedBg);
    }

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
    axios
      .get(`${API_BASE_URL}/aquariums/fish/${userInfo.mainAquarium}`, { withCredentials: true })
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
      })
      .catch((err) => console.error("❌ 어항 정보 불러오기 실패", err));
  }, [userInfo]);

  if (!userInfo) return <div>유저 정보 불러오는 중...</div>;
  if (!aquariumData) return <div>아쿠아리움 정보 로딩 중...</div>;

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <title>AQoO</title>

      {/* ✅ 추방 모달 추가 (URL에 status=kicked가 있으면 모달이 표시됩니다) */}
      <KickedModal />

      {/* 🖼 배경 이미지 */}
      <div
        className="absolute inset-0 bg-cover bg-center w-full h-full before:absolute before:inset-0 before:bg-white/30"
        style={{ backgroundImage: `url(${background})` }}
      ></div>

      {/* 🐠 떠다니는 물고기 렌더링 */}
      {fishes.map((fish) => (
        <Fish key={fish.fishId} fish={fish} />
      ))}

      <NotificationComponent />

      {/* 📌 하단 메뉴 바 */}
      <BottomMenuBar
        setActiveComponent={setActiveComponent}
        userInfo={userInfo}
        aquariumData={aquariumData}
        refreshAquariumData={refreshAquariumData}
        onOpenFishModal={() => setShowFishTicketModal(true)}
        handleIncreaseExp={handleIncreaseExp}
      />

      {/* ✅ CleanComponent를 BottomMenuBar 위에 정확하게 배치 */}
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

      {/* ✅ FriendsList도 같은 방식 적용 */}
      {activeComponent === "friends" && (
        <div className="absolute bottom-[130px] left-[100px] z-50">
          <FriendsList onClose={() => setActiveComponent(null)} userId={userInfo.id} />
        </div>
      )}

      {/* ✅ PushNotifications도 같은 방식 적용 */}
      {activeComponent === "push" && (
        <div className="absolute bottom-[130px] left-[100px] z-50">
          <PushNotifications onClose={() => setActiveComponent(null)} />
        </div>
      )}

      {/* 📌 레벨업 모달 */}
      {levelUpInfo && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <LevelUpModal
            level={levelUpInfo.level}
            onClose={() => setLevelUpInfo(null)}
            onOpenFishModal={() => setShowFishTicketModal(true)}
          />
        </div>
      )}

      {/* 첫 로그인 시 뜰 모달 */}
      {firstLoginStatus && firstLoginModal && (
        <FirstLoginModal
          onClose={() => setFirstLoginModal(null)}
          onOpenFishModal={() => {
            setFirstLoginModal(null);
            setShowFishTicketModal(true);
          }}
        />
      )}

      {/* 📌 물고기 뽑기 모달 */}
      {showFishTicketModal && userInfo && (
        <FishTicketModal
          level={userInfo.level}
          fishTicket={userInfo.fishTicket}
          refreshUserInfo={refreshUserInfo}
          onClose={() => setShowFishTicketModal(false)}
          isFirstLogin={firstLoginStatus ?? false} // ✅ 첫 로그인 여부 전달
        />
      )}
    </div>
  );
}

function Fish({ fish }: { fish: FishData }) {
  const fishRef = useRef<HTMLImageElement | null>(null);
  const directionRef = useRef(1);

  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (!fishRef.current) return;
    gsap.to(fishRef.current, {
      scale: 0.9,
      duration: 0.15,
      ease: "power1.inOut",
      yoyo: true,
      repeat: 1,
    });
  };

  useEffect(() => {
    if (!fishRef.current) return;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const safeMargin = 80;
    const bottomMargin = 100;
    const upperLimit = windowHeight * 0.2;

    const randomStartX = Math.random() * (windowWidth - 2 * safeMargin) + safeMargin;
    const randomStartY = Math.random() * (windowHeight - bottomMargin - 50) + 50;

    gsap.set(fishRef.current, {
      x: randomStartX,
      y: randomStartY,
      scaleX: -1,
    });

    const moveFish = () => {
      if (!fishRef.current) return;
      const randomSpeed = Math.random() * 7 + 9;
      const maxMoveX = windowWidth * (0.4 + Math.random() * 0.4);
      let moveDistanceX = maxMoveX * (Math.random() > 0.5 ? 1 : -1);

      const currentY = parseFloat(gsap.getProperty(fishRef.current, "y") as string);
      let moveDistanceY = windowHeight * (0.1 + Math.random() * 0.15) * (Math.random() > 0.65 ? 1 : -1);

      if (currentY < upperLimit) {
        moveDistanceY = windowHeight * (0.1 + Math.random() * 0.2);
      }

      let newX = parseFloat(gsap.getProperty(fishRef.current, "x") as string) + moveDistanceX;
      let newY = currentY + moveDistanceY;

      if (newX < safeMargin) {
        newX = safeMargin + Math.random() * 50;
        moveDistanceX = Math.abs(moveDistanceX);
      }
      if (newX > windowWidth - safeMargin) {
        newX = windowWidth - safeMargin - Math.random() * 50;
        moveDistanceX = -Math.abs(moveDistanceX);
      }
      if (newY < 50) newY = 50 + Math.random() * 30;
      if (newY > windowHeight - bottomMargin) newY = windowHeight - bottomMargin - Math.random() * 30;

      directionRef.current = moveDistanceX > 0 ? -1 : 1;

      gsap.to(fishRef.current, {
        x: newX,
        y: newY,
        scaleX: directionRef.current,
        duration: randomSpeed,
        ease: "power2.inOut",
        onUpdate: () => {
          const prevX = parseFloat(gsap.getProperty(fishRef.current, "x") as string);
          directionRef.current = newX > prevX ? -1 : 1;
          gsap.set(fishRef.current, { scaleX: directionRef.current });
        },
        onComplete: moveFish,
      });
    };

    moveFish();
  }, []);

  const customLoader = ({ src }: { src: string }) => src;

  return (
    <Image
      loader={customLoader}
      ref={fishRef}
      src={fish.fishImage}
      alt={fish.fishName.toString()}
      width={64}
      height={64}
      className="absolute max-w-64 max-h-16 transform-gpu"
      onClick={handleClick}
      layout="intrinsic"
      unoptimized
    />
  );
}
