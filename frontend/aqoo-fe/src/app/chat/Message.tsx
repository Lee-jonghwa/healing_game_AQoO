// 유저가 보내는 메세지를 표시하는 컴포넌트

'use client';

import { ChatMessage } from "@/store/chatAtom";


interface MessageProps {
  message: ChatMessage;
}

export default function Message({ message }: MessageProps) {
  return (
    <div className="flex justify-end">
      <div className="bg-white border border-black px-4 py-2 rounded-lg shadow-md max-w-[80%]">
        <p className="text-right font-bold text-sm">{message.sender}</p>
        <p className="text-black">{message.text}</p>
      </div>
    </div>
  );
}
