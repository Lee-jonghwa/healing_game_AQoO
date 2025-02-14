'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchUser } from '@/services/authService';  // 실제 경로에 맞게 import

export default function ElectronOnlyPage() {
  const router = useRouter();

  useEffect(() => {
    const fetchAndOpenOverlay = async () => {
      try {
        const user = await fetchUser();  // authService.fetchUser 호출
        if (!user) {
          console.warn('유저 정보가 없습니다. 로그인 필요');
          // 로그인 화면 등으로 이동할 수도 있음
          router.replace('/');
          return;
        }

        // 사용자 정보에서 mainFishImage 추출
        const { mainFishImage } = user;

        // Electron API가 있는지 확인
        const electronAPI = (window as any)?.electronAPI;
        if (electronAPI && typeof electronAPI.openOverlay === 'function') {
          console.log('openOverlay 호출 시작');
          // mainFishImage가 있다면 넘겨주고, 없으면 대체 경로 전달
          electronAPI.openOverlay(mainFishImage || '/images/default-fish.png');
        } else {
          console.warn('Electron API를 찾을 수 없습니다. 웹 환경이거나 preload 미설정일 수 있습니다.');
        }

        // 오버레이 띄운 뒤, 메인 페이지로 라우팅
        router.replace('/main');
      } catch (error) {
        console.error('오류 발생:', error);
        // 에러 처리 후, 다른 페이지로 리다이렉트하거나 알림 표시 가능
        router.replace('/');
      }
    };

    fetchAndOpenOverlay();
  }, [router]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Electron 전용 페이지</h1>
      <p>이 페이지에서는 Electron 고유 기능을 사용합니다.</p>
      <button
        onClick={() => router.push('/')}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        홈으로 돌아가기
      </button>
    </div>
  );
}
