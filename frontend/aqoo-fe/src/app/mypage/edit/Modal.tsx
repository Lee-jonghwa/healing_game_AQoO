import React from "react";

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}

export default function Modal({ children, onClose, className }: ModalProps) {
  // 배경 클릭 시 onClose
  const handleBackdropClick = () => {
    onClose();
  };

  // 모달 내용 클릭 시 이벤트 버블링 차단
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div className={`bg-white p-6 rounded-lg shadow-lg relative ${className}`} onClick={handleContentClick}>
        {children}
        <button className="absolute top-3 right-3 text-gray-500" onClick={onClose}>
          ✖
        </button>
      </div>
    </div>
  );
}
