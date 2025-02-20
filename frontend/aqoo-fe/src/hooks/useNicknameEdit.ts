import { useState, useEffect } from "react";
import { UseFormSetValue } from "react-hook-form";
import { ProfileFormInputs } from "@/types"; // ProfileFormInputs 타입 경로 확인

interface UseNicknameEditProps {
  initialNickname: string;
  setValue: UseFormSetValue<ProfileFormInputs>;
}

interface UseNicknameEditReturn {
  nickname: string;
  isEdited: boolean;
  isConfirmed: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleConfirm: () => void;
}

export default function useNicknameEdit({ initialNickname, setValue }: UseNicknameEditProps): UseNicknameEditReturn {
  const [nickname, setNickname] = useState(initialNickname);
  const [isEdited, setIsEdited] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false); // 완료 버튼 클릭 여부

  // ✅ 초기 닉네임을 useForm과 동기화
  useEffect(() => {
    if (initialNickname) {
      setNickname(initialNickname);
      setValue("nickname", initialNickname);
      setIsEdited(false); // 닉네임 바뀌고 완료버튼 비활성화
      setIsConfirmed(false);
    }
  }, [initialNickname, setValue]);

  // ✅ 닉네임 입력 변경 감지
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setNickname(newValue);
    setIsEdited(newValue !== initialNickname);
    setIsConfirmed(false);
    setValue("nickname", newValue);
  };

  // ✅ 완료 버튼 클릭 → useForm에 최종 반영
  const handleConfirm = () => {
    setIsEdited(false);
    setIsConfirmed(true);
    setValue("nickname", nickname);
  };

  return {
    nickname,
    isEdited,
    isConfirmed,
    handleChange,
    handleConfirm,
  };
}
