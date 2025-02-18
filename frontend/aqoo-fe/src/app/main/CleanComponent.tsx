"use client";

import { HAND_CONNECTIONS, Hands } from "@mediapipe/hands"; // 손 인식을 위한 라이브러리
import axios, { AxiosResponse } from "axios";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils"; // 손 랜드마크 그리기 라이브러리
import { useEffect, useRef, useState } from "react";

import { Camera } from "@mediapipe/camera_utils"; // 카메라 사용 라이브러리
import axiosInstance from "@/services/axiosInstance";
import { useAuth } from "@/hooks/useAuth"; // ✅ 로그인 정보 가져오기
import { useSFX } from "@/hooks/useSFX";

const PALM_IMAGE_SRC = "/cleanIcon.png";

export default function CleanComponent({
  onClose,
  onCleanSuccess, // ✅ 어항 상태 업데이트를 위한 콜백
  handleIncreaseExp, // ✅ 경험치 증가 함수 추가
  aquariumId, // ✅ aquariumId를 props로 추가
}: {
  onClose: () => void;
  onCleanSuccess: () => void; // ✅ 어항 상태 & 유저 경험치 업데이트 요청
  handleIncreaseExp: (earnedExp: number) => Promise<void>; // ✅ 추가
  aquariumId: number; // ✅ `aquariumId`를 필수 prop으로 설정
}) {
  const { auth } = useAuth(); // ✅ 로그인한 유저 정보 가져오기

  const { play: playClean } = useSFX("/sounds/창문닦기.mp3");
  const { play: playClear } = useSFX("/sounds/성공알림-01.mp3");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 오류 메시지 저장
  const [error, setError] = useState<string | null>(null);
  // 현재 선택된 제스처(손 흔들기 / 주먹 쥐기)
  const [selectedGesture, setSelectedGesture] = useState<"handMotion" | "rockGesture" | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false); // 📌 카메라 준비 상태 추가

  // 좌우 반전 여부
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  // 현재 선택된 제스처의 참조 처리
  const selectedGestureRef = useRef<"handMotion" | "rockGesture" | null>(null); // 🔥 추가

  const [palmImage, setPalmImage] = useState<HTMLImageElement | null>(null);

  const startCameraAndHandRecognition = async () => {
    if (!videoRef.current) {
      console.error("🚨 videoRef가 초기화되지 않았습니다.");
      return;
    }
    if (!canvasRef.current) {
      console.error("🚨 canvasRef가 초기화되지 않았습니다.");
      return;
    }
  };

  // 청소 왔다갔다 횟수
  const count = useRef<number>(0);
  const [motionCount, setMotionCount] = useState<number>(0);

  // 손이 좌우로 움직였는지 추적
  const motionData = useRef<{ startX: number | null; movedLeft: boolean; movedRight: boolean }>({
    // 손의 초기 위치 저장
    startX: null,
    // 좌우로 움직임 여부 저장
    movedLeft: false,
    movedRight: false,
  });

  useEffect(() => {
    const img = new Image();
    img.src = PALM_IMAGE_SRC;
    // 이미지 로드가 끝나면 상태에 저장
    img.onload = () => {
      setPalmImage(img);
    };
    img.onerror = () => {
      console.error("손바닥 이미지 로드 실패");
    };
  }, []);

  useEffect(() => {
    let hands: Hands | null = null;
    let camera: Camera | null = null;
    let isMounted = true; // unmount 체크용 플래그

    const startCameraAndHandRecognition = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const videoElement = videoRef.current;
      const canvasElement = canvasRef.current;
      const canvasCtx = canvasElement.getContext("2d");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoElement.srcObject = stream;

        videoElement.onloadedmetadata = () => {
          videoElement.play();
          canvasElement.width = 280;
          canvasElement.height = 200;

          hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
          });

          hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7,
          });

          hands.onResults((results) => {
            if (!isMounted || !canvasCtx) return; // ✅ 컴포넌트가 언마운트되었으면 실행하지 않음
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

            // 미러모드 적용
            if (isMirrored) {
              canvasCtx.save();
              canvasCtx.translate(canvasElement.width, 0);
              canvasCtx.scale(-1, 1);
            }

            // 웹캠 영상 그리기
            if (results.image) {
              canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
            }

            // canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

            if (results.multiHandLandmarks) {
              for (const landmarks of results.multiHandLandmarks) {
                // 랜드마크에 선 추가
                // drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                //   color: "#00FF00",
                //   lineWidth: 2,
                // });
                // drawLandmarks(canvasCtx, landmarks, {
                //   color: "#FF0000",
                //   lineWidth: 0.5,
                // });

                // 🏷️ 주요 랜드마크에 캡션 추가
                // labelLandmarks(canvasCtx, landmarks);

                detectHandMotion(landmarks);
              }
            }

            // 손바닥 이미지 테스트
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
              const landmarks = results.multiHandLandmarks[0];

              // Bounding box 버전
              drawPalmOverlay(canvasCtx, canvasElement, landmarks, palmImage);

              // 단일 랜드마크(Wrist)에 이미지 찍어보기
              // const wrist = landmarks[0];
              // drawImageAtPoint(canvasCtx, canvasElement, wrist.x, wrist.y, palmImage);
            }

            if (isMirrored) {
              canvasCtx.restore();
            }
          });

          camera = new Camera(videoElement, {
            onFrame: async () => {
              if (!isMounted) return;
              if (!hands) return;
              await hands.send({ image: videoElement });
            },
          });

          camera.start().then(() => {
            setIsCameraReady(true); // 📌 카메라가 준비되면 로딩 해제
          });
        };
      } catch (err) {
        setIsAlternativeMode(true);
        setError("손 인식을 초기화하는 중 문제가 발생했습니다.");
        console.error("Error initializing hand recognition:", err);
      }
    };

    startCameraAndHandRecognition();

    return () => {
      isMounted = false;
      if (camera) {
        camera.stop();
        camera = null;
      }
      if (hands) {
        hands.close();
        hands = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null; // ✅ 비디오 스트림 해제
      }
    };
  }, [isMirrored, palmImage]);

  function detectHandMotion(landmarks: any) {
    const wrist = landmarks[0];
    const currentX = wrist.x;

    const sensitivity = 0.1;
    const now = Date.now();
    if (motionData.current.startX === null) {
      motionData.current.startX = currentX;
      return; // 초기값 설정 후 바로 리턴
    }

    const deltaX = currentX - motionData.current.startX;

    if (deltaX > sensitivity && !motionData.current.movedRight) {
      motionData.current.movedRight = true;
      motionData.current.startX = currentX;
    }
    if (deltaX < -sensitivity && !motionData.current.movedLeft) {
      motionData.current.movedLeft = true;
      motionData.current.startX = currentX;
    }

    if (motionData.current.movedLeft && motionData.current.movedRight) {
      playClean();
      count.current += 1;
      setMotionCount(count.current);

      motionData.current = {
        startX: currentX,
        movedLeft: false,
        movedRight: false,
      };
    }

    if (count.current === 3) {
      alert("청소에 성공했어요! 🐟");
      playClear();
      motionData.current = { startX: null, movedLeft: false, movedRight: false };
      count.current = 0;
      handleCleanSuccess();
    }
  }

  function drawPalmOverlay(
    canvasCtx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    landmarks: { x: number; y: number }[],
    image: HTMLImageElement | null
  ) {
    if (!image) return;

    // landmark 중 x,y 최소/최대값 구해서 bounding box 계산
    let minX = 1,
      maxX = 0,
      minY = 1,
      maxY = 0;

    for (const { x, y } of landmarks) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    // 중앙 좌표 (정규화된 값 0~1)
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    // 손바닥 너비/높이 (정규화)
    const boxWidth = maxX - minX;
    const boxHeight = maxY - minY;

    // 화면 좌표로 전환(canvas, width, height 곱)
    const pxCenterX = centerX * canvas.width;
    const pxCenterY = centerY * canvas.height;
    // 손바닥 크기를 적당히 사용해 이미지 스케일 결정
    // 너비, 높이 중 더 큰 쪽 기준으로
    const PalmSize = Math.max(boxWidth, boxHeight);
    const pxSize = PalmSize * Math.max(canvas.width, canvas.height);

    // 이미지 비율 유지하며 그리기
    const aspect = image.width / image.height;
    let drawW, drawH;
    if (aspect > 1) {
      // 가로가 더 긴 이미지
      drawW = pxSize;
      drawH = pxSize / aspect;
    } else {
      // 세로가 더 긴 이미지
      drawH = pxSize;
      drawW = pxSize * aspect;
    }

    // 미러모드 적용
    const drawX = pxCenterX - drawW / 2;
    const drawY = pxCenterY - drawH / 2;

    // console.log("손바닥 오버레이:", { drawX, drawY, drawW, drawH, pxCenterX, pxCenterY });

    // 실제 그리기
    canvasCtx.drawImage(image, drawX, drawY, drawW, drawH);
  }

  function drawImageAtPoint(
    canvasCtx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    normX: number,
    normY: number,
    image: HTMLImageElement
  ) {
    const pxX = normX * canvas.width;
    const pxY = normY * canvas.height;
    const size = 50;
    canvasCtx.drawImage(image, pxX - size / 2, pxY - size / 2, size, size);
    // canvasCtx.fillRect(pxY - 15, pxX - 15, 30, 30);
  }

  async function handleCleanSuccess() {
    try {
      // ✅ 1. 어항 청소 API 호출
      await axiosInstance.post(`/aquariums/update`, {
        aquariumId: aquariumId,
        type: "clean",
        data: "",
      });

      setMotionCount(0);
      // ✅ 2. 경험치 10 증가 및 레벨업 감지
      await handleIncreaseExp(20);

      // ✅ 3. 어항 상태 & 유저 정보 업데이트 요청
      onCleanSuccess();

      // ✅ 4. 모달 닫기
      onClose();
    } catch (error) {
      console.error("❌ 청소 또는 경험치 지급 실패", error);
    }
  }

  const labelLandmarks = (canvasCtx: CanvasRenderingContext2D, landmarks: any) => {
    canvasCtx.fillStyle = "yellow"; // 캡션 색상
    canvasCtx.font = "14px Arial"; // 캡션 폰트

    const names = ["Wrist", "Thumb Tip", "Index Tip", "Middle Tip", "Ring Tip", "Pinky Tip"];

    const indices = [0, 4, 8, 12, 16, 20];

    for (let i = 0; i < names.length; i++) {
      const index = indices[i];
      const landmark = landmarks[index];

      // 🌟 캡션을 약간 위쪽으로 이동하여 손가락과 겹치지 않도록 함
      canvasCtx.fillText(names[i], landmark.x * canvasRef.current!.width, landmark.y * canvasRef.current!.height - 10);
    }
  };

  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isAlternativeMode, setIsAlternativeMode] = useState(false);

  return (
    <div className="relative w-auto h-auto bg-white bg-opacity-70 border border-black rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">어항 청소하기</h2>
        <div className="flex space-x-2">
          <button onClick={() => setIsGuideOpen(true)} className="text-xl font-bold hover:text-blue-500">
            ❓
          </button>
          <button onClick={onClose} className="text-xl font-bold hover:text-red-500">
            ✖
          </button>
        </div>
      </div>

      {!isAlternativeMode ? (
        <div className="space-y-3">
          <div className="w-[300px] h-[200px] relative">
            {!isCameraReady && (
              <div className="absolute inset-0 bg-gray-300 animate-pulse flex items-center justify-center">
                <span className="text-gray-500 text-sm">카메라 준비 중...</span>
              </div>
            )}
            <div className="absolute top-2 right-2 px-2 py-1 bg-black text-white rounded-md font-bold z-10">
              {motionCount}
            </div>
            <video
              ref={videoRef}
              className="absolute w-[300px] h-[200px]"
              style={{ display: "none" }}
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="absolute w-[300px] h-[200px]" />
          </div>

          <div>
            <p className="mt-5 text-sm text-center">
              어항이 깨끗해질 수 있게 박박 닦아주세요! <br />
              카메라를 향해 손바닥을 펴서 흔들어주세요!
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-3">
          <p>
            카메라를 사용할 수 없습니다. <br />
            대신 아래 버튼을 눌러 청소하세요!
          </p>
          <button
            onClick={handleCleanSuccess}
            className="px-4 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-700"
          >
            청소 완료하기
          </button>
          <input
            type="text"
            placeholder="'청소 완료' 입력 후 Enter"
            className="border p-2 rounded-lg text-center"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.currentTarget.value === "청소 완료") {
                handleCleanSuccess();
              }
            }}
          />
        </div>
      )}

      {isGuideOpen && (
        <div className="absolute top-0 left-0 z-10 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg text-center">
            <h3 className="text-lg font-bold">청소 방법 안내</h3>
            <div className="border mt-2 p-2 border-black rounded-sm">
              <p className="mt-2">
                손을 왼쪽 끝부터 오른쪽 끝까지 <br />
                천천히 움직여 보세요!
                <br /> 우측 상단 카운트가 올라가요!
              </p>
            </div>
            <p className="mt-2">
              카메라 사용이 불가능한 경우,
              <br />
              버튼으로 청소해 주세요!
            </p>
            <button
              onClick={() => {
                alert("청소에 성공했어요! 🐟");
                playClear();
                count.current = 0;
                handleCleanSuccess();
                setIsGuideOpen(false);
              }}
              className="mt-4 px-4 py-2 bg-green-500 mr-2 text-white font-bold rounded-lg hover:bg-red-700"
            >
              청소하기
            </button>
            <button
              onClick={() => setIsGuideOpen(false)}
              className="mt-4 px-4 py-2 bg-gray-500 text-white font-bold rounded-lg hover:bg-red-700"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
