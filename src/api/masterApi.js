import { getRequest, postRequest } from "./apiService";
import { MASTER_CONFIG } from "../components/masterConfig";

export const getMasters = (type) => {
  return getRequest(MASTER_CONFIG[type].baseUrl);
};

export const createMaster = (type, data) => {
  const cfg = MASTER_CONFIG[type];
  return postRequest(`${cfg.baseUrl}/create`, cfg.mapCreate(data));
};

export const updateMaster = (type, data) => {
  const cfg = MASTER_CONFIG[type];
  return postRequest(`${cfg.baseUrl}/update`, cfg.mapUpdate(data));
};

export const deleteMaster = (type, id, isActive) => {
  const cfg = MASTER_CONFIG[type];
  return postRequest(`${cfg.baseUrl}/active`, cfg.mapDelete(id, isActive));
};
