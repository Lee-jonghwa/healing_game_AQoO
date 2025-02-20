import { atom } from "recoil";

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

export const chatMessagesState = atom<ChatMessage[]>({
  key: "chatMessagesState", // 고유 key 값 확인
  default: [],
});
