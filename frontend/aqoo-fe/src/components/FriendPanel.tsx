"use client";

import { IoClose } from "react-icons/io5";

interface FriendPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FriendPanel({ isOpen, onClose }: FriendPanelProps) {
  if (!isOpen) return null; // ❌ isOpen이 false면 렌더링하지 않음

  return (
    <div className="absolute right-20 top-20 w-64 bg-white shadow-lg rounded-lg p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">친구</h2>
        <button onClick={onClose}>
          <IoClose size={20} />
        </button>
      </div>
      <ul className="mt-3">
        <li className="p-2 border-b">친구1</li>
        <li className="p-2 border-b">친구2</li>
        <li className="p-2 border-b">친구3</li>
      </ul>
    </div>
  );
}
