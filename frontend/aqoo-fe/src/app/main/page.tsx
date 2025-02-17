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
import OverlayEffect from '@/app/main/components/OverlayEffect';
import FriendsList from '@/app/main/FriendsList';
import PushNotifications from '@/app/main/PushNotifications';
import Fish from '@/components/Fish';
import FishTicketModal from '@/components/FishTicketModal'; // 물고기 뽑기 모달
import LevelUpModal from '@/components/LevelUpModal'; // 레벨업 모달
import NotificationComponent from '@/components/NotificationComponent';
import { useAuth } from '@/hooks/useAuth'; // 로그인 정보 가져오기
import { useSFX } from '@/hooks/useSFX';
import axiosInstance from '@/services/axiosInstance';
import { useRouter } from 'next/navigation';

// 페이지 전역 API_BASE_URL 선언
const API_BASE_URL = 'https://i12e203.p.ssafy.io/api/v1';

// 🔹 물고기 데이터 타입 정의 (기존 API 응답 구조)
interface FishData {
  aquariumId: number;
  fishId: number;
  fishTypeId: number;
  fishName: string;
  fishImage: string;
  size: 'XS' | 'S' | 'M' | 'L' | 'XL';
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
  aquariumId: number;
  onConfirm: (
    selected: { fishImage: string; size: string; count: number }[]
  ) => void;
  onClose: () => void;
}
function FishOverlayModal({
  aquariumId,
  onConfirm,
  onClose,
}: FishOverlayModalProps) {
  const [groupedFish, setGroupedFish] = useState<GroupedFish[]>([]);
  // 각 그룹별 선택 개수를 객체로 관리 (예: { Goldfish: 2, Betta: 1 })
  const [selectedCounts, setSelectedCounts] = useState<Record<string, number>>(
    {}
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log(
      '[FishOverlayModal] useEffect triggered for aquariumId:',
      aquariumId
    );
    // 새로운 API 호출: 어항 내 물고기 리스트 조회 (배열 반환)
    axios
      .get(`${API_BASE_URL}/aquariums/fish/${aquariumId}`, {
        withCredentials: true,
      })
      .then((res: AxiosResponse<FishData[]>) => {
        console.log('[FishOverlayModal] API 호출 성공. 응답 데이터:', res.data);
        const data = res.data;
        // 그룹화: fishName을 기준으로 묶고, 총 개수 및 공통 정보 추출
        const groups: Record<string, GroupedFish> = {};
        data.forEach((item) => {
          if (groups[item.fishName]) {
            groups[item.fishName].count += 1;
          } else {
            groups[item.fishName] = {
              fish: item.fishName,
              count: 1,
              // fishImage 값을 API 응답에서 직접 사용
              fishImage: item.fishImage,
              size: item.size,
            };
          }
        });
        console.log('[FishOverlayModal] 그룹화 결과:', groups);
        const groupsArray = Object.values(groups);
        setGroupedFish(groupsArray);
        console.log('[FishOverlayModal] 그룹 배열 설정됨:', groupsArray);

        // 초기 선택값은 0
        const initCounts: Record<string, number> = {};
        groupsArray.forEach((group) => {
          initCounts[group.fish] = 0;
        });
        setSelectedCounts(initCounts);
        console.log('[FishOverlayModal] 초기 선택 개수 설정됨:', initCounts);
      })
      .catch((err) => {
        console.error('[FishOverlayModal] 물고기 그룹 조회 실패', err);
      })
      .finally(() => {
        setLoading(false);
        console.log('[FishOverlayModal] 로딩 완료. loading 상태:', false);
      });
  }, [aquariumId]);

  // 전체 선택 개수 계산
  const totalSelected = Object.values(selectedCounts).reduce(
    (a, b) => a + b,
    0
  );
  console.log('[FishOverlayModal] 전체 선택 개수 계산:', totalSelected);

  const increment = (fish: string, max: number) => {
    console.log(
      `[FishOverlayModal] increment called for ${fish} (max: ${max}). Current totalSelected: ${totalSelected}`
    );
    if (totalSelected >= 5) {
      alert('전체 최대 5마리까지 선택할 수 있습니다.');
      console.log('[FishOverlayModal] 최대 선택 개수 도달. 증가 불가.');
      return;
    }
    setSelectedCounts((prev) => {
      const current = prev[fish] || 0;
      if (current < max) {
        const newCounts = { ...prev, [fish]: current + 1 };
        console.log(
          `[FishOverlayModal] ${fish} count increased from ${current} to ${
            current + 1
          }. New counts:`,
          newCounts
        );
        return newCounts;
      }
      console.log(`[FishOverlayModal] ${fish} 이미 최대치(${max})에 도달함.`);
      return prev;
    });
  };

  const decrement = (fish: string) => {
    console.log(`[FishOverlayModal] decrement called for ${fish}.`);
    setSelectedCounts((prev) => {
      const current = prev[fish] || 0;
      if (current > 0) {
        const newCounts = { ...prev, [fish]: current - 1 };
        console.log(
          `[FishOverlayModal] ${fish} count decreased from ${current} to ${
            current - 1
          }. New counts:`,
          newCounts
        );
        return newCounts;
      }
      console.log(`[FishOverlayModal] ${fish} count is already 0. No change.`);
      return prev;
    });
  };

  return (
    // 배경 클릭 시 아무 동작도 하지 않도록 onClick 제거
    <div className='fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50'>
      {/* 모달 내부 클릭 시 전파 차단 없이 단순 로그만 남김 */}
      <div
        className='bg-white rounded-lg p-6 w-96'
        onClick={() => {
          console.log('[FishOverlayModal] 모달 내부 클릭.');
        }}
      >
        {/* 모달 우측 상단 X 버튼: 클릭 시 onClose 호출하여 오버레이 생성 취소 */}
        <button
          className='absolute top-2 right-2 text-gray-500 hover:text-gray-700'
          onClick={() => {
            console.log('[FishOverlayModal] X 버튼 클릭 - onClose 호출.');
            onClose();
          }}
        >
          X
        </button>
        <h2 className='text-xl font-bold mb-4'>오버레이에 띄울 물고기 선택</h2>
        {loading ? (
          <div>로딩 중...</div>
        ) : (
          <div className='max-h-60 overflow-y-auto mb-4'>
            {groupedFish.length === 0 ? (
              <div>선택 가능한 물고기가 없습니다.</div>
            ) : (
              groupedFish.map((group) => {
                console.log('[FishOverlayModal] 렌더링 그룹:', group);
                return (
                  <div
                    key={group.fish}
                    className='flex items-center justify-between mb-2'
                  >
                    <div className='flex items-center space-x-2'>
                      <img
                        src={group.fishImage}
                        alt={group.fish}
                        className='w-8 h-8 object-cover rounded-full'
                        onError={(e) => {
                          console.error(
                            `[FishOverlayModal] 이미지 로드 실패: ${group.fishImage}`,
                            e
                          );
                        }}
                        onLoad={() => {
                          console.log(
                            `[FishOverlayModal] 이미지 로드 성공: ${group.fishImage}`
                          );
                        }}
                      />
                      <span>
                        {group.fish} (최대 {group.count}마리)
                      </span>
                    </div>
                    <div className='flex items-center'>
                      <button
                        onClick={() => decrement(group.fish)}
                        className='px-2 py-1 bg-gray-300 rounded-l'
                      >
                        -
                      </button>
                      <span className='px-3'>
                        {selectedCounts[group.fish] || 0}
                      </span>
                      <button
                        onClick={() => increment(group.fish, group.count)}
                        className='px-2 py-1 bg-gray-300 rounded-r'
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
        <div className='mb-2'>
          <span>전체 선택: {totalSelected} / 5</span>
        </div>
        <div className='flex justify-end space-x-2'>
          {/* 취소 버튼 클릭 시 오버레이 생성 취소 */}
          <button
            onClick={() => {
              console.log('[FishOverlayModal] 취소 버튼 클릭 - onClose 호출.');
              onClose();
            }}
            className='px-4 py-2 bg-gray-300 rounded'
          >
            취소
          </button>
          {/* 확인 버튼 클릭 시 onConfirm 호출하여 오버레이 생성 */}
          <button
            onClick={() => {
              const selectedArray = Object.entries(selectedCounts)
                .filter(([, count]) => count > 0)
                .map(([fish, count]) => {
                  const group = groupedFish.find((g) => g.fish === fish);
                  const result = group
                    ? { fishImage: group.fishImage, size: group.size, count }
                    : { fishImage: '', size: '', count };
                  console.log(`[FishOverlayModal] 선택된 항목 생성:`, result);
                  return result;
                });
              console.log(
                '[FishOverlayModal] 확인 버튼 클릭 - onConfirm 호출. 선택된 데이터:',
                selectedArray
              );
              onConfirm(selectedArray);
            }}
            className='px-4 py-2 bg-blue-600 text-white rounded'
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

  const { play: playPush } = useSFX('/sounds/알림-03.mp3');
  const { play: playLevelUp } = useSFX('/sounds/levelupRank.mp3');

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
    typeof navigator !== 'undefined' &&
    navigator.userAgent.toLowerCase().includes('electron');

  // 오버레이 토글 함수: 활성화 상태면 끄고, 아니면 모달로 진행
  const handleToggleOverlay = async () => {
    if (!auth.user?.id) {
      console.warn('사용자 정보가 없습니다.');
      return;
    }
    if (overlayActive) {
      (window as any).electronAPI.toggleOverlay();
      setOverlayActive(false);
      return;
    }
    setShowOverlayModal(true);
  };

  const onOverlayModalConfirm = (
    selected: { fishImage: string; size: string; count: number }[]
  ) => {
    // 예시: 각 항목을 문자열로 변환하여 전달 (필요에 따라 포맷 조정)
    const overlayParam = selected
      .map((item) => `${item.fishImage}:${item.size}:${item.count}`)
      .join(',');
    (window as any).electronAPI.toggleOverlay(overlayParam);
    setOverlayActive(true);
    setShowOverlayModal(false);
  };

  const onOverlayModalClose = () => {
    setShowOverlayModal(false);
  };

  // 기존 API 호출 및 정보 갱신 로직
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
      if (!auth.user) return;
      try {
        const response = await axios.get<boolean>(
          `${API_BASE_URL}/users/isFirst/${auth.user.id}`
        );
        console.log('첫 로그인 여부:', response.data);
        setFirstLoginStatus(response.data);
      } catch (error) {
        console.error('API 호출 중 오류 발생:', error);
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
      console.log('레벨업 정보 변경:', levelUpInfo);
    }
  }, [levelUpInfo]);

  const refreshAquariumData = async () => {
    if (!userInfo?.mainAquarium) return;
    try {
      const response = await axios.get(
        `${API_BASE_URL}/aquariums/${userInfo.mainAquarium}`
      );
      console.log('어항 상태 갱신:', response.data);
      setAquariumData(response.data);
    } catch (error) {
      console.error('어항 상태 불러오기 실패', error);
    }
  };

  const hungrySounds = [
    '/sounds/hungry_1.mp3',
    '/sounds/hungry_2.mp3',
    '/sounds/hungry_3.mp3',
    '/sounds/hungry_4.mp3',
  ];
  const { play, setSrc } = useSFX(hungrySounds[0]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    const playRandomHungrySound = () => {
      if (!aquariumData || aquariumData.feedStatus > 3) return;
      const randomSound =
        hungrySounds[Math.floor(Math.random() * hungrySounds.length)];
      setSrc(randomSound);
      console.log('꼬르륵');
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

  const handleIncreaseExp = async (earnedExp: number) => {
    if (!auth.user?.id) return;
    const prevLevel = userInfo?.level ?? 1;
    const updatedExpData = await increaseUserExp(auth.user.id, earnedExp);
    if (updatedExpData) {
      console.log('경험치 증가 API 응답:', updatedExpData);
      if (updatedExpData.userLevel > prevLevel) {
        console.log('레벨업 발생! 새로운 레벨:', updatedExpData.userLevel);
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
      console.log('유저 정보 갱신 완료:', response.data);
      setUserInfo(response.data);
    } catch (error) {
      console.error('유저 정보 불러오기 실패', error);
    }
  };

  useEffect(() => {
    if (!auth.user?.id) return;
    axios
      .get(`${API_BASE_URL}/users/${auth.user.id}`)
      .then((response) => {
        console.log('유저 정보:', response.data);
        setUserInfo(response.data);
      })
      .catch((error) => console.error('유저 정보 불러오기 실패', error));
  }, [auth.user?.id]);

  useEffect(() => {
    if (!auth.user?.id || userInfo?.mainAquarium === undefined) return;
    axiosInstance
      .get(`aquariums/fish/${userInfo.mainAquarium}`, { withCredentials: true })
      .then((response: AxiosResponse<FishData[] | { message: string }>) => {
        console.log('내 물고기 목록:', response.data);
        if (Array.isArray(response.data)) {
          setFishes(response.data);
        } else {
          console.warn('물고기 데이터가 없습니다.');
          setFishes([]);
        }
      })
      .catch((error) => console.error('물고기 데이터 불러오기 실패', error));
  }, [auth.user?.id, userInfo?.mainAquarium]);

  useEffect(() => {
    if (!userInfo?.mainAquarium) return;
    console.log('메인 아쿠아리움 ID:', userInfo.mainAquarium);
    axios
      .get(`${API_BASE_URL}/aquariums/${userInfo.mainAquarium}`)
      .then((res: AxiosResponse<AquariumData>) => {
        console.log('어항 상세 정보:', res.data);
        setAquariumData(res.data);
        const BACKGROUND_BASE_URL = 'https://i12e203.p.ssafy.io/images';
        const savedBg = BACKGROUND_BASE_URL + res.data.aquariumBackground;
        if (savedBg) {
          setBackground(savedBg);
        }
      })
      .catch((err) => console.error('어항 정보 불러오기 실패', err));
  }, [userInfo]);

  useEffect(() => {
    const checkUnreadNotifications = async () => {
      if (!auth.user?.id) return;
      axios
        .get(`${API_BASE_URL}/notification/${auth.user.id}`)
        .then((response: AxiosResponse<Notification[]>) => {
          console.log('알림 데이터:', response.data);
          setNotifications(response.data);
          const unreadNotifications = response.data.filter(
            (notif) => notif.status === false
          );
          setNewNotifications(unreadNotifications.length > 0);
        })
        .catch((error) => {
          console.error('알림 불러오기 실패', error);
          setError('알림을 불러오는데 실패했습니다.');
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
      <div className='absolute inset-0 bg-cover bg-center w-full h-full text-white text-xl flex flex-col items-center justify-center before:absolute before:inset-0 before:bg-white/30 bg-[url(/background-1.png)]'>
        로딩 중...
      </div>
    );
  if (!aquariumData)
    return (
      <div className='absolute inset-0 bg-cover bg-center w-full h-full text-white text-xl flex flex-col items-center justify-center before:absolute before:inset-0 before:bg-white/30 bg-[url(/background-1.png)]'>
        아쿠아리움 정보 로딩 중...
      </div>
    );

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <title>AQoO</title>
      <KickedModal />
      <div
        className='absolute inset-0 bg-cover bg-center w-full h-full'
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
      {activeComponent === 'friends' && (
        <div className='absolute bottom-[130px] left-[100px] z-50'>
          <FriendsList
            onClose={() => setActiveComponent(null)}
            userId={userInfo.id}
          />
        </div>
      )}
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
        setNewNotifications={setNewNotifications}
      />
      {levelUpInfo && (
        <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50'>
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
