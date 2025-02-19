'use client';

import { usePathname, useRouter } from "next/navigation";
import { useRecoilState } from "recoil";
import { getStompClient } from "@/lib/stompclient";
import HowToPlayModal from "./HowToPlay";
import { useAuth } from '@/hooks/useAuth';
import { bgMusicVolumeState, sfxVolumeState } from '@/store/soundAtom';
import { Settings, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [bgMusicVolume, setBgMusicVolume] = useRecoilState(bgMusicVolumeState);
  const [sfxVolume, setSfxVolume] = useRecoilState(sfxVolumeState);
  const { auth, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // 현재 경로 확인

  // 배경음 & 효과음 개별 ON/OFF 상태 추가
  const [isBgOn, setIsBgOn] = useState(bgMusicVolume > 0);
  const [isSfxOn, setIsSfxOn] = useState(sfxVolume > 0);

  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  useEffect(() => {
    if (
      typeof navigator !== 'undefined' &&
      navigator.userAgent.includes('Electron')
    ) {
      setIsElectron(true);
    }
  }, []);

  // 배경음악 ON/OFF 토글
  const toggleBgMusic = () => {
    setIsBgOn(!isBgOn);
    setBgMusicVolume(isBgOn ? 0 : 50); // OFF 시 0, ON 시 50%
  };

  // 효과음 ON/OFF 토글
  const toggleSfx = () => {
    setIsSfxOn(!isSfxOn);
    setSfxVolume(isSfxOn ? 0 : 50); // OFF 시 0, ON 시 50%
  };

  // 로고 클릭 핸들러
  const handleLogoClick = () => {
    if (pathname.startsWith('/room')) {
      // 채팅방에서 로고 클릭 시 채팅방 나감 API 호출
      const pathParts = pathname.split('/');
      const roomId = pathParts[2] || '';
      const client = getStompClient();
      if (client && client.connected && roomId) {
        client.publish({
          destination: '/app/chat.leaveRoom',
          body: JSON.stringify({ roomId, sender: auth?.user?.id || '' }),
        });
        console.log('chat.leaveRoom API 호출됨', {
          roomId,
          sender: auth?.user?.id || '',
        });
      }
      router.replace('/main');
    } else {
      router.push(auth.isAuthenticated ? '/main' : '/');
    }
  };

  // 로그아웃 함수
  const handleLogout = async () => {
    try {
      await logout();
      setIsSettingsOpen(false);
      router.push('/user/login');
    } catch (error) {
      console.error('로그아웃 실패', error);
    }
  };

  return (
    <>
      <nav className='absolute top-4 left-4 z-10 flex justify-between w-full px-10 pointer-events-none'>
        {/* 🏠 로고: 클릭 시 handleLogoClick 실행 */}
        <button onClick={handleLogoClick}>
          <span className='pointer-events-auto text-white text-5xl hover:text-yellow-300'>
            AQoO
          </span>
        </button>

        {/* 안내창 테스트 */}
        <div className="flex gap-3">
          <img
            src={"/icon/howtoplayicon.png"}
            width={45}
            onClick={() => setIsHowToPlayOpen(true)}
            className="pointer-events-auto p-2 bg-white/30 rounded-full hover:bg-white/50"
          />

          {/* ⚙️ 설정 버튼 */}
          <button
            className="pointer-events-auto p-2 bg-white/30 rounded-full hover:bg-white/50"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="w-6 h-6 text-fwhite" />
          </button>
        </div>
      </nav>

      {isHowToPlayOpen && <HowToPlayModal isOpen={isHowToPlayOpen} onClose={() => setIsHowToPlayOpen(false)} />}
      {/* 🎛️ 설정 모달 */}
      {isSettingsOpen && (
        <div
          className='fixed inset-0 flex items-center justify-center bg-black/50 z-50'
          onClick={() => setIsSettingsOpen(false)} // 바깥 클릭 시 모달 닫기
        >
          <div
            className='bg-white p-6 rounded-lg shadow-lg w-80'
            onClick={(e) => e.stopPropagation()} // 내부 클릭 시 이벤트 전파 방지
          >
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-xl font-semibold'>설정</h2>
              <button onClick={() => setIsSettingsOpen(false)}>
                <X className='w-5 h-5' />
              </button>
            </div>

            {/* 배경음악 조절 */}
            <div className='mb-4'>
              <label className='block text-sm font-medium flex justify-between items-center'>
                배경음악
                <button
                  className={`p-2 rounded-md ${
                    isBgOn ? 'bg-green-500' : 'bg-red-500'
                  } text-white`}
                  onClick={toggleBgMusic}
                >
                  {isBgOn ? 'ON' : 'OFF'}
                </button>
              </label>
              <input
                type='range'
                min='0'
                max='100'
                value={bgMusicVolume}
                onChange={(e) => setBgMusicVolume(Number(e.target.value))}
                className='w-full'
                disabled={!isBgOn} // OFF 상태면 비활성화
              />
              <span className='text-sm'>{bgMusicVolume}%</span>
            </div>

            {/* 효과음 조절 */}
            <div className='mb-4'>
              <label className='block text-sm font-medium flex justify-between items-center'>
                효과음
                <button
                  className={`p-2 rounded-md ${
                    isSfxOn ? 'bg-green-500' : 'bg-red-500'
                  } text-white`}
                  onClick={toggleSfx}
                >
                  {isSfxOn ? 'ON' : 'OFF'}
                </button>
              </label>
              <input
                type='range'
                min='0'
                max='100'
                value={sfxVolume}
                onChange={(e) => setSfxVolume(Number(e.target.value))}
                className='w-full'
                disabled={!isSfxOn} // OFF 상태면 비활성화
              />
              <span className='text-sm'>{sfxVolume}%</span>
            </div>

            {/* Electron 환경이 아닐 때만 데스크탑 앱 다운로드 버튼 노출 */}
            {!isElectron && (
              <a
                href='https://i12e203.p.ssafy.io/downloads/AQoO_Installer.exe'
                download
                className='w-full inline-block text-center bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mb-4'
              >
                데스크탑 앱 다운로드
              </a>
            )}

            {/* 로그아웃 버튼 */}
            <button
              className='w-full bg-red-500 text-white p-2 rounded hover:bg-red-600'
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </div>
        </div>
      )}
    </>
  );
}
