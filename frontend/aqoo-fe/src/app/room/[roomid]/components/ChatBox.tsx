"use client";

import { getStompClient } from '@/lib/stompclient';
import { useEffect, useRef, useState } from 'react';
import { useSFX } from "@/hooks/useSFX";

interface ChatMessage {
  roomId: string;
  sender: string;
  nickname?: string;
  content: string;
  type: "CHAT" | "JOIN" | "LEAVE" | "READY";
}

interface ChatBoxProps {
  roomId: string;
  // API에서 받아온 채팅방 멤버 정보를 담은 배열, 각 항목은 { userName, nickname } 등의 정보를 포함합니다.
  users: { userName: string; nickname: string }[];
  currentUser: { id: string; nickname: string; level?: number };
  onNewMessage: (sender: string, message: string) => void;
}

export default function ChatBox({ roomId, users, currentUser, onNewMessage }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { play: playModal } = useSFX("/sounds/clickeffect-02.mp3"); // 버튼 누를 때 효과음


  // 메시지가 업데이트될 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebSocket 구독: 채팅 메시지 수신
  useEffect(() => {
    const client = getStompClient();
    if (client) {
      const subscription = client.subscribe(`/topic/${roomId}`, (messageFrame) => {
        const incoming: ChatMessage = JSON.parse(messageFrame.body);
        setMessages((prev) => [...prev, incoming]);

        if (incoming.type === "CHAT") {
          // lookup: 현재 사용자인 경우 authAtom의 nickname 사용,
          // 그 외에는 전달된 메시지의 nickname이 있으면 사용하고, 없으면 users 배열에서 찾아봅니다.
          const displayNickname =
            incoming.sender === currentUser.id
              ? currentUser.nickname
              : incoming.nickname || users.find((u) => u.userName === incoming.sender)?.nickname || incoming.sender;
          onNewMessage(displayNickname, incoming.content);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [roomId, onNewMessage, currentUser, users]);

  // 메시지 전송 함수: 메시지를 보낼 때 currentUser.nickname을 함께 전송
  const sendMessage = () => {
    if (newMessage.trim() === "") return;
    const client = getStompClient();
    if (client && client.connected) {
      const chatMessage: ChatMessage = {
        roomId,
        sender: currentUser.id,
        nickname: currentUser.nickname,
        content: newMessage,
        type: "CHAT",
      };
      client.publish({
        destination: "/app/chat.sendMessage",
        body: JSON.stringify(chatMessage),
      });
      setNewMessage("");
    } else {
      onNewMessage(currentUser.nickname, newMessage);
    }

  };

  return (
    <div className="sm:border rounded sm:p-3 p-1 sm:bg-white flex flex-col w-full h-full ">
      <div className="flex-grow overflow-y-auto min-h-0 sm:p-4 p-2 custom-scrollbar">
        {messages.map((msg, index) => {
          if (msg.sender === "SYSTEM") {
            return (
              <div key={index} className="mb-2 text-center text-gray-500 italic">
                {msg.content}
              </div>
            );
          }
          const displayNickname =
            msg.sender === currentUser.id
              ? currentUser.nickname
              : msg.nickname || users.find((u) => u.userName === msg.sender)?.nickname || msg.sender;
          return (
            <div key={index} className={`mb-4 ${msg.sender === currentUser.id ? "text-right" : "text-left"}`}>
              {msg.sender !== currentUser.id && (
                <p className="sm:text-sm text-xs sm:text-gray-600 text-gray-100 mb-2"> {displayNickname} </p>
              )}
              <span className="sm:text-base text-sm bg-gray-100 p-2">{msg.content}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex items-center  rounded-lg scrollbar-hide 0">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              sendMessage();
            }
          }}
          className="flex-grow p-3 focus:outline-none focus:shadow-sm bg-gray-50 sm:text-sm text-xs"
          placeholder="채팅을 입력해 주세요"
        />
        <button
          onClick={() => {
            playModal();
            sendMessage()}}
          className='w-[25%] p-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors'
        >
          보내기
        </button>
      </div>
    </div>
  );
}
