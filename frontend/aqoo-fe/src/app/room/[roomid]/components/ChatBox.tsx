"use client";

import { useEffect, useRef, useState } from "react";

import { getStompClient } from "@/lib/stompclient";

// 채팅 메시지 타입 (필요에 따라 ChatMessageDto를 사용해도 됩니다)
interface ChatMessage {
  roomId: string;
  sender: string;
  content: string;
  type: "CHAT" | "JOIN" | "LEAVE" | "READY";
}

interface ChatBoxProps {
  roomId: string;
  userName: string;
}

export default function ChatBox({ roomId, userName }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // 메시지 목록의 끝을 가리킬 ref
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 메시지가 업데이트될 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebSocket 구독: 채팅 메시지를 받음
  useEffect(() => {
    const client = getStompClient();
    if (client) {
      // ChatWebSocketController의 sendMessage 메서드가 "/topic/{roomId}" 로 메시지를 전송한다고 가정
      const subscription = client.subscribe(`/topic/${roomId}`, (messageFrame) => {
        const message: ChatMessage = JSON.parse(messageFrame.body);
        setMessages((prev) => [...prev, message]);
      });
      return () => subscription.unsubscribe();
    }
  }, [roomId]);

  // 메시지 전송 함수 (일반 사용자가 입력하는 채팅)
  const sendMessage = () => {
    if (newMessage.trim() === "") return;
    const client = getStompClient();
    if (client && client.connected) {
      const chatMessage: ChatMessage = {
        roomId,
        sender: userName,
        content: newMessage,
        type: "CHAT",
      };
      client.publish({
        destination: "/app/chat.sendMessage",
        body: JSON.stringify(chatMessage),
      });
      setNewMessage("");
    } else {
      console.error("STOMP client is not connected yet.");
    }
  };

  return (
    <div className="border rounded p-4 mt-6">
      <div className="h-64 overflow-y-auto mb-4 custom-scrollbar px-4">
        {messages.map((msg, index) =>
          msg.sender === "SYSTEM" ? (
            // 시스템 메시지는 가운데 정렬, 회색 텍스트, 이탤릭체 등으로 스타일링
            <div key={index} className="mb-2 text-center text-gray-500 italic">
              {msg.content}
            </div>
          ) : (
            // 일반 채팅 메시지: 본인의 메시지는 오른쪽, 다른 사람의 메시지는 왼쪽 정렬
            <div key={index} className={`mb-2 ${msg.sender === userName ? "text-right" : "text-left"}`}>
              <strong>{msg.sender}</strong>: {msg.content}
            </div>
          )
        )}
        {/* 이 빈 div에 ref를 연결하여 스크롤을 맨 아래로 이동시킵니다 */}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex">
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
          className="flex-grow border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          className="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
