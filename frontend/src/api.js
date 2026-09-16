import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const createMeeting = (payload) => api.post("/meetings", payload);
export const getMeetings = () => api.get("/meetings");
export const getMeeting = (id) => api.get(`/meetings/${id}`);
export const deleteMeeting = (id) => api.delete(`/meetings/${id}`);
export const updateTaskStatus = (taskId, status) =>
  api.patch(`/meetings/tasks/${taskId}/status`, { status });
export const updateTask = (taskId, updates) =>
  api.patch(`/meetings/tasks/${taskId}`, updates);

export default api;
