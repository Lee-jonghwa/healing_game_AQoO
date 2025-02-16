'use client';

import '@/lib/firebase'; // Firebase 초기화

import { increaseFishTicket, increaseUserExp } from '@/services/userService';
import { AquariumData, Notification, UserInfo } from '@/types';
import axios, { AxiosResponse } from 'axios';
import { useEffect, useState } from 'react';

import BottomMenuBar from '@/app/main/BottomMenuBar';
import CleanComponent from '@/app/main/CleanComponent';
import FirstLoginModal from '@/app/main/components/FirstLoginModal';
import KickedModal from '@/app/main/components/KickedModal';
import FriendsList from '@/app/main/FriendsList';
import PushNotifications from '@/app/main/PushNotifications';
import Fish from '@/components/Fish';
import FishTicketModal from '@/components/FishTicketModal'; // 물고기 뽑기 모달
import LevelUpModal from '@/components/LevelUpModal'; // 레벨업 모달
import NotificationComponent from '@/components/NotificationComponent';
import { useAuth } from '@/hooks/useAuth'; // 로그인 정보 가져오기
import { useSFX } from '@/hooks/useSFX'; // ✅ useSFX 가져오기
import axiosInstance from '@/services/axiosInstance';
import { useRouter } from 'next/navigation';

// 🔹 물고기 데이터 타입 정의
interface FishData {
  aquariumId: number;
  fishId: number;
  fishTypeId: number;
  fishName: string;
  fishImage: string;
  size: 'XS' | 'S' | 'M' | 'L' | 'XL';
}

export default function MainPage() {
  const { auth } = useAuth(); // 로그인한 유저 정보 가져오기
  const router = useRouter();
  const [background, setBackground] = useState('/background-1.png');
  const [activeComponent, setActiveComponent] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [fishes, setFishes] = useState<FishData[]>([]);
  const [aquariumData, setAquariumData] = useState<AquariumData | null>(null);
  const [levelUpInfo, setLevelUpInfo] = useState<{
    level: number;
    expProgress: number;
  } | null>(null);
  const [firstLoginStatus, setFirstLoginStatus] = useState<boolean | null>(
    null
  );
  const [firstLoginModal, setFirstLoginModal] = useState<{
    status: boolean;
  } | null>(null);

  const { play: playPush } = useSFX('/sounds/push.mp3');
  const { play: playLevelUp } = useSFX('/sounds/levelupRank.mp3');

  //알람 처리
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [newNotifications, setNewNotifications] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 모달 상태 중앙 관리
  const [showFishTicketModal, setShowFishTicketModal] = useState(false);

  const API_BASE_URL = 'https://i12e203.p.ssafy.io/api/v1';

  // Electron 환경 감지: navigator.userAgent에 "electron" 문자열이 포함되어 있으면 Electron으로 판단
  const isElectron =
    typeof navigator !== 'undefined' &&
    navigator.userAgent.toLowerCase().includes('electron');

  const handleToggleOverlay = () => {
    // localStorage에서 "recoil-persist" 키를 읽어옵니다.
    const recoilData = localStorage.getItem('recoil-persist');
    if (!recoilData) {
      console.warn('recoil-persist 데이터가 없습니다.');
      return;
    }
    try {
      const parsedData = JSON.parse(recoilData);
      const fishPath = parsedData?.authAtom?.user?.mainFishImage;
      if (!fishPath) {
        console.warn('recoil-persist에서 fishPath를 찾지 못했습니다.');
        return;
      }
      console.log('[MainPage] 오버레이 토글 - fishPath:', fishPath);
      // electronAPI.toggleOverlay를 통해 오버레이를 토글합니다.
      (window as any).electronAPI.toggleOverlay(fishPath);
    } catch (error) {
      console.error('recoil-persist 데이터를 파싱하는 중 오류 발생:', error);
    }
  };

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration: ServiceWorkerRegistration) => {
          console.log('✅ 서비스 워커 등록 완료:', registration);
        })
        .catch((err: unknown) =>
          console.error('🔥 서비스 워커 등록 실패:', err)
        );
    }

    const fetchIsFirstLogin = async () => {
      if (!auth.user) return; // ✅ auth.user가 없으면 실행 X

      try {
        const response = await axios.get<boolean>(
          `${API_BASE_URL}/users/isFirst/${auth.user.id}`
        );
        console.log('첫 로그인인지 아닌지:', response.data);
        setFirstLoginStatus(response.data); // ✅ true/false 할당
      } catch (error) {
        console.error('API 호출 중 오류 발생:', error);
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
      console.log('🔔 levelUpInfo가 변경됨!', levelUpInfo);
    }
  }, [levelUpInfo]);

  // 어항 상태 새로고침 함수 추가
  const refreshAquariumData = async () => {
    if (!userInfo?.mainAquarium) return;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/aquariums/${userInfo.mainAquarium}`
      );
      console.log('✅ 어항 상태 갱신:', response.data);
      setAquariumData(response.data);
    } catch (error) {
      console.error('❌ 어항 상태 불러오기 실패', error);
    }
  };

  // 경험치 증가 & 레벨업 체크 함수
  const handleIncreaseExp = async (earnedExp: number) => {
    if (!auth.user?.id) return;

    const prevLevel = userInfo?.level ?? 1; // 기존 레벨 저장

    // 경험치 증가 API 호출
    const updatedExpData = await increaseUserExp(auth.user.id, earnedExp);

    if (updatedExpData) {
      console.log('✅ 경험치 증가 API 응답:', updatedExpData);

      // 레벨업 확인
      if (updatedExpData.userLevel > prevLevel) {
        console.log('🎉 레벨업 발생! 새로운 레벨:', updatedExpData.userLevel);
        setLevelUpInfo({
          level: updatedExpData.userLevel,
          expProgress: updatedExpData.expProgress,
        }); // ✅ 물고기 티켓 증가 API 호출

        playLevelUp();

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
      console.log('✅ 유저 정보 갱신 완료:', response.data);
      setUserInfo(response.data);
    } catch (error) {
      console.error('❌ 유저 정보 불러오기 실패', error);
    }
  };

  useEffect(() => {
    if (!auth.user?.id) return; // 로그인한 유저 ID가 없으면 API 호출 안 함

    axios
      .get(`${API_BASE_URL}/users/${auth.user.id}`)
      .then((response: AxiosResponse<UserInfo>) => {
        console.log('✅ 유저 정보:', response.data);
        setUserInfo(response.data);
      })
      .catch((error) => {
        console.error('❌ 유저 정보 불러오기 실패', error);
      });
  }, [auth.user?.id]);

  useEffect(() => {
    if (!auth.user?.id || userInfo?.mainAquarium === undefined) return;

    // 물고기 데이터 불러오기 (API 호출)
    axiosInstance
      .get(`aquariums/fish/${userInfo.mainAquarium}`, { withCredentials: true })
      .then((response: AxiosResponse<FishData[] | { message: string }>) => {
        console.log('🐠 내 물고기 목록:', response.data);
        if (Array.isArray(response.data)) {
          setFishes(response.data);
        } else {
          console.warn('⚠️ 물고기 데이터가 없습니다.');
          setFishes([]);
        }
      })
      .catch((error) => {
        console.error('❌ 물고기 데이터 불러오기 실패', error);
      });
  }, [auth.user?.id, userInfo?.mainAquarium]);

  useEffect(() => {
    if (!userInfo?.mainAquarium) return;

    console.log('🐠 메인 아쿠아리움 ID:', userInfo.mainAquarium);

    axios
      .get(`${API_BASE_URL}/aquariums/${userInfo.mainAquarium}`)
      .then((res: AxiosResponse<AquariumData>) => {
        console.log('✅ 어항 상세 정보:', res.data);
        setAquariumData(res.data);

        const BACKGROUND_BASE_URL = 'https://i12e203.p.ssafy.io/images';
        // TODO  배경화면 제대로 불러오기 로직 추가
        // const savedBg = localStorage.getItem("background");

        const savedBg = BACKGROUND_BASE_URL + res.data.aquariumBackground;

        if (savedBg) {
          setBackground(savedBg);
        }
      })
      .catch((err) => console.error('❌ 어항 정보 불러오기 실패', err));
  }, [userInfo]);

  useEffect(() => {
    const checkUnreadNotifications = async () => {
      if (!auth.user?.id) return; // ✅ 로그인되지 않은 경우 API 호출 안함

      // ✅ 현재 로그인된 유저의 ID로 알림 가져오기
      axios
        .get(`${API_BASE_URL}/notification/${auth.user.id}`)
        .then((response: AxiosResponse<Notification[]>) => {
          console.log('🔔 알림 데이터:', response.data);
          setNotifications(response.data);

          // ✅ 안 읽은 알림들만 읽음 처리 API 호출
          const unreadNotifications = response.data.filter(
            (notif) => notif.status === false
          );

          if (unreadNotifications.length > 0) {
            console.log('안 읽은 알람 있음');
            setNewNotifications(true);
          } else {
            console.log('안 읽은 알람 없음');
            setNewNotifications(false);
          }
        })
        .catch((error) => {
          console.error('❌ 알림 불러오기 실패', error);
          setError('알림을 불러오는데 실패했습니다.');
        })
        .finally(() => setLoading(false));
    };
    checkUnreadNotifications();
  }, [auth.user?.id]); // ✅ 로그인한 유저 ID가 바뀌면 다시 호출

  useEffect(() => {
    if (newNotifications) {
      playPush(); // ✅ 푸시 알림 효과음 재생
    }
  }, [newNotifications]);

  if (!userInfo)
    return (
      <div className='absolute inset-0 bg-cover bg-center w-full h-full text-white text-xl text-center flex flex-col items-center justify-center before:absolute before:inset-0 before:bg-white/30 bg-[url(/background-1.png)]'>
        <svg
          aria-hidden='true'
          className='w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600 mb-4'
          viewBox='0 0 100 101'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            d='M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z'
            fill='currentColor'
          />
          <path
            d='M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z'
            fill='currentFill'
          />
        </svg>
        유저 정보 불러오는 중...
      </div>
    );
  if (!aquariumData) return;
  <div className='absolute inset-0 bg-cover bg-center w-full h-full text-white text-xl text-center flex flex-col items-center justify-center before:absolute before:inset-0 before:bg-white/30 bg-[url(/background-1.png)]'>
    <svg
      aria-hidden='true'
      className='w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600 mb-4'
      viewBox='0 0 100 101'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z'
        fill='currentColor'
      />
      <path
        d='M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z'
        fill='currentFill'
      />
    </svg>
    아쿠아리움 정보 로딩 중...
  </div>;

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <title>AQoO</title>

      {/* ✅ 추방 모달 추가 (URL에 status=kicked가 있으면 모달이 표시됩니다) */}
      <KickedModal />

      {/* 🖼 배경 이미지 */}
      <div
        className='absolute inset-0 bg-cover bg-center w-full h-full before:absolute before:inset-0 before:bg-white/30'
        style={{ backgroundImage: `url(${background})` }}
      ></div>

      {/* 🐠 떠다니는 물고기 렌더링 */}
      {fishes.map((fish) => (
        <Fish key={fish.fishId} fish={fish} />
      ))}

      {/* 📌 하단 메뉴 바 */}
      <BottomMenuBar
        setActiveComponent={setActiveComponent}
        activeComponent={activeComponent} // 현재 활성화된 컴포넌트 전달
        userInfo={userInfo}
        aquariumData={aquariumData}
        refreshAquariumData={refreshAquariumData}
        onOpenFishModal={() => setShowFishTicketModal(true)}
        handleIncreaseExp={handleIncreaseExp}
        newNotifications={newNotifications}
      />

      {/* ✅ CleanComponent를 BottomMenuBar 위에 정확하게 배치 */}
      {activeComponent === 'clean' && (
        <div className='absolute bottom-[130px] right-[100px] z-50'>
          <CleanComponent
            onClose={() => setActiveComponent(null)}
            onCleanSuccess={refreshAquariumData}
            handleIncreaseExp={handleIncreaseExp}
            aquariumId={userInfo.mainAquarium}
          />
        </div>
      )}

      {/* ✅ FriendsList도 같은 방식 적용 */}
      {activeComponent === 'friends' && (
        <div className='absolute bottom-[130px] left-[100px] z-50'>
          <FriendsList
            onClose={() => setActiveComponent(null)}
            userId={userInfo.id}
          />
        </div>
      )}

      {/* ✅ PushNotifications도 같은 방식 적용 */}
      {activeComponent === 'push' && (
        <div className='absolute bottom-[130px] left-[100px] z-50'>
          <PushNotifications
            onClose={() => setActiveComponent(null)}
            setNewNotifications={setNewNotifications}
          />
        </div>
      )}
      <NotificationComponent
        refreshAquariumData={refreshAquariumData}
        setNewNotifications={setNewNotifications} // 이 부분 추가
      />

      {/* 📌 레벨업 모달 */}
      {levelUpInfo && (
        <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50'>
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

      {/* Electron 환경일 때만 오버레이 온/오프 버튼 표시 */}
      {isElectron && (
        <button
          onClick={handleToggleOverlay}
          className='absolute top-96 left-50 mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
        >
          오버레이 온/오프
        </button>
      )}
    </div>
  );
}
