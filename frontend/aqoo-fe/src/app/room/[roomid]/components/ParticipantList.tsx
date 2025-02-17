
"use client";

import Image from "next/image";
import React from "react";


interface Participant {
  userName: string;
  ready: boolean;
  isHost: boolean;
  mainFishImage: string;
}

interface ParticipantListProps {
  users: Participant[]; // ✅ 'friends' 대신 'users'를 유지
  currentUser: string;
  currentIsHost: boolean;
  onKickUser: (userName: string) => void;
}

export default function ParticipantList({ users, currentUser, currentIsHost, onKickUser }: ParticipantListProps) {
  return (
    <div className="bg-white/70 border border-gray-300 rounded-lg shadow-lg p-4 z-10 w-[300px] h-[170px] overflow-auto custom-scrollbar">
      <h3 className="text-lg font-bold mb-2">참가자 리스트{` `}{users.length}</h3>
      <ul className="space-y-2">
        {users.map((user) => (
          <li key={user.userName} className="flex justify-between items-center px-4 py-2 border rounded bg-gray-50">
            <div className="text-gray-900 font-medium flex items-center space-x-2">
                <div className='w-10 h-10 bg-300 rounded-full scrollbar-hide'>
                  <img 
                    src={user.mainFishImage} 
                    alt="참가자대표물고기"  
                    className='w-full h-full object-contain rounded-full'
                  />
                </div>
                <div>

                  {user.userName} {user.isHost && '(방장)'}
                </div>
                
            </div>
            {user.ready && <span className="text-green-700 font-bold">Ready</span>}
            {currentIsHost && user.userName !== currentUser && (
              <button
                onClick={() => onKickUser(user.userName)}
                className="ml-2 px-2 py-1 bg-red-500 text-black rounded bg-white border border-black shadow-sm"
              >
                추방
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

