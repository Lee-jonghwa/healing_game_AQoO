'use client';

import { getStompClient } from '@/lib/stompclient';
import { authAtom } from '@/store/authAtom';
import { useEffect, useRef, useState } from 'react';
import { useRecoilValue } from 'recoil';

interface ChatMessage {
  roomId: string;
  sender: string;
  nickname?: string;
  content: string;
  type: 'CHAT' | 'JOIN' | 'LEAVE' | 'READY';
}

interface ChatBoxProps {
  roomId: string;
  userName: string;
  onNewMessage: (sender: string, message: string) => void;
}

export default function ChatBox({
  roomId,
  userName,
  onNewMessage,
}: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  // 현재 사용자 정보는 recoil의 authAtom에 정의된 User 인터페이스를 사용합니다.
  const { user: currentUser = { id: '', nickname: '' } } =
    useRecoilValue(authAtom);

  // 메시지 업데이트 시 스크롤을 맨 아래로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket 구독: 채팅 메시지 수신
  useEffect(() => {
    const client = getStompClient();
    if (client) {
      const subscription = client.subscribe(
        `/topic/${roomId}`,
        (messageFrame) => {
          const incoming: ChatMessage = JSON.parse(messageFrame.body);
          setMessages((prev) => [...prev, incoming]);

          if (incoming.type === 'CHAT') {
            // 현재 사용자의 메시지이면 authAtom에서 가져온 닉네임 사용
            const displayNickname =
              incoming.sender === userName
                ? currentUser.nickname
                : incoming.nickname || incoming.sender;
            onNewMessage(displayNickname, incoming.content);
          }
        }
      );
      return () => subscription.unsubscribe();
    }
  }, [roomId, onNewMessage, userName, currentUser]);

  // 메시지 전송 함수: 메시지를 보낼 때 authAtom의 nickname을 함께 전송
  const sendMessage = () => {
    if (newMessage.trim() === '') return;
    const client = getStompClient();
    if (client && client.connected) {
      const chatMessage: ChatMessage = {
        roomId,
        sender: userName,
        nickname: currentUser.nickname, // authAtom의 닉네임 사용
        content: newMessage,
        type: 'CHAT',
      };
      client.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(chatMessage),
      });
      setNewMessage('');
    } else {
      // 연결이 안 되어 있을 경우에도 currentUser.nickname을 사용
      onNewMessage(currentUser.nickname, newMessage);
    }
  };

  return (
    <div className='border rounded p-4 mt-6 bg-white w-full'>
      <div className='h-64 overflow-y-auto custom-scrollbar mb-4'>
        {messages.map((msg, index) =>
          msg.sender === 'SYSTEM' ? (
            <div key={index} className='mb-2 text-center text-gray-500 italic'>
              {msg.content}
            </div>
          ) : (
            <div
              key={index}
              className={`mb-2 ${
                msg.sender === userName ? 'text-right' : 'text-left'
              }`}
            >
              <strong>
                {msg.sender === userName
                  ? currentUser.nickname
                  : msg.nickname || msg.sender}
              </strong>
              : {msg.content}
            </div>
          )
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className='flex items-center border rounded-lg scrollbar-hide'>
        <input
          type='text'
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              sendMessage();
            }
          }}
          className='flex-grow p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
          placeholder='Type your message...'
        />
        <button
          onClick={sendMessage}
          className='w-[25%] p-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors'
        >
          Send
        </button>
      </div>
    </div>
  );
}
