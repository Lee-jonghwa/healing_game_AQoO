"use client";

import { Friend, Notification } from "@/types";
import axios, { AxiosResponse } from "axios";
import { useEffect, useState } from "react";

import Image from "next/image";
import axiosInstance from "@/services/axiosInstance";
import { fetchFriends } from "@/app/main/FriendsList";
import { useAuth } from "@/hooks/useAuth"; // ✅ 로그인된 유저 정보 가져오기
import { useRouter } from "next/navigation"; // ✅ next/navigation에서 import
import { useToast } from "@/hooks/useToast";

const customLoader = ({ src }: { src: string }) => src;

interface FriendRequest {
  notificationId: number;
  relationshipId: string;
}

export default function PushNotifications({
  onClose,
  setNewNotifications,
}: {
  onClose: () => void;
  setNewNotifications: (newNotifications: boolean) => void;
}) {
  const { showToast } = useToast();

  const { auth } = useAuth(); // ✅ 로그인된 사용자 정보 가져오기
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFriendRequestModal, setShowFriendRequestModal] = useState(false);
  const [selectedFriendRequest, setSelectedFriendRequest] = useState<FriendRequest | null>(null);

  const handleDelete = (id: number) => {
    console.log(id);
    setLoading(true);
    setError(""); // 이전 에러 초기화

    // 삭제 요청 보내기
    axiosInstance
      .post(`/notification/delete`, { notificationId: id })
      .then((response) => {
        console.log(response.data.message); // 삭제 성공 메시지 출력
        // 여기에서 알림 삭제 후 UI 업데이트 (예: 삭제된 알림을 상태에서 제거)
        refreshNotifications(); // 부모 컴포넌트의 알림 업데이트 함수 호출
      })
      .catch((error) => {
        console.error("❌ 알림 삭제 실패", error);
        setError("알림 삭제에 실패했습니다.");
      })
      .finally(() => setLoading(false));
  };

  const isFriendExists = async (relationshipId: number): Promise<boolean> => {
    console.log("비교 값 ", relationshipId);
    if (!auth.user?.id) {
      console.log("아이디 없음");
      return false; // ✅ 로그인되지 않은 경우 API 호출 안함
    }

    const friends = await fetchFriends(auth.user.id); // 친구 목록 가져오기
    if (!friends) return false; // API 호출 실패 시 false 반환

    return friends.some((friend: Friend) => friend.id === relationshipId); // 특정 ID가 존재하는지 확인
  };

  const refreshNotifications = () => {
    if (!auth.user?.id) return; // ✅ 로그인되지 않은 경우 API 호출 안함

    // ✅ 현재 로그인된 유저의 ID로 알림 가져오기
    axiosInstance
      .get(`/notification/${auth.user.id}`)
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
  };

  useEffect(() => {
    refreshNotifications();
  }, [auth.user?.id, setNewNotifications]); // ✅ 로그인한 유저 ID가 바뀌면 다시 호출

  // ✅ 읽음 처리 API 호출 함수
  const markNotificationsAsRead = async (unreadNotifs: Notification[]) => {
    if (unreadNotifs.length === 0) return; // 📌 안 읽은 알림이 없으면 요청 안 함

    try {
      await Promise.all(
        unreadNotifs.map((notif) => axiosInstance.post(`/notification/read`, { notificationId: notif.id }))
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
    <div
      className="relative w-[300px] h-[350px] sm:w-[400px] sm:h-[600px] bg-white bg-opacity-70 border border-black rounded-lg shadow-lg p-4 flex
    flex-col"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">알림</h2>
        <button onClick={onClose} className="text-xl font-bold hover:text-red-500">
          ✖
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">로딩 중...</p>
      ) : notifications.length === 0 ? (
        <p className="text-center text-gray-500 text-sm sm:text-base">최근 알림이 없습니다.</p>
      ) : (
        <div className="space-y-2 overflow-y-auto flex-grow scrollbar-hide">
          {notifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onFriendRequestClick={
                notif.type === "FRIEND REQUEST"
                  ? async () => {
                      const isFriend = await isFriendExists(Number(notif.data)); // isFriendExists가 Promise<boolean> 반환

                      if (!isFriend) {
                        setSelectedFriendRequest({ notificationId: notif.id, relationshipId: notif.data });
                        setShowFriendRequestModal(true);
                      } else {
                        showToast("이미 친구입니다.", "info"); // isFriend가 false일 때 알림 창 표시
                      }
                    }
                  : undefined
              }
              refreshNotifications={refreshNotifications} // 알림 목록을 다시 불러오는 함수 전달
              handleDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ✅ 친구 신청 모달 */}
      {showFriendRequestModal && selectedFriendRequest && (
        <FriendRequestModal
          relationshipId={selectedFriendRequest.relationshipId}
          notificationId={selectedFriendRequest.notificationId} // notif.id를 전달
          onClose={() => setShowFriendRequestModal(false)}
          handleDelete={handleDelete}
        />
      )}
    </div>
  );
}

// ✅ 날짜 변환 함수 (YYYY-MM-DD HH:mm 형식)
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// 🔹 알림 아이템 컴포넌트 수정
function NotificationItem({
  notification,
  onFriendRequestClick,
  refreshNotifications,
  handleDelete,
}: {
  notification: Notification;
  onFriendRequestClick?: () => void;
  refreshNotifications: () => void;
  handleDelete: (id: number) => void;
}) {
  const { type, message, status, data, createdAt, id } = notification;
  const [loading, setLoading] = useState(false); // 삭제 중 상태
  const [error, setError] = useState(""); // 에러 상태

  // ✅ 알림 타입별 아이콘 매핑
  const getIconSrc = (type: string) => {
    switch (type) {
      case "FRIEND REQUEST":
      case "FRIEND ACCEPT":
        return "/icon/friendIcon.png";
      case "GAME INVITE":
        return "/icon/gameIcon.png";
      case "FRIEND FISH":
        console.log(data);
        return data;
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
      className="relative h-auto p-3 pb-2 sm:p-3 sm:pl-1 bg-white border rounded-lg flex items-center space-x-1 sm:space-x-2 shadow cursor-pointer hover:bg-gray-100"
      onClick={onFriendRequestClick}
    >
      {/* X 버튼 (더 작은 크기, 우측 상단으로 더 가까이 이동) */}
      <button
        className="absolute top-1 right-1 w-5 h-5 flex rounded-full bg-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-700 focus:outline-none"
        onClick={(e) => {
          e.stopPropagation(); // 부모 클릭 이벤트 방지
          handleDelete(id); // X 버튼 클릭 시 삭제 함수 호출
        }}
      >
        <span className="text-lg font-bold">×</span>
      </button>
      <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
        <Image
          loader={customLoader}
          src={getIconSrc(type)}
          alt={type}
          width={40}
          height={40}
          className="object-contain"
        />
        {!status && <div className="absolute top-2 left-2 w-3 h-3 bg-yellow-400 rounded-full"></div>}
      </div>

      {/* ✅ GAME INVITE일 때 입장 버튼 포함 */}
      {type === "GAME INVITE" ? (
        <GameInviteNotification
          message={message}
          gameRoomId={data}
          createdAt={createdAt}
          notificationId={id}
          handleDelete={handleDelete}
        />
      ) : (
        <div>
          <div className="flex items-end space-x-4">
            <p className="font-bold sm:text-base text-xs">{getNotificationLabel(type)}</p>
            <p className="text-xs text-gray-400">{formatDate(createdAt)}</p> {/* 🔹 날짜 추가 */}
          </div>
          <p className="sm:text-sm text-xs text-gray-500">{message}</p>
        </div>
      )}
    </div>
  );
}

// 🔹 게임 초대 알림 (입장 버튼 추가)
function GameInviteNotification({
  message,
  gameRoomId,
  createdAt,
  notificationId,
  handleDelete,
}: {
  message: string;
  gameRoomId?: string;
  createdAt: string;
  notificationId: number;
  handleDelete: (id: number) => void;
}) {
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
    handleDelete(notificationId);
    router.push(gameUrl); // ✅ Next.js에서 페이지 이동
  };

  return (
    <div className="flex flex-col items-start justify-between w-full">
      <div className="flex items-end w-full mb-2s">
        <p className="sm:text-base text-xs font-bold text-red-500">게임 초대</p>
        <p className="text-xs text-gray-400 ml-5">{formatDate(createdAt)}</p>
      </div>
      <p className="sm:text-sm text-xs text-gray-500">{message}</p>
      {gameRoomId && (
        <button
          onClick={handleEnterGame}
          className="px-1 py-1 sm:px-3 sm:py-1 bg-blue-500 text-white text-xs rounded-md ml-auto mr-2 mt-2"
        >
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
    case "FRIEND FISH":
      return "물고기 거래";
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
function FriendRequestModal({
  notificationId,
  relationshipId,
  handleDelete,
  onClose,
}: {
  notificationId: number;
  relationshipId: string;
  handleDelete: (id: number) => void;
  onClose: () => void;
}) {
  const handleAcceptFriend = () => {
    console.log("친구 수락 코드 : ", relationshipId);

    axiosInstance
      .post(`/friends/accept`, { relationshipId: relationshipId })
      .then(() => {
        console.log("✅ 친구 요청 수락 성공");
        handleDelete(notificationId);
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
          <button onClick={handleAcceptFriend} className="px-4 py-2 bg-green-500 text-white rounded">
            수락
          </button>
        </div>
      </div>
    </div>
  );
}
