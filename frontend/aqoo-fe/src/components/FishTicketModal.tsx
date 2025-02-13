"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function FishTicketModal({
  onClose,
  level,
  fishTicket,
  refreshUserInfo,
  isFirstLogin, // ✅ 첫 로그인 여부 추가
}: {
  onClose: () => void;
  level: number;
  fishTicket: number; // ✅ fishTicket 추가
  refreshUserInfo: () => void; // ✅ 유저 정보 갱신 함수 추가
  isFirstLogin: boolean; // ✅ 첫 로그인 여부를 받아서 UI 조정
}) {
  const router = useRouter();
  const [step, setStep] = useState<"select" | "gacha">("select");
  const [fish, setFish] = useState<{ name: string; image: string } | null>(null);

  const [animationStep, setAnimationStep] = useState<"idle" | "shaking" | "reveal">("idle");

  const handleGacha = async () => {
    setStep("gacha"); // ✅ 결과 화면으로 이동
    setAnimationStep("shaking"); // ✅ 뽑기 캡슐 흔들리는 애니메이션 시작

    setTimeout(async () => {
      try {
        const response = await axios.get("https://i12e203.p.ssafy.io/api/v1/fish/gotcha", { withCredentials: true });

        if (response.data) {
          console.log("🎉 물고기 뽑기 성공:", response.data);

          setFish({
            name: response.data.fishName,
            image: response.data["imageUrl"],
          });

          console.log("이미지 경로 : ", fish?.image);

          setAnimationStep("reveal"); // ✅ 물고기 공개 애니메이션 실행

          // ✅ 첫 로그인일 경우, API 호출 (상태 변경 X)
          if (isFirstLogin) {
            try {
              await axios.post(
                "https://i12e203.p.ssafy.io/api/v1/users/tutorial-complete",
                {
                  userId: "user1", // auth.user.id로 변경 가능
                },
                { withCredentials: true }
              );

              console.log("✅ 첫 로그인 해제 API 호출 완료");
            } catch (error) {
              console.error("❌ 첫 로그인 해제 API 호출 실패:", error);
            }
          }
        }
      } catch (error) {
        console.error("❌ 물고기 뽑기 실패:", error);
      }
    }, 2000); // ✅ 2초 후 API 호출 실행 (뽑기 애니메이션 대기)
  };

  console.log("물고기 티켓 수 : ", fishTicket);

  const handleAddToFishTank = () => {
    refreshUserInfo(); // ✅ 유저 정보 갱신
    router.push("/mypage/fishtank");
  };

  const customLoader = ({ src }: { src: string }) => {
    return src; // ✅ 원본 URL 그대로 사용하도록 설정
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="relative bg-white border-[4px] border-black rounded-lg p-6 w-auto min-w-[500px] text-center shadow-lg">
        {/* 1️⃣ 물고기 뽑기 선택 화면 */}
        {step === "select" && (
          <>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 min-w-[360px] flex items-center justify-center text-center px-4 py-2 bg-white border-[2px] border-black rounded-md shadow-md">
              <Image src="/icon/levelupIcon.png" alt="level up" width={32} height={32} className="mr-2" />
              <h2 className="text-4xl font-bold tracking-widest text-black">물고기 티켓</h2>
              <Image src="/icon/levelupIcon.png" alt="level up" width={32} height={32} className="ml-2 scale-x-[-1]" />
            </div>

            {/* 물고기 얻기 설명 */}
            <p className="mt-4 text-lg d text-black whitespace-pre-line">
              <br />
              보유하고 있는 물고기 티켓 수
              <br />
              <span className="text-blue-500 text-lg">{fishTicket}</span> 개<br />
              <br />
              {fishTicket <= 0
                ? "물고기 티켓이 없어서 뽑을 수 없습니다! \n 티켓을 모아서 다시 도전해 보세요!"
                : isFirstLogin
                ? "물고기를 얻기 위해서는 물고기 티켓이 필요해요! \n 한 번 뽑아볼까요?"
                : "물고기를 그리거나 뽑을 수 있습니다!"}
            </p>
            {/* 선택 버튼 (티켓이 있을 때만 표시) */}
            {fishTicket > 0 && (
              <div className="flex justify-center space-x-6 mt-6">
                <button
                  className="w-[180px] py-3 bg-blue-200 border-[2px] border-black rounded-lg text-lg font-bold hover:bg-blue-300 transition"
                  onClick={handleGacha}
                >
                  🐠 물고기 뽑기
                </button>
                {!isFirstLogin && (
                  <button
                    className="w-[180px] py-3 bg-gray-200 border-[2px] border-black rounded-lg text-lg font-bold hover:bg-gray-300 transition"
                    onClick={() => router.push("/custom")}
                  >
                    🎨 물고기 그리기
                  </button>
                )}
              </div>
            )}

            {/* 닫기 버튼 */}
            {!isFirstLogin && (
              <button
                className="mt-6 px-6 py-2 bg-red-500 text-white border-[3px] border-black rounded-lg text-lg font-bold hover:bg-red-600 transition"
                onClick={onClose}
              >
                닫기
              </button>
            )}
          </>
        )}

        {step === "gacha" && (
          <>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 min-w-[350px] flex items-center justify-center text-center px-4 py-2 bg-white border-[2px] border-black rounded-md shadow-md">
              <Image src="/icon/levelupIcon.png" alt="level up" width={32} height={32} className="mr-2" />
              <h2 className="text-4xl font-bold tracking-widest text-black">물고기 뽑기</h2>
              <Image src="/icon/levelupIcon.png" alt="level up" width={32} height={32} className="ml-2 scale-x-[-1]" />
            </div>

            <div className="flex flex-col items-center">
              {/* 🔹 뽑기 캡슐 흔들리는 애니메이션 */}
              {animationStep === "shaking" && (
                <>
                  <div className="w-40 h-40 flex items-center justify-center animate-shake">
                    <Image src="/icon/gachaCapsuleIcon.png" alt="gachacapsule" width={120} height={120} />
                  </div>
                  <p>뽑는 중 ...</p>
                </>
              )}

              {/* 🔹 물고기 공개 애니메이션 */}
              {animationStep === "reveal" && fish && (
                <>
                  <div className="relative flex flex-col items-center justify-center animate-fishGrow p-4">
                    {/* 후광 효과 */}
                    <div className="absolute inset-0 flex items-center justify-center mb-16">
                      <div className="w-[140px] h-[140px] bg-yellow-400 opacity-70 rounded-full blur-2xl "></div>
                    </div>

                    {/* 물고기 이미지 */}
                    <Image
                      loader={customLoader}
                      src={fish.image}
                      alt={fish.name}
                      width={100}
                      height={100}
                      className="relative w-36 my-8"
                      layout="intrinsic"
                      unoptimized
                    />

                    <p className="mt-2 text-2xl text-center">
                      신규! <strong>{fish.name}</strong> 을(를) 획득!
                    </p>
                    <p className="mt-4 text-lg whitespace-pre-line">
                      {isFirstLogin && "물고기를 뽑았다면 내 어항에 추가해줘야 해요! \n 어항 관리에 가볼까요?"}
                    </p>
                  </div>
                  <div className="flex gap-4 mt-8 justify-center">
                    <button
                      onClick={() => {
                        onClose(); // ✅ 모달 닫기
                        handleAddToFishTank(); // ✅ 첫 로그인 해제 및 이동
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                    >
                      어항에 추가
                    </button>
                    {!isFirstLogin && (
                      <button onClick={onClose} className="px-4 py-2 bg-gray-300 border rounded-lg">
                        메인 화면으로
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
