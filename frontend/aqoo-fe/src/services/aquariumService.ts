// src/services/aquariumService.ts

import axios from "axios";

const API_BASE_URL = "https://i12e203.p.ssafy.io/api/v1";

export const getUserFishes = async (aquariumId: number) => {
  const response = await axios.get(`${API_BASE_URL}/aquarium/fish/${aquariumId}`);
  return response.data;
};
