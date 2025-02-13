"use client";

import axios, { AxiosResponse } from "axios";
import { useEffect, useState } from "react";

import Image from "next/image";
import { Notification } from "@/types";
import { useAuth } from "@/hooks/useAuth"; // ✅ 로그인된 유저 정보 가져오기
import { useRouter } from "next/navigation"; // ✅ next/navigation에서 import

const API_BASE_URL = "https://i12e203.p.ssafy.io/api/v1";

export default function PushNotifications({
   onClose, 
   setNewNotifications, 
  }: { 
    onClose: () => void; 
    setNewNotifications: (newNotifications: boolean) => void; 
  }) {
  const { auth } = useAuth(); // ✅ 로그인된 사용자 정보 가져오기
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFriendRequestModal, setShowFriendRequestModal] = useState(false);
  const [selectedFriendRequest, setSelectedFriendRequest] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.user?.id) return; // ✅ 로그인되지 않은 경우 API 호출 안함

    // ✅ 현재 로그인된 유저의 ID로 알림 가져오기
    axios
      .get(`${API_BASE_URL}/notification/${auth.user.id}`)
      .then((response: AxiosResponse<Notification[]>) => {
        console.log("🔔 알림 데이터:", response.data);
        setNotifications(response.data);

        // ✅ 안 읽은 알림들만 읽음 처리 API 호출
        const unreadNotifications = response.data.filter((notif) => notif.status === false);
        markNotificationsAsRead(unreadNotifications);
        setNewNotifications(false);
      })
      .catch((error) => {
        console.error("❌ 알림 불러오기 실패", error);
        setError("알림을 불러오는데 실패했습니다.");
      })
      .finally(() => setLoading(false));
  }, [auth.user?.id, setNewNotifications]); // ✅ 로그인한 유저 ID가 바뀌면 다시 호출

  // ✅ 읽음 처리 API 호출 함수
  const markNotificationsAsRead = async (unreadNotifs: Notification[]) => {
    if (unreadNotifs.length === 0) return; // 📌 안 읽은 알림이 없으면 요청 안 함

    try {
      await Promise.all(
        unreadNotifs.map((notif) => axios.post(`${API_BASE_URL}/notification/read`, { notificationId: notif.id }))
      );
      console.log("✅ 알림 읽음 처리 완료");

      // ✅ 상태 업데이트 (노란 점 제거)
      // setNotifications((prevNotifs) =>
      //   prevNotifs.map((notif) =>
      //     unreadNotifs.some((unread) => unread.id === notif.id)
      //       ? { ...notif, status: true } // ✅ 읽음 상태로 변경
      //       : notif
      //   )
      // );
    } catch (error) {
      console.error("❌ 알림 읽음 처리 실패", error);
    }
  };

  return (
    <div className="relative w-[400px] h-[600px] bg-white bg-opacity-70 border border-black rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">알림</h2>
        <button onClick={onClose} className="text-xl font-bold hover:text-red-500">
          ✖
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">로딩 중...</p>
      ) : notifications.length === 0 ? (
        <p className="text-center text-gray-500">최근 알림이 없습니다.</p>
      ) : (
        <div className="space-y-3 overflow-y-auto max-h-[500px] scrollbar-hide">
          {notifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onFriendRequestClick={
                notif.type === "FRIEND REQUEST"
                  ? () => {
                      setSelectedFriendRequest(notif.data || null);
                      setShowFriendRequestModal(true);
                    }
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* ✅ 친구 신청 모달 */}
      {showFriendRequestModal && selectedFriendRequest && (
        <FriendRequestModal relationshipId={selectedFriendRequest} onClose={() => setShowFriendRequestModal(false)} />
      )}
    </div>
  );
}
// 🔹 알림 아이템 컴포넌트 수정
function NotificationItem({
  notification,
  onFriendRequestClick,
}: {
  notification: Notification;
  onFriendRequestClick?: () => void;
}) {
  const { type, message, status, data } = notification;

  // ✅ 알림 타입별 아이콘 매핑
  const getIconSrc = (type: string) => {
    switch (type) {
      case "FRIEND REQUEST":
      case "FRIEND ACCEPT":
        return "/icon/friendIcon.png";
      case "GAME INVITE":
        return "/icon/gameIcon.png";
      case "FEED":
        return "/icon/feedIcon.png";
      case "CLEAN":
        return "/icon/cleanIcon.png";
      case "WATER":
        return "/icon/waterIcon.png";
      default:
        return "/icon/defaultIcon.png"; // 기본 아이콘
    }
  };

  return (
    <div
      className="relative p-3 bg-white border rounded-lg flex items-center space-x-3 shadow cursor-pointer hover:bg-gray-100"
      onClick={onFriendRequestClick}
    >
      <div className="relative flex items-center">
        <Image src={getIconSrc(type)} alt={type} width={32} height={32} className="w-8 h-8 " />
        {!status && <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></div>}
      </div>

      {/* ✅ GAME INVITE일 때 입장 버튼 포함 */}
      {type === "GAME INVITE" ? (
        <GameInviteNotification message={message} gameRoomId={data} />
      ) : (
        <div>
          <p className="font-bold">{getNotificationLabel(type)}</p>
          <p className="text-sm text-gray-500">{message}</p>
        </div>
      )}
    </div>
  );
}

// 🔹 게임 초대 알림 (입장 버튼 추가)
function GameInviteNotification({ message, gameRoomId }: { message: string; gameRoomId?: string }) {
  const router = useRouter(); // ✅ Next.js App Router 사용
  const { auth } = useAuth(); // ✅ 로그인한 유저 정보 가져오기

  const handleEnterGame = () => {
    if (!gameRoomId || !auth.user?.id) {
      console.error("❌ 게임방 ID 또는 유저 ID가 없음");
      return;
    }

    // ✅ 게임 입장 URL 생성
    const gameUrl = `https://i12e203.p.ssafy.io/room/${gameRoomId}?userName=${auth.user.id}`;

    console.log(`🎮 게임 입장 URL: ${gameUrl}`);
    router.push(gameUrl); // ✅ Next.js에서 페이지 이동
  };

  return (
    <div className="flex items-center justify-between w-full">
      <div>
        <p className="font-bold text-red-500">게임 초대</p>
        <p className="text-sm text-gray-500">{message}</p>
      </div>
      {gameRoomId && (
        <button onClick={handleEnterGame} className="px-3 py-1 bg-blue-500 text-white text-xs rounded-md">
          입장
        </button>
      )}
    </div>
  );
}

// 🔹 알림 타입 라벨 변환
const getNotificationLabel = (type: string) => {
  switch (type) {
    case "FRIEND REQUEST":
      return "친구 요청";
    case "FRIEND ACCEPT":
      return "친구 수락";
    case "GAME INVITE":
      return "게임 초대";
    case "FEED":
      return "어항의 먹이 상태";
    case "CLEAN":
      return "어항의 청소 상태";
    case "WATER":
      return "어항의 물 상태";
    default:
      return "알림";
  }
};

// 🔹 친구 요청 모달 컴포넌트
function FriendRequestModal({ relationshipId, onClose }: { relationshipId: string; onClose: () => void }) {
  const handleAcceptFriend = () => {
    console.log("친구 수락 코드 : ", relationshipId);

    axios
      .post(`${API_BASE_URL}/friends/accept`, { relationshipId: relationshipId })
      .then(() => {
        console.log("✅ 친구 요청 수락 성공");
        onClose();
      })
      .catch((error) => console.error("❌ 친구 요청 수락 실패", error));
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[300px]">
        <h3 className="text-lg font-bold mb-2">친구 신청</h3>
        <p className="text-gray-600">이 요청을 수락하시겠습니까?</p>
        <div className="flex justify-end space-x-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
            취소
          </button>
          {/* TODO 이미 친구면 수락버튼 못 누르게 해야 함 */}
          <button onClick={handleAcceptFriend} className="px-4 py-2 bg-green-500 text-white rounded">
            수락
          </button>
        </div>
      </div>
    </div>
  );
}
