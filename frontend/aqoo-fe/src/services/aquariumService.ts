// src/services/aquariumService.ts

import axios from "axios";
import axiosInstance from "./axiosInstance";


export const getUserFishes = async (aquariumId: number) => {
  const response = await axiosInstance.get(`/aquariums/fish/${aquariumId}`);
  return response.data;
};
