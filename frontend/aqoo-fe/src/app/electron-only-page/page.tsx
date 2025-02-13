'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ElectronOnlyPage() {
  const router = useRouter();

  useEffect(() => {
    // Electron 환경 감지: preload 스크립트를 통해 전역 API가 노출되어 있다면
    const electronAPI = (window as any).electronAPI;
    if (electronAPI && typeof electronAPI.openOverlay === 'function') {
      // Electron 환경이면 오버레이 창을 띄우도록 요청
      electronAPI.openOverlay();
    } else {
      console.warn('이 기능은 Electron 환경에서만 사용할 수 있습니다.');
    }
  }, []);

  return (
    <div className='p-4'>
      <h1 className='text-2xl font-bold mb-4'>Electron 전용 페이지</h1>
      <p>이 페이지에서는 Electron 고유 기능을 사용합니다.</p>
      <button
        onClick={() => router.push('/')}
        className='mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
      >
        홈으로 돌아가기
      </button>
    </div>
  );
}
