// src/services/aquariumService.ts

import axios from "axios";
import axiosInstance from "./axiosInstance";

const API_BASE_URL = "https://i12e203.p.ssafy.io/api/v1";

export const getUserFishes = async (aquariumId: number) => {
  const response = await axiosInstance.get(`/aquarium/fish/${aquariumId}`);
  return response.data;
};
