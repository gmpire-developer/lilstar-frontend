import api from "./api";

export async function loginAdmin(credentials) {
  const { data } = await api.post("/manage/auth/login", credentials);
  return data;
}

export async function requestPasswordReset(payload) {
  const { data } = await api.post("/manage/auth/password-reset/request", payload);
  return data;
}

export async function completePasswordReset(payload) {
  const { data } = await api.post("/manage/auth/password-reset/complete", payload);
  return data;
}

export async function fetchCurrentUser() {
  const { data } = await api.get("/manage/auth/me");
  return data;
}

export async function changeOwnPassword(payload) {
  const { data } = await api.patch("/manage/auth/change-password", payload);
  return data;
}

export async function updateOwnProfile(payload) {
  const { data } = await api.patch("/manage/auth/profile", payload);
  return data;
}
