'use client';

interface Participant {
  userName: string;
  ready: boolean;
  isHost: boolean;
  mainFishImage: string; // 대표 물고기 이미지 URL 추가
}

interface ParticipantListProps {
  users: Participant[];
  currentUser: string;
  currentIsHost: boolean;
  onKickUser: (userName: string) => void;
}

export default function ParticipantList({ users, currentUser, currentIsHost, onKickUser }: ParticipantListProps) {
  return (
    <div className="mb-4 w-[330px] bg-white shadow-md rounded-lg p-3">
      <h3 className="text-xl font-semibold mb-2 text-gray-900">참가자 리스트</h3>
      
      {/* 최대 높이 제한 + 스크롤 기능 */}
      <div className="max-h-[100px] overflow-y-auto">
        <ul className="space-y-2">
          {users.map((user) => (
            <li
              key={user.userName}
              className="flex justify-between items-center px-4 py-2 border rounded bg-gray-50"
            >
              <div className="flex items-center">
                {/* 참가자의 대표 물고기 이미지 */}
                <img
                  src={`${user.mainFishImage}`}
                  alt={`${user.userName}의 대표 물고기`}
                  className="w-10 h-10 rounded-full object-cover mr-2"
                />
                <span className="text-gray-900 font-medium">
                  {user.userName}{' '}
                  {user.isHost && (
                    <span className="ml-1 text-sm font-bold text-red-600">(방장)</span>
                  )}
                </span>
                {currentIsHost && user.userName !== currentUser && (
                  <button
                    onClick={() => onKickUser(user.userName)}
                    className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    추방
                  </button>
                )}
              </div>
              {user.ready && <span className="text-green-700 font-bold">Ready</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
