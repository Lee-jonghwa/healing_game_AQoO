interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}

export default function Modal({ children, onClose, className }: ModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`bg-white p-6 rounded-lg shadow-lg relative ${className}`}>
        {children}
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>
          ✖
        </button>
      </div>
    </div>
  );
}
