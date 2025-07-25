import React from "react";
import { SubmitHandler, UseFormHandleSubmit, UseFormRegisterReturn, UseFormSetValue } from "react-hook-form";
import useNicknameEdit from "@/hooks/useNicknameEdit";

import { ProfileFormInputs } from "@/types";

// variant: "dynamic"(입력창) | "static"(고정창) | "nickname"(닉네임 입력 필드 + 완료 버튼)
interface InputFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  register?: UseFormRegisterReturn;
  disabled?: boolean;
  variant?: "dynamic" | "static" | "nickname";
  setValue?: UseFormSetValue<ProfileFormInputs>;
  handleSubmit?: UseFormHandleSubmit<ProfileFormInputs>;
  onSubmit?: SubmitHandler<ProfileFormInputs>;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  type = "text",
  placeholder,
  register,
  disabled = false,
  variant = "dynamic",
  setValue,
  handleSubmit,
  onSubmit,
}) => {
  const variantClasses = { dynamic: "", static: "bg-gray-200", nickname: "" };

  const nicknameEdit = useNicknameEdit({
    initialNickname: placeholder || "",
    setValue: setValue ?? (() => {}), // ✅ 기본값을 빈 함수로 설정하여 오류 방지
  });

  const handleNicknameSubmit = onSubmit && handleSubmit ? handleSubmit(onSubmit) : undefined;

  return (
    <div>
      <label className="block text-gray-700 text-[13px] sm:text-lg sm:font-medium sm:mb-1">{label}</label>

      <div className="relative">
        {/* 입력 필드 */}
        <input
          type={type}
          value={variant === "nickname" ? nicknameEdit.nickname : placeholder}
          placeholder={placeholder}
          disabled={disabled}
          {...(register && variant !== "nickname" ? register : { onChange: nicknameEdit.handleChange })}
          className={`
          w-full px-[8px] sm:px-3 py-[4px] sm:py-2
          border border-gray-300 rounded-md text-[15px] sm:text-xl
          focus:outline-none focus:ring focus:ring-blue-200
          ${variantClasses[variant]}`}
        />

        {/* 완료 버튼 (닉네임이 변경되었을 때만 보임) */}
        {variant === "nickname" && nicknameEdit.isEdited && !nicknameEdit.isConfirmed && (
          <button
            type="button"
            onClick={() => {
              nicknameEdit.handleConfirm();
              if (handleNicknameSubmit) {
                handleNicknameSubmit(); // ✅ 미리 감싼 함수 실행
              }
            }}
            className="absolute top-1/2 right-1 -translate-y-1/2 
                     z-10 text-[10px] sm:text-lg bg-white px-1 sm:px-3 py-1 sm:py-1 border rounded-md shadow"
          >
            완료
          </button>
        )}
        {/* V 아이콘 (완료 버튼 클릭 후 보임 */}
        {variant === "nickname" && nicknameEdit.isConfirmed && (
          <span className="absolute top-1/2 right-2 -translate-y-1/2 text-green-500 font-bold text-xl">✔</span>
        )}
      </div>
    </div>
  );
};

export default InputField;
