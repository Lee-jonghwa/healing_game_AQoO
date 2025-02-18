"use client";

import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/services/axiosInstance";
import Image from "next/image";
import { useRouter } from "next/navigation";
import MenuButton from "../main/MenuButton";

export default function CustomFishPages() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  const [viewportHeight, setViewportHeight] = useState("100vh");

  const [lineMode, setLineMode] = useState(true); // Line 모드 여부

  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState("black");
  const [penWidth, setPenWidth] = useState(20);
  const [eraserMode, setEraserMode] = useState(false);
  const [fillMode, setFillMode] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);

  const [background, setBackground] = useState("/background-1.png");

  const [fishName, setFishName] = useState(""); // 🎨 물고기 이름
  const [fishSize, setFishSize] = useState("S"); // 기본값을 'M'으로 설정

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

    // 🌟 현재 뷰포트 높이를 가져와서 설정
    const updateHeight = () => {
      setViewportHeight(`${window.innerHeight}px`);
    };

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

    // 🌟 초기 설정 실행
    updateHeight();
    updateCanvasSize();
    saveToHistory();

    // 🌟 창 크기 변경 감지 → 캔버스 크기 및 높이 업데이트
    window.addEventListener("resize", updateHeight);
    window.addEventListener("resize", updateCanvasSize);

    return () => {
      window.removeEventListener("resize", updateHeight);
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, []);

  useEffect(() => {
    const handleTouchMove = (event: TouchEvent) => {
      if (isDrawing) {
        // event.preventDefault(); // ✅ 터치 스크롤 방지
      }
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => document.removeEventListener("touchmove", handleTouchMove);
  }, [isDrawing]);

  // 펜 굵기 변경 시 `context.lineWidth` 업데이트 (캔버스를 다시 그리지 않음)
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.lineWidth = penWidth;
    }
  }, [penWidth]); // ✅ 펜 굵기 변경 시에만 실행됨 (리사이징과 분리)

  const getCanvasCoordinates = (event: MouseEvent | TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (event instanceof MouseEvent) {
      return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (event.touches[0].clientX - rect.left) * scaleX,
        y: (event.touches[0].clientY - rect.top) * scaleY,
      };
    }
  };

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;

    const context = contextRef.current;

    // ✅ 기존 캔버스의 픽셀 데이터를 저장 (투명도 유지됨)
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    setHistory((prev) => [...prev, imageData]); // 🎯 `ImageData` 저장
  };

  const undo = () => {
    if (history.length <= 1) return;

    const newHistory = [...history];
    const lastState = newHistory.pop();
    if (!lastState) return;

    setRedoStack((prev) => [...prev, lastState]); // 🚀 Undo한 상태를 Redo 스택에 저장
    setHistory(newHistory);

    // ✅ 저장된 ImageData로 복원
    if (newHistory.length > 0) restoreCanvas(newHistory[newHistory.length - 1]);
  };

  const redo = () => {
    if (redoStack.length === 0) return;

    const redoState = redoStack.pop();
    if (!redoState) return;

    setHistory((prev) => [...prev, redoState]);
    restoreCanvas(redoState);
  };

  const restoreCanvas = (imageData: ImageData) => {
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;

    const context = contextRef.current;

    // ✅ 기존 캔버스를 지우고 저장된 ImageData 복원
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.putImageData(imageData, 0, 0);
  };

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault(); // 🔹 터치 스크롤 방지

    if (fillMode) {
      const { x, y } = getCanvasCoordinates(event.nativeEvent);
      fillArea(x, y);
      return;
    }

    if (!contextRef.current) return;
    setIsDrawing(true);

    const context = contextRef.current;
    const { x, y } = getCanvasCoordinates(event.nativeEvent);
    context.beginPath();
    context.moveTo(x, y);

    if (eraserMode) {
      context.globalCompositeOperation = "destination-out";
      context.strokeStyle = "rgba(0,0,0,1)";
    } else {
      context.globalCompositeOperation = "source-over";
      context.strokeStyle = penColor;
    }
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault(); // 🔹 터치할 때 화면 스크롤 방지

    if (!isDrawing || !contextRef.current) return;
    const context = contextRef.current;
    const { x, y } = getCanvasCoordinates(event.nativeEvent);
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
      const electronAPI = (window as any).electronAPI;
      if (electronAPI && electronAPI.showAlert) {
        electronAPI.showAlert("물고기 이름을 입력해주세요!");
      } else {
        alert("물고기 이름을 입력해주세요!");
      }
      return;
    }

    // 🔹 특수문자 검사
    const allowedRegex = /^[가-힣a-zA-Z0-9]*$/;
    if (!allowedRegex.test(fishName)) {
      alert("물고기 이름에는 한글, 영어, 숫자만 사용할 수 있습니다!");
      return;
    }

    if (!fishSize) {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI && electronAPI.showAlert) {
        electronAPI.showAlert("물고기 크기를 선택해주세요!");
      } else {
        alert("물고기 크기를 선택해주세요!");
      }
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
          size: fishSize,
        })
      );
      formData.append("image", blob, `${fishName}.png`);

      try {
        // ✅ 2. API 호출 (multipart/form-data)
        const response = await axiosInstance.post(`/fish/painting`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        // console.log('✅ 응답 :', response.data);

        // 서버에서 중복된 이름일 경우 "이미 존재하는 이름입니다."라는 문자열을 반환하는 경우
        if (typeof response.data === "string" && response.data.includes("이미 존재하는 이름입니다")) {
          const electronAPI = (window as any).electronAPI;
          if (electronAPI && electronAPI.showAlert) {
            electronAPI.showAlert("이미 존재하는 물고기 이름입니다. 다른 이름을 입력해주세요!");
          } else {
            alert("이미 존재하는 물고기 이름입니다. 다른 이름을 입력해주세요!");
          }
          setFishName(""); // 기존 입력값 초기화 (선택)
          return;
        }

        const electronAPI = (window as any).electronAPI;
        if (electronAPI && electronAPI.showAlert) {
          electronAPI.showAlert("그림이 저장되었습니다!");
        } else {
          alert("그림이 저장되었습니다!");
        }
        router.push("/mypage/fishtank");
      } catch (error: any) {
        console.error("🚨 오류:", error);
        const electronAPI = (window as any).electronAPI;
        if (electronAPI && electronAPI.showAlert) {
          electronAPI.showAlert("저장 중 오류가 발생했습니다.");
        } else {
          alert("저장 중 오류가 발생했습니다.");
        }
      }
    }, "image/png");
  };

  // 색상 팔레트 (사용자 지정 색 추가)
  const [customColor, setCustomColor] = useState("#ff0000");
  const colors = [
    "#FF0000",
    "#FFA500",
    "#FFFF00",
    "#008000",
    "#0000FF",
    "#800080",
    "#FFC0CB",
    "#808080",
    "#FFFFFF",
    "#000000",
    customColor,
  ];

  return (
    <div
      className="relative w-full flex flex-col items-center justify-center px-4 pb-20
  lg:h-screen lg:overflow-hidden 
  sm:min-h-screen sm:overflow-auto"
    >
      <title>AQoO</title>

      {/* 🖼 배경 이미지 */}
      <div
        className="absolute inset-0 bg-cover bg-center w-full h-full"
        style={{
          backgroundImage: `url(${background})`,
          backgroundSize: "cover", // ✅ 배경이 뷰포트 전체를 덮도록 설정
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          height: "auto", // ✅ 컨텐츠 길이에 맞게 자동 조정
          minHeight: "100vh", // ✅ 최소 높이를 100vh로 설정하여 모바일에서도 유지
        }}
      ></div>

      {/* 🖼 메인 컨테이너 */}
      <div className="relative flex flex-col items-center bg-white border-[2px] mt-20 border-black rounded-lg p-6 w-full max-w-lg sm:max-w-4xl text-center justify-center shadow-lg">
        {/* 🖌️ 제목 */}
        <div className="absolute top-[-25px] left-1/2 transform -translate-x-1/2 bg-white border-[2px] border-black rounded-md px-6 py-3 shadow-md flex items-center justify-center w-[250px] sm:w-[250px] md:w-[350px] max-w-full">
          <Image src="/icon/paintIcon.png" alt="paint" width={24} height={24} className="mr-2" />
          <h2 className="text-lg sm:text-3xl font-bold tracking-widest text-black mx-2 whitespace-nowrap">
            물고기 그리기
          </h2>
          <Image src="/icon/paintIcon.png" alt="paint" width={24} height={24} className="ml-2 scale-x-[-1]" />
        </div>

        {/* 🎨 캔버스 영역 */}
        <div className="flex flex-col md:flex-row w-full  items-center justify-center mt-10">
          {/* 🎨 색상 팔레트 */}
          <div className="grid grid-cols-6 sm:grid-cols-2 gap-2 p-2">
            {colors.map((color, index) => (
              <button
                key={index}
                onClick={() => setPenColor(color)}
                className={`w-10 h-10 sm:w-12 sm:h-12 border rounded-md transition-all
                  ${penColor === color ? "border-4 border-black" : "border border-black"}`}
                style={{ backgroundColor: color }}
              />
            ))}
            {/* 사용자 지정 색 선택 */}
            <input
              type="color"
              value={customColor}
              onChange={(e) => {
                const newColor = e.target.value;

                setCustomColor(newColor);
                setPenColor(newColor);
              }}
              className={`w-10 h-10 sm:w-12 sm:h-12 border rounded-md cursor-pointer transition-all
                ${penColor === customColor ? "border-4 border-black" : "border border-black"}`}
            />
          </div>

          {/* 🖼 캔버스 */}
          <canvas
            className="border-[3px] border-black bg-gray-100 w-full max-w-lg sm:max-w-[600px] h-[300px] sm:h-[400px]"
            ref={canvasRef}
            style={{
              border: "1px solid black",
              cursor: fillMode ? "pointer" : "crosshair",
              touchAction: "none",
            }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />

          {/* 🎨 도구 메뉴 */}
          <div className="grid grid-cols-4 sm:grid-cols-3 md:flex md:flex-col gap-2 md:ml-6 mt-6 md:mt-0">
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
              icon="/icon/drawtool/ClearIcon.png"
              label="Clear"
              onClick={clearCanvas}
              className={"!w-14 !h-14"}
            />
            <MenuButton icon="/icon/drawtool/undoIcon.png" label="Undo" onClick={undo} className={"!w-14 !h-14"} />
            <MenuButton icon="/icon/drawtool/redoIcon.png" label="Redo" onClick={redo} className={"!w-14 !h-14"} />
          </div>
        </div>

        {/* ✅ 반응형 정렬 적용 */}
        <div className="flex flex-col sm:flex-row items-center justify-center w-full gap-4 mt-6">
          <div className="flex flex-col items-center w-full sm:w-auto">
            <label className="font-semibold text-lg">🐟 물고기 이름 입력</label>
            <input
              type="text"
              placeholder="물고기 이름 입력"
              value={fishName}
              onChange={(e) => setFishName(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md text-lg w-full sm:w-56 h-12 text-center"
            />
          </div>

          <div className="flex flex-col items-center w-full sm:w-auto">
            <label className="font-semibold text-lg">🐟 크기 선택</label>
            <select
              value={fishSize}
              onChange={(e) => setFishSize(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md text-lg w-full sm:w-56 h-12 text-center"
            >
              <option value="XS">XS</option>
              <option value="S">기본</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
            </select>
          </div>
        </div>

        {/* 🏁 버튼 */}
        <div className="flex flex-col items-center justify-center sm:flex-row gap-4 mt-6 sm:mt-4 w-full">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 sm:px-6 sm:py-3 bg-gray-400 text-white rounded-lg shadow-md w-full sm:w-auto"
          >
            취소하기
          </button>
          <button
            onClick={handleSaveDrawing}
            className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-500 text-white rounded-lg shadow-md w-full sm:w-auto"
          >
            그리기 완료
          </button>
        </div>
      </div>
    </div>
  );
}
