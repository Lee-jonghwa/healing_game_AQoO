import { toast } from "react-toastify";

export const useToast = () => {
  const showToast = (message: string, type: "success" | "error" | "warning" | "info" = "success") => {
    const className = `custom-toast custom-toast-${type}`; // ✅ 동적으로 클래스 적용

    toast(message, {
      type,
      className, // ✅ `toastClassName` 대신 `className` 사용
      progressClassName: "custom-toast-progress",
    });
  };

  return { showToast };
};
