import { useEffect, useRef, useState } from 'react';
import { getStompClient } from '@/lib/stompclient';

interface ChatMessage {
  roomId: string;
  sender: string;
  content: string;
  type: 'CHAT' | 'JOIN' | 'LEAVE' | 'READY';
}

interface ChatBoxProps {
  roomId: string;
  userName: string;
}

export default function ChatBox({ roomId, userName }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebSocket 구독: 채팅 메시지를 받음
  useEffect(() => {
    const client = getStompClient();
    if (client) {
      const subscription = client.subscribe(`/topic/${roomId}`, (messageFrame) => {
        const message: ChatMessage = JSON.parse(messageFrame.body);
        setMessages((prev) => [...prev, message]);
      });
      return () => subscription.unsubscribe();
    }
  }, [roomId]);

  // 메시지가 업데이트되면 마지막 메시지 요소로 스크롤
  useEffect(() => {
    console.log("메세지 업데이트", messagesEndRef.current);
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  

  // 메시지 전송 함수
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
    }
  };

  return (
    <div className="border rounded p-4 mt-6">
      <div className="h-64 overflow-y-auto mb-4">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            <strong>{msg.sender}</strong>: {msg.content}
          </div>
        ))}
        {/* 스크롤을 위한 빈 요소 */}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex">
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
