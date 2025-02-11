import { useState, useEffect } from "react";
import { UseFormSetValue } from "react-hook-form";

interface UseNicknameEditProps {
  initialNickname: string; // 기존 닉네임 값
  setValue?: UseFormSetValue<any>;
}

export default function useNicknameEdit({ initialNickname, setValue }: UseNicknameEditProps) {
  const [nickname, setNickname] = useState(initialNickname);
  const [isEdited, setIsEdited] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false); // 완료 버튼 클릭 여부

  // ✅ 초기 닉네임 설정 (API 데이터 불러온 후 업데이트)
  useEffect(() => {
    setNickname(initialNickname);
    if (setValue) {
      setValue("nickname", initialNickname);
    }
  }, [initialNickname, setValue]);

  // ✅ 닉네임 입력 변경 감지
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setNickname(newValue);
    setIsEdited(newValue !== initialNickname);
    setIsConfirmed(false);
  };

  // ✅ 완료 버튼 클릭 (닉네임 확정)
  const handleConfirm = () => {
    setIsEdited(false);
    setIsConfirmed(true);
  };

  return {
    nickname,
    isEdited,
    isConfirmed,
    handleChange,
    handleConfirm,
  };
}
