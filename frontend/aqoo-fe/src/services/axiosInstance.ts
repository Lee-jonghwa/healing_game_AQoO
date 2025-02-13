"use client";

console.log("AxiosInstance loaded");

import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";

const BASE_URL = "https://i12e203.p.ssafy.io/api/v1";
const REFRESH_URL = "/auth/refresh"; // 토큰 갱신 API 엔드포인트

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// 🔹 쿠키에서 `refreshToken`을 가져오는 함수
const getCookie = (name: string): string | null => {
  const cookies = document.cookie.split("; ");
  const cookie = cookies.find((row) => row.startsWith(`${name}=`));
  return cookie ? cookie.split("=")[1] : null;
};

// 🔹 강제 로그아웃 함수
const forceLogout = () => {
  console.error("강제 로그아웃 실행");
  localStorage.removeItem("accessToken"); // Access Token 삭제
  document.cookie = "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;"; // Refresh Token 삭제
  window.location.href = "/user/login"; // 로그인 페이지로 리다이렉트
};

// 요청 인터셉터: 모든 요청에 accessToken을 추가하고 요청 URI와 Request Body를 로깅
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.withCredentials = true; // ✅ 모든 요청에 쿠키 포함
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터: 응답 데이터를 로깅하고, 401 발생 시 토큰 갱신
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response; // 정상 응답일 경우 그대로 반환
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 500 에러 처리
    if (error.response?.status === 500) {
      console.error("500 서버 에러 발생 - 강제 로그아웃");
      forceLogout();
      return Promise.reject(error);
    }

    // JWT 검증 오류 처리
    if (error.response?.data) {
      // 🔹 에러 메시지의 구조를 명확히 타입 단언
      const responseData = error.response.data as { error?: string };
      if (responseData.error && responseData.error.includes("JWT 검증 오류")) {
        console.error("JWT 검증 오류 발생 - 강제 로그아웃");
        forceLogout();
        return Promise.reject(error);
      }
    }

    // 401 에러 처리 (토큰 갱신)
    if (error.response?.status === 401) {
      if (originalRequest._retry) {
        return Promise.reject(error);
      }
      originalRequest._retry = true;

      try {
        const refreshToken = getCookie("refreshToken");
        if (!refreshToken) {
          console.error("리프레시 토큰 없음 - 강제 로그아웃");
          forceLogout();
          return Promise.reject(error);
        }

        console.log("401 발생 - 토큰 갱신 요청");
        const { data } = await axios.post(`${BASE_URL}${REFRESH_URL}`, { refreshToken });
        const newAccessToken = data.accessToken;

        localStorage.setItem("accessToken", newAccessToken); // 새로운 토큰 저장
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("토큰 갱신 실패:", refreshError);
        forceLogout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);


export default axiosInstance;
