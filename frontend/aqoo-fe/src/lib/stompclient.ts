import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient: Client | null = null;

export const connectStompClient = (onConnect: () => void) => {
  stompClient = new Client({
    webSocketFactory: () => new SockJS('https://i12e203.p.ssafy.io/ws'),
    reconnectDelay: 5000,
    debug: (str) => {
      console.log(str);
    },
  });

  stompClient.onConnect = () => {
    console.log('Connected to STOMP');
    onConnect();
  };

  // 추가: STOMP 에러 핸들러
  stompClient.onStompError = (frame) => {
    console.error('Broker reported error: ' + frame.headers['message']);
    console.error('Additional details: ' + frame.body);
  };

  stompClient.activate();
};

export const getStompClient = () => {
  return stompClient;
};

export const disconnectStompClient = () => {
  if (stompClient) {
    stompClient.deactivate();
  }
};
