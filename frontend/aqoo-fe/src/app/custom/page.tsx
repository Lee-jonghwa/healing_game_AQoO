"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import MenuButton from "../main/MenuButton";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function CustomFishPages() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  const [lineMode, setLineMode] = useState(true); // Line 모드 여부

  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState("black");
  const [penWidth, setPenWidth] = useState(20);
  const [eraserMode, setEraserMode] = useState(false);
  const [fillMode, setFillMode] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [background, setBackground] = useState("/background-1.png");
  const [fishName, setFishName] = useState(""); // 🎨 물고기 이름

  const { auth } = useAuth();
  const userId = auth.user?.id;

  useEffect(() => {
    const savedBg = localStorage.getItem("background");
    if (savedBg) setBackground(savedBg);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.lineCap = "round";
    context.lineWidth = penWidth;
    contextRef.current = context;

    // 🌟 리사이징 시 기존 그림 저장 후 복원하는 함수
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !contextRef.current) return;

      const context = contextRef.current;

      // 🌟 기존 그림 저장
      const prevCanvasData = canvas.toDataURL();

      const parent = canvas.parentElement;
      if (!parent) return;

      const newWidth = parent.clientWidth * 0.9; // 부모 요소 기준 크기 조정
      const newHeight = (newWidth * 3) / 4; // 4:3 비율 유지

      // 🌟 기존 캔버스 크기 변경 전에 현재 그리기 상태 초기화
      setIsDrawing(false);

      canvas.width = newWidth;
      canvas.height = newHeight;

      // 🌟 기존 그림 복원
      const img = new window.Image();
      img.src = prevCanvasData;
      img.onload = () => {
        context.drawImage(img, 0, 0, newWidth, newHeight);

        // ✅ 창 크기 변경 후 `penWidth`를 다시 적용하여 동기화
        context.lineCap = "round";
        context.lineWidth = penWidth; // 👈 여기서 `penWidth`를 강제로 적용
        context.strokeStyle = eraserMode ? "white" : penColor;
      };
    };

    // 🌟 캔버스 크기 조정 및 초기 히스토리 저장
    updateCanvasSize();
    saveToHistory();

    // 🌟 창 크기 변경 감지 → 캔버스 크기 업데이트
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  // 펜 굵기 변경 시 `context.lineWidth` 업데이트 (캔버스를 다시 그리지 않음)
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.lineWidth = penWidth;
    }
  }, [penWidth]); // ✅ 펜 굵기 변경 시에만 실행됨 (리사이징과 분리)

  const getCanvasCoordinates = (event: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect(); // 캔버스의 위치 및 크기 가져오기

    // 비율 조정 (CSS 크기와 실제 캔버스 크기 차이 보정)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL();
    setHistory((prev) => [...prev, dataURL]);
  };

  const undo = () => {
    if (history.length <= 1) return;
    const newHistory = [...history];
    const lastState = newHistory.pop();
    if (!lastState) return; // 🚨 마지막 상태가 undefined이면 return

    setRedoStack((prev) => [...prev, lastState]);
    setHistory(newHistory);
    if (newHistory.length > 0) restoreCanvas(newHistory[newHistory.length - 1]);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const redoState = redoStack.pop();
    if (!redoState) return; // 🚨 redoState가 undefined일 때 return

    setHistory((prev) => [...prev, redoState]);
    restoreCanvas(redoState);
  };

  const restoreCanvas = (dataURL: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const img = new window.Image(); // ⬅️ `window.Image`로 명확히 지정하여 충돌 방지
    img.src = dataURL;
    img.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0);
    };
  };

  const startDrawing = (event: React.MouseEvent) => {
    if (fillMode) {
      const { x, y } = getCanvasCoordinates(event);
      fillArea(x, y);
      return;
    }

    if (!contextRef.current) return;
    setIsDrawing(true);

    const context = contextRef.current;
    const { x, y } = getCanvasCoordinates(event); // 정확한 좌표 가져오기
    context.beginPath();
    context.moveTo(x, y);
    context.strokeStyle = eraserMode ? "white" : penColor;
  };

  const draw = (event: React.MouseEvent) => {
    if (!isDrawing || !contextRef.current) return;
    const context = contextRef.current;
    const { x, y } = getCanvasCoordinates(event); // 수정된 좌표 사용
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (contextRef.current) {
      contextRef.current.closePath();
    }
    saveToHistory(); // 이 함수에서 redoStack 초기화 X
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;
    contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };

  // 색 채우기 함수 시작
  const fillArea = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;

    const context = contextRef.current;
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // 좌표를 정수로 변환 (오차 방지)
    const startX = Math.floor(x);
    const startY = Math.floor(y);

    const targetColor = getColorAtPixel(data, startX, startY, canvas.width);
    const fillColor = hexToRGBA(penColor);

    if (colorsMatch(targetColor, fillColor)) return; // 같은 색이면 채우지 않음

    floodFill(data, startX, startY, canvas.width, canvas.height, targetColor, fillColor);

    context.putImageData(imageData, 0, 0);
    saveToHistory();
  };

  const getColorAtPixel = (data: Uint8ClampedArray, x: number, y: number, width: number) => {
    const index = (y * width + x) * 4;
    return [data[index], data[index + 1], data[index + 2], data[index + 3]];
  };

  const hexToRGBA = (hex: string) => {
    const bigint = parseInt(hex.slice(1), 16);
    return [
      (bigint >> 16) & 255, // Red
      (bigint >> 8) & 255, // Green
      bigint & 255, // Blue
      255, // Alpha (fully opaque)
    ];
  };

  // 색 비교할 때 tolerance(허용 오차) 추가
  const colorsMatch = (a: number[], b: number[], tolerance = 10) => {
    return (
      Math.abs(a[0] - b[0]) <= tolerance &&
      Math.abs(a[1] - b[1]) <= tolerance &&
      Math.abs(a[2] - b[2]) <= tolerance &&
      Math.abs(a[3] - b[3]) <= tolerance
    );
  };

  // flood fill 알고리즘 최적화 (visited 배열 추가)
  const floodFill = (
    data: Uint8ClampedArray,
    x: number,
    y: number,
    width: number,
    height: number,
    targetColor: number[],
    fillColor: number[]
  ) => {
    const stack = [[x, y]];
    const visited = new Set(); // 방문한 좌표 저장 (무한 루프 방지)

    const pixelMatches = (x: number, y: number) => {
      const index = (y * width + x) * 4;
      return colorsMatch(targetColor, [data[index], data[index + 1], data[index + 2], data[index + 3]]);
    };

    const setColor = (x: number, y: number) => {
      const index = (y * width + x) * 4;
      data[index] = fillColor[0];
      data[index + 1] = fillColor[1];
      data[index + 2] = fillColor[2];
      data[index + 3] = fillColor[3];
    };

    while (stack.length) {
      const [px, py] = stack.pop()!;
      const key = `${px},${py}`;

      if (visited.has(key)) continue; // 이미 방문한 픽셀이면 건너뜀
      visited.add(key);

      if (px < 0 || py < 0 || px >= width || py >= height || !pixelMatches(px, py)) continue;

      setColor(px, py);

      stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
    }
  };

  // 색 채우기 함수 끝

  // ✅ API 요청을 위한 `handleSaveDrawing` 함수
  const handleSaveDrawing = async () => {
    if (!fishName.trim()) {
      alert("물고기 이름을 입력해주세요!");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // ✅ 1. 캔버스를 이미지로 변환 (Blob)
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const formData = new FormData();
      formData.append(
        "fishData",
        JSON.stringify({
          userId: userId,
          fishName: fishName,
        })
      );
      formData.append("image", blob, `${fishName}.png`);

      try {
        // ✅ 2. API 호출 (multipart/form-data)
        const response = await axios.post("/api/v1/fish/painting", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        console.log("✅ 성공:", response.data);
        alert("그림이 저장되었습니다!");
        router.push("/somewhere"); // ✅ 저장 후 리디렉션할 페이지
      } catch (error) {
        console.error("🚨 오류:", error);
        alert("저장 중 오류가 발생했습니다.");
      }
    }, "image/png");
  };

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center px-4">
      <title>AQoO</title>

      {/* 🖼 배경 이미지 */}
      <div
        className="absolute inset-0 bg-cover bg-center w-full h-full before:absolute before:inset-0 before:bg-white/30"
        style={{ backgroundImage: `url(${background})` }}
      ></div>

      {/* 🖼 메인 컨테이너 */}
      <div className="relative flex flex-col items-center bg-white border-[2px] mt-10 border-black rounded-lg p-6 w-full max-w-4xl text-center shadow-lg">
        {/* 🎨 타이틀 */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 min-w-[300px] sm:min-w-[420px] flex items-center justify-center text-center px-6 py-2 bg-white border-[2px] border-black rounded-md shadow-md">
          <Image src="/icon/paintIcon.png" alt="paint" width={32} height={32} className="mr-2" />
          <h2 className="text-2xl sm:text-4xl font-bold tracking-widest text-black mx-4">물고기 그리기</h2>
          <Image src="/icon/paintIcon.png" alt="paint" width={32} height={32} className="ml-2 scale-x-[-1]" />
        </div>

        {/* 🎨 캔버스 영역 */}
        <div className="flex flex-col md:flex-row w-full  items-center justify-center">
          {/* 🎨 색상 팔레트 */}
          <div className="grid grid-cols-5 md:flex md:flex-col gap-2 p-2">
            {["#FF0000", "#FFA500", "#FFFF00", "#008000", "#0000FF", "#800080", "#FFC0CB", "#000000", "#FFFFFF"].map(
              (color) => (
                <button
                  key={color}
                  onClick={() => setPenColor(color)}
                  className={`w-8 h-8 sm:w-10 sm:h-10 border border-black rounded-md 
          ${penColor === color ? "border-8 border-black" : "border"}`}
                  style={{ backgroundColor: color }}
                />
              )
            )}
          </div>

          {/* 🖼 캔버스 */}
          <canvas
            ref={canvasRef}
            style={{ border: "1px solid black", cursor: fillMode ? "pointer" : "crosshair" }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="border-[3px] border-black bg-white w-full max-w-[600px] h-[300px] sm:h-[400px]"
          />

          {/* 🎨 도구 메뉴 */}
          <div className="grid grid-cols-3 md:flex md:flex-col gap-4 ml-4">
            {/* ✏️ 펜 굵기 조절 슬라이더 */}
            <div className="flex flex-col items-center">
              <span className="text-xs">{penWidth}px</span>
              <input
                type="range"
                min="10"
                max="30"
                value={penWidth}
                onChange={(e) => {
                  const newWidth = Number(e.target.value);
                  setPenWidth(newWidth);
                  if (contextRef.current) contextRef.current.lineWidth = newWidth;
                }} // ✅ 여기서 캔버스를 다시 그리지 않음
                className="w-16 mt-2"
              />
            </div>

            <MenuButton
              icon="/icon/drawtool/lineIcon.png"
              label="Line"
              onClick={() => {
                setLineMode(!lineMode);
                setEraserMode(false);
                setFillMode(false);
              }}
              className={`${lineMode ? "bg-gray-300" : "bg-white"} !w-14 !h-14`}
            />

            <MenuButton
              icon="/icon/drawtool/eraserIcon.png"
              label="Eraser"
              onClick={() => {
                setEraserMode(!eraserMode);
                setFillMode(false);
                setLineMode(false);
              }}
              className={`${eraserMode ? "bg-gray-300" : "bg-white"}  !w-14 !h-14`}
            />
            <MenuButton
              icon="/icon/drawtool/fillIcon.png"
              label="Fill"
              onClick={() => {
                setFillMode(!fillMode);
                setEraserMode(false);
                setLineMode(false);
              }}
              className={`${fillMode ? "bg-gray-300" : "bg-white"}  !w-14 !h-14`}
            />
            <MenuButton
              icon="/icon/drawtool/clearIcon.png"
              label="Clear"
              onClick={clearCanvas}
              className={"!w-14 !h-14"}
            />
            <MenuButton icon="/icon/drawtool/undoIcon.png" label="Undo" onClick={undo} className={"!w-14 !h-14"} />
            <MenuButton icon="/icon/drawtool/redoIcon.png" label="Redo" onClick={redo} className={"!w-14 !h-14"} />
          </div>
        </div>

        {/* ✅ 🐟 물고기 이름 입력 */}
        <input
          type="text"
          placeholder="물고기 이름 입력"
          value={fishName}
          onChange={(e) => setFishName(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md text-lg w-full sm:w-96 text-center"
        />

        {/* 🏁 버튼 */}
        <div className="flex flex-col items-center justify-center sm:flex-row gap-4 mt-6 w-full">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-400 text-white rounded-lg shadow-md w-full sm:w-auto"
          >
            취소하기
          </button>
          <button
            onClick={handleSaveDrawing}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md w-full sm:w-auto"
          >
            그리기 완료
          </button>
        </div>
      </div>
    </div>
  );
}
