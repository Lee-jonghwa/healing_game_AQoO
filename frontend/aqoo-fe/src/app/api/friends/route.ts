// 백엔드랑 합치면 삭제할 폴더
// 테스트용 api
// 나중에 백엔드로 경로바꾸면 됨
// 테스트용 친구데이터

import { NextResponse } from "next/server";

const mockFriends = [
    { id: "user_1", nickname: "유저 1", level: 12, fishImage: ""},
    { id: "user_2", nickname: "유저 2", level: 1, fishImage: ""},
    { id: "user_3", nickname: "유저 3", level: 2, fishImage: ""},
    { id: "user_4", nickname: "유저 4", level: 12, fishImage: ""},
    { id: "user_5", nickname: "유저 5", level: 15, fishImage: ""},
    { id: "user_6", nickname: "유저 6", level: 19, fishImage: ""},
    { id: "user_7", nickname: "유저 7", level: 7, fishImage: ""},
    { id: "user_8", nickname: "유저 8", level: 3, fishImage: ""},
    { id: "user_9", nickname: "유저 9", level: 5, fishImage: ""},
    { id: "user_10", nickname: "유저 10", level: 9, fishImage: ""},
];

// api 요청 들어오면 데이터 반환
export async function GET() {
    return NextResponse.json( mockFriends);
}