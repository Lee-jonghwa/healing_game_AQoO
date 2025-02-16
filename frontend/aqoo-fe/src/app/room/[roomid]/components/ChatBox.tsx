'use client';

import { getStompClient } from '@/lib/stompclient';
import { useEffect, useRef, useState } from 'react';

// 채팅 메시지 타입 (필요에 따라 ChatMessageDto를 사용해도 됩니다)
interface ChatMessage {
  roomId: string;
  sender: string;
  content: string;
  type: 'CHAT' | 'JOIN' | 'LEAVE' | 'READY';
}

interface ChatBoxProps {
  roomId: string;
  userName: string;
  onNewMessage: (sender: string, message: string) => void;
}

export default function ChatBox({ roomId, userName, onNewMessage }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // 메시지 목록의 끝을 가리킬 ref
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 메시지가 업데이트될 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket 구독: 채팅 메시지를 받음
  useEffect(() => {
    const client = getStompClient();
    if (client) {
      // ChatWebSocketController의 sendMessage 메서드가 "/topic/{roomId}" 로 메시지를 전송한다고 가정
      const subscription = client.subscribe(
        `/topic/${roomId}`,
        (messageFrame) => {
          const message: ChatMessage = JSON.parse(messageFrame.body);
          setMessages((prev) => [...prev, message]);

          // onNewMessage호출(물고기말풍선)
          if (message.type === 'CHAT') {
            onNewMessage(message.sender, message.content)
          }
        }
      );
      return () => subscription.unsubscribe();
    }
  }, [roomId, onNewMessage]);

  // 메시지 전송 함수 (일반 사용자가 입력하는 채팅)
  const sendMessage = () => {
    if (newMessage.trim() === '') return;
    const client = getStompClient();
    if (client && client.connected) {
      const chatMessage: ChatMessage = {
        roomId,
        sender: userName,
        content: newMessage,
        type: 'CHAT',
      };
      client.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(chatMessage),
      });
      setNewMessage('');
    } else {
      console.error('STOMP client is not connected yet.');
      console.log(`🚀 [DEBUG] Sent message: ${userName}: ${newMessage}`);
      onNewMessage(userName, newMessage);
    }
  };

  return (
    <div className="border rounded p-4 mt-6 bg-white w-full">
      <div className="h-64 overflow-y-auto mb-4">
        {messages.map((msg, index) =>
          msg.sender === 'SYSTEM' ? (
            <div key={index} className="mb-2 text-center text-gray-500 italic">
              {msg.content}
            </div>
          ) : (
            <div
              key={index}
              className={`mb-2 ${
                msg.sender === userName ? 'text-right' : 'text-left'
              }`}
            >
              <strong>{msg.sender}</strong>: {msg.content}
            </div>
          )
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ✅ 입력 필드와 Send 버튼을 하나의 컨테이너에서 정렬 */}
      <div className="flex items-center border rounded-lg overflow-hidden">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              sendMessage();
            }
          }}
          className="flex-grow p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          className="w-[25%] p-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
