'use client';

import { getStompClient } from '@/lib/stompclient';
import { authAtom } from '@/store/authAtom';
import { useEffect, useRef, useState } from 'react';
import { useRecoilValue } from 'recoil';

export interface ChatMessage {
  roomId: string;
  sender: string;
  nickname?: string;
  content: string;
  type: 'CHAT' | 'JOIN' | 'LEAVE' | 'READY';
}

export interface Friend {
  id: number;
  friendId: string;
  nickname: string;
  level: number;
  mainFishImage: string | null;
}

interface ChatBoxProps {
  roomId: string;
  userName: string;
  friendList: Friend[]; // 친구 목록을 prop으로 전달
  onNewMessage: (sender: string, message: string) => void;
}

export default function ChatBox({
  roomId,
  userName,
  friendList,
  onNewMessage,
}: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  // authAtom에서 현재 사용자 정보를 가져옵니다.
  const { user: currentUser = { id: '', nickname: '' } } =
    useRecoilValue(authAtom);

  // 메시지가 업데이트될 때마다 스크롤을 맨 아래로 이동
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
            let displayNickname: string;
            if (incoming.sender === userName) {
              displayNickname = currentUser.nickname;
            } else {
              const friend = friendList.find(
                (f) => f.friendId === incoming.sender
              );
              // 무조건 nickname을 사용 (fallback 없이)
              displayNickname = friend
                ? friend.nickname
                : incoming.nickname || '';
            }
            onNewMessage(displayNickname, incoming.content);
          }
        }
      );
      return () => subscription.unsubscribe();
    }
  }, [roomId, onNewMessage, userName, currentUser, friendList]);

  // 메시지 전송 함수: 메시지 전송 시 authAtom의 nickname을 함께 전송
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
                  : friendList.find((f) => f.friendId === msg.sender)
                      ?.nickname || msg.nickname}
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
