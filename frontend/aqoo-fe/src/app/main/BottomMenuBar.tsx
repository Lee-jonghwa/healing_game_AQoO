'use client';

import { AquariumData, UserInfo } from '@/types';

import CleanComponent from '@/app/main/CleanComponent';
import FriendsList from '@/app/main/FriendsList';
import PushNotifications from '@/app/main/PushNotifications';
import { useSFX } from '@/hooks/useSFX';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import MenuButton from './MenuButton';

const API_BASE_URL = 'https://i12e203.p.ssafy.io/api/v1';

interface BottomMenuBarProps {
  userInfo: UserInfo;
  aquariumData?: AquariumData;
  refreshAquariumData: () => void;
  handleIncreaseExp: (earnedExp: number) => Promise<void>;
  onOpenFishModal: () => void;
  newNotifications: boolean;
  setNewNotifications: (newNotifications: boolean) => void;
  handleToggleOverlay: () => void;
  overlayActive: boolean;
}

export default function BottomMenuBar({
  userInfo,
  aquariumData,
  refreshAquariumData,
  onOpenFishModal,
  handleIncreaseExp,
  newNotifications,
  setNewNotifications,
  handleToggleOverlay,
  overlayActive,
}: BottomMenuBarProps) {
  const router = useRouter();
  const { play: playModal } = useSFX('/sounds/clickeffect-03.mp3');
  const { play: playSuccess } = useSFX('/sounds/gaugeeffect-02.mp3');
  const { play: playWater } = useSFX('/sounds/waterEffect.mp3');
  const { play: playFeed } = useSFX('/sounds/feedEffect.mp3');
  const [isMenuVisible, setIsMenuVisible] = useState(true);

  const [activeComponent, setActiveComponent] = useState<string | null>(null);

  const toggleMenuBar = () => {
    setIsMenuVisible((prev) => !prev);
    setActiveComponent(null);
  };

  const isWaterMaxed = aquariumData?.waterStatus === 5;
  const isPollutionMaxed = aquariumData?.pollutionStatus === 5;
  const isFeedMaxed = aquariumData?.feedStatus === 5;

  const handleButtonClick = (component: string) => {
    if (activeComponent === component) {
      setActiveComponent(null);
    } else {
      setActiveComponent(component);
    }
  };

  const handleAquariumUpdate = async (type: 'water' | 'feed') => {
    if (!userInfo?.mainAquarium) return;
    if (
      (type === 'water' && isWaterMaxed) ||
      (type === 'feed' && isFeedMaxed)
    ) {
      alert(
        `👍👍 ${
          type === 'water'
            ? '수질이 이미 최고 상태입니다!'
            : '먹이가 이미 가득 찼습니다!'
        } 👍👍`
      );
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/aquariums/update`, {
        aquariumId: userInfo.mainAquarium,
        type,
        data: '',
      });
      if (type === 'water') {
        playWater();
      } else {
        playFeed();
      }
      alert(`${type === 'water' ? '물 갈이 성공!' : '먹이 주기 성공!'}`);
      await handleIncreaseExp(10);
      refreshAquariumData();
      playSuccess();
    } catch (error) {
      console.error(`❌ 어항 ${type} 변경 실패`, error);
    }
  };

  const expToNextLevel = userInfo.level * 20;
  const expProgress = Math.max(
    0,
    Math.min((userInfo.exp / expToNextLevel) * 100, 100)
  );

  const isElectron =
    typeof navigator !== 'undefined' &&
    navigator.userAgent.toLowerCase().includes('electron');

  return (
    <div className='fixed bottom-0 w-full flex flex-col items-center pb-2 md:pb-4'>
      <div className='relative w-full max-w-[1400px]'>
        <button
          onClick={toggleMenuBar}
          className={`absolute left-1/2 transform -translate-x-1/2 px-3 py-1 bg-white/80 rounded-full shadow-md transition-all duration-500 ${
            isMenuVisible ? 'bottom-[100%] mb-1' : 'bottom-2'
          }`}
        >
          {isMenuVisible ? '▼' : '▲'}
        </button>
        {isElectron && (
          <button
            onClick={handleToggleOverlay}
            className={`absolute left-0 transition-all duration-500 px-4 py-2 text-white rounded shadow-md opacity-80
      ${
        overlayActive
          ? 'bg-red-600 hover:bg-red-700'
          : 'bg-blue-600 hover:bg-blue-700'
      }
      ${isMenuVisible ? 'bottom-[100%] mb-1' : 'bottom-2'}`}
          >
            {overlayActive ? '오버레이 끄기' : '오버레이 켜기'}
          </button>
        )}

        {activeComponent === 'friends' && (
          <div className='absolute  bottom-full left-0 mb-2 bg-white/50 border border-gray-400 rounded-lg shadow-lg overflow-hidden z-50'>
            <div className='overflow-y-auto h-full custom-scollbar'>
              <FriendsList
                onClose={() => setActiveComponent(null)}
                userId={userInfo.id}
              />
            </div>
          </div>
        )}

        {activeComponent === 'push' && (
          <div className='absolute  bottom-full left-0 mb-2 bg-white/50 border border-gray-400 rounded-lg shadow-lg overflow-auto z-50'>
            <PushNotifications
              onClose={() => setActiveComponent(null)}
              setNewNotifications={() => {}}
            />
          </div>
        )}

        {/* ✅ 선택된 컴포넌트만 표시 (BottomMenuBar 위에서 반응형 유지) */}
        {activeComponent === 'clean' && (
          <div className='absolute  absolute bottom-full mb-2 right-0 bg-white/50 border border-gray-400 rounded-lg shadow-lg overflow-auto z-50'>
            <CleanComponent
              onClose={() => setActiveComponent(null)}
              onCleanSuccess={refreshAquariumData}
              handleIncreaseExp={handleIncreaseExp} // ✅ 이 방식이 맞음 (async 함수이므로 그대로 전달 가능)
              aquariumId={userInfo.mainAquarium}
            />
          </div>
        )}

        <div
          className={`w-full bg-white/70 rounded-lg px-3 flex flex-wrap items-center justify-between shadow-lg backdrop-blur-md transition-all duration-500 ${
            isMenuVisible
              ? 'opacity-100'
              : 'opacity-0 translate-y-12 pointer-events-none'
          } relative`}
        >
          <div className='flex space-x-2 md:space-x-4'>
            <MenuButton
              icon='/icon/icon-fishTank.png'
              label='MyPage'
              onClick={() => router.push('/mypage')}
            />
            <MenuButton
              icon='/icon/friendIcon.png'
              label='Friends'
              onClick={() => {
                playModal();
                handleButtonClick('friends');
              }}
              isActive={activeComponent === 'friends'}
            />
            <div className='relative'>
              <MenuButton
                icon='/icon/alertIcon.png'
                label='Push'
                onClick={() => {
                  playModal();
                  handleButtonClick('push');
                  setNewNotifications(false); // ✅ 푸시 버튼을 누르면 알림 핑 제거
                }}
                isActive={activeComponent === 'push'}
              />
              {newNotifications && (
                <div className='notification-dot absolute top-2 right-2' />
              )}
            </div>
            <MenuButton
              icon='/icon/gameIcon.png'
              label='Game'
              onClick={() => router.push('/gameroom')}
            />
            <MenuButton
              icon='/icon/fishticketIcon.png'
              label='Ticket'
              onClick={() => {
                playModal();
                onOpenFishModal();
              }}
            />
          </div>
          <div className='flex flex-col items-center text-center'>
            <p className='text-sm md:text-lg font-bold'>
              Lv. {userInfo.level} {userInfo.nickname}
            </p>
            <div className='flex items-center space-x-2'>
              <div className='flex items-center space-x-3 w-full'>
                <p className='text-lg font-bold'>exp</p>
                <div className='relative w-48 h-6 bg-gray-300 rounded-full overflow-hidden flex items-center'>
                  <div
                    className='bg-blue-600 h-full transition-all duration-300'
                    style={{ width: `${expProgress}%` }}
                  ></div>
                  <p className='absolute inset-0 flex justify-center items-center text-base font-bold'>
                    {userInfo.exp}
                  </p>
                </div>
                <p className='text-lg font-bold'>{expToNextLevel}</p>
              </div>
            </div>
          </div>
          <div className='flex flex-col space-y-1 p-1'>
            <StatusBar
              icon='icon/waterIcon.png'
              label='어항 수질'
              value={aquariumData?.waterStatus ?? 0}
              color='bg-blue-900'
            />
            <StatusBar
              icon='icon/cleanIcon.png'
              label='청결도'
              value={aquariumData?.pollutionStatus ?? 0}
              color='bg-indigo-400'
            />
            <StatusBar
              icon='icon/feedIcon.png'
              label='포만감'
              value={aquariumData?.feedStatus ?? 0}
              color='bg-cyan-400'
            />
          </div>
          <div className='flex space-x-2 md:space-x-4'>
            <MenuButton
              icon='/icon/waterIcon.png'
              label='Water'
              onClick={() => handleAquariumUpdate('water')}
            />
            <MenuButton
              icon='/icon/cleanIcon.png'
              label='Clean'
              onClick={() => {
                if (isPollutionMaxed) {
                  alert('청결 상태가 이미 최고 상태입니다!');
                  return;
                }
                setActiveComponent('clean');
              }}
              isActive={activeComponent === 'clean'}
            />
            <MenuButton
              icon='/icon/feedIcon.png'
              label='Feed'
              onClick={() => handleAquariumUpdate('feed')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBar({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  const segmentCount = 5;
  const activeSegments = Math.max(0, Math.min(value, segmentCount));
  return (
    <div className='flex items-center space-x-3'>
      <img
        src={`/${icon}`}
        alt={label}
        className='w-[24px] h-[24px] md:w-[24px] md:h-[24px]'
      />
      <span className='w-[72px] md:w-[86px] text-xs md:text-base text-black text-center'>
        {label}
      </span>
      <div className='w-40 md:w-48 h-4 md:h-5 flex border-2 border-black rounded-full overflow-hidden'>
        {Array.from({ length: segmentCount }).map((_, index) => (
          <div
            key={index}
            className={`flex-1 border-l border-black ${
              index < activeSegments ? color : 'bg-white'
            } ${index === 0 ? 'rounded-l-full' : ''} ${
              index === segmentCount - 1 ? 'rounded-r-full' : ''
            }`}
          />
        ))}
      </div>
    </div>
  );
}
