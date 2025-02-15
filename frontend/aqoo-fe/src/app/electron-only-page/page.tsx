'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchUser } from '@/services/authService';

export default function ElectronOnlyPage() {
  const router = useRouter();

  useEffect(() => {
    const checkFishAndOpenOverlay = async () => {
      const electronAPI = (window as any)?.electronAPI;
      if (!electronAPI) {
        console.warn('Electron API가 없습니다. 웹 환경이거나 preload 미설정일 수 있음');
        return;
      }

      // (1) 유저 정보 가져오기
      const user = await fetchUser(); 
      if (!user) {
        console.warn('유저 정보가 없습니다');
        return;
      }
      const fishPath = user.mainFishImage; // 예: "/fishName.png"

      // (2) fishPath 콘솔로 확인
      console.log('[ElectronOnlyPage] fishPath:', fishPath);

      // (3) openOverlay에 fishPath 인자를 넣어 호출
      electronAPI.openOverlay(fishPath);

      // (선택) 라우트 이동
      // router.replace('/main');
    };

    checkFishAndOpenOverlay();
  }, [router]);

  return <div>Electron 전용 페이지</div>;
}
