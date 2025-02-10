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
  console.log("쿠키 ", cookies);
  const cookie = cookies.find((row) => row.startsWith(`${name}=`));
  return cookie ? cookie.split("=")[1] : null;
};

// 요청 인터셉터: 모든 요청에 accessToken을 추가
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

// ✅ 응답 인터셉터: 401 발생 시 자동으로 accessToken 갱신
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response, // 정상 응답일 경우 그대로 반환
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // 이미 재시도한 요청이면 무한 루프 방지
      if (originalRequest._retry) {
        return Promise.reject(error);
      }
      originalRequest._retry = true;

      try {
        const refreshToken = getCookie("refreshToken"); // ✅ 쿠키에서 `refreshToken` 가져오기
        if (!refreshToken) {
          console.log("리코 : ", refreshToken);
          throw new Error("No refresh token available");

          // ✅ 토큰 삭제 후 로그인 페이지로 이동
          localStorage.removeItem("accessToken");
          window.location.href = "/user/login";
          return Promise.reject(error);
        }

        // 🔄 새로운 accessToken 요청
        const { data } = await axios.post(`${BASE_URL}${REFRESH_URL}`, { refreshToken });

        const newAccessToken = data.accessToken;
        localStorage.setItem("accessToken", newAccessToken); // 새로운 토큰 저장

        // 기존 요청에 새로운 accessToken 추가 후 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("토큰 갱신 실패:", refreshError);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
