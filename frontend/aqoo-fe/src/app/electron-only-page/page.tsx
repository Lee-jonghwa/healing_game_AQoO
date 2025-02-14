'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ElectronOnlyPage() {
  const router = useRouter();

  useEffect(() => {
    const electronAPI = (window as any)?.electronAPI;
    if (electronAPI && typeof electronAPI.openOverlay === 'function') {
      console.log('openOverlay 호출 시작');

      // 예: 유저의 대표물고기 이미지 경로 (실제 경로를 불러와야 함)
      const userFishPath = '/path/to/user-fish.png';
      
      // 오버레이 창을 띄우면서 fishPath를 넘겨줌
      electronAPI.openOverlay(userFishPath);

      // 오버레이 띄운 뒤 메인 페이지로 라우팅
      router.replace('/main');
    } else {
      console.warn('Electron API를 찾을 수 없습니다. 일반 웹 환경이거나, preload 미설정일 수 있습니다.');
    }
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
