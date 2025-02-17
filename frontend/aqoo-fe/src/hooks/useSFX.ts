import { useCallback, useEffect, useState } from "react";

import { Howl } from "howler";
import { sfxVolumeState } from "@/store/soundAtom";
import { useRecoilValue } from "recoil";

export const useSFX = (initialSrc: string) => {
  const volume = useRecoilValue(sfxVolumeState) / 100; // 0~1 범위로 변환
  const [src, setSrc] = useState(initialSrc); // 소리 변경 가능하도록 상태 추가
  const [sound, setSound] = useState<Howl | null>(null);

  useEffect(() => {
    if (src) {
      const newSound = new Howl({ src: [src], volume });
      setSound(newSound);
    }
  }, [src, volume]); // src가 변경될 때마다 새 Howl 객체 생성

  const play = useCallback(() => {
    if (sound) {
      sound.play();
    }
  }, [sound]);

  return { play, setSrc }; // setSrc 반환하여 동적으로 소리 변경 가능
};
