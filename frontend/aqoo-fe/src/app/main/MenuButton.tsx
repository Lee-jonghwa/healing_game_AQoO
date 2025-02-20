"use client";

function MenuButton({
  icon,
  label,
  onClick,
  isActive,
  className = "",
}: {
  icon: string;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`${className} flex flex-col items-center justify-center p-1 rounded-lg shadow-md border border-gray-300 
      hover:bg-gray-200 ${isActive ? "bg-blue-300" : "hover:bg-gray-200"} 
      sm:w-16 sm:h-16 w-12 h-12`} // ✅ 반응형 크기 조정
    >
      <img src={icon} alt={label} className="sm:w-[32px] sm:h-[32px] w-[24px] h-[24px]" />
      <span className="text-xs sm:text-sm font-bold">{label}</span> {/* ✅ 모바일에서는 글자 작게 */}
    </button>
  );
}

export default MenuButton;
