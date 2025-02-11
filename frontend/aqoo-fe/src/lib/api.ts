// ✅ 테스트용 API 호출 (임시 userId 사용, header 없음)
export const fetchUserFishCollectionTest = async () => {
  try {
    const testUserId = "ejoyee"; // ✅ 테스트용 userId (임의 값)
    const apiUrl = `https://i12e203.p.ssafy.io/api/v1/fish/collection/${testUserId}`;

    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error("물고기 도감 데이터를 가져오는 데 실패했습니다.");
    }

    return await res.json();
  } catch (error) {
    console.error("API 호출 오류 (테스트):", error);
    return null;
  }
};

// ✅ 테스트용 API 호출 (임시 userId 사용, header 없음)
export const fetchCustomFishCollectionTest = async () => {
  try {
    const testUserId = "ejoyee"; // ✅ 테스트용 userId (임의 값)
    const apiUrl = `https://i12e203.p.ssafy.io/api/v1/fish/custom/${testUserId}`;

    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error("물고기 커스텀 데이터를 가져오는 데 실패했습니다.");
    }

    return await res.json();
  } catch (error) {
    console.error("API 호출 오류 (테스트):", error);
    return null;
  }
};

// ✅ 테스트용 API 호출 (header 없음)
export const fetchAllFishCollectionTest = async () => {
  try {
    const apiUrl = `https://i12e203.p.ssafy.io/api/v1/fish/all-collection`;
    console.log(`api요청:${apiUrl}`);

    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`전체 물고기 종류 데이터를 가져오는 데 실패했습니다. (HTTP ${res.status})`);
    }

    console.log(`📡 응답 상태: ${res.status}`); // ✅ 응답 상태 코드 확인

    return await res.json();
  } catch (error) {
    console.error("API 호출 오류 (테스트):", error);
    return null;
  }
};
