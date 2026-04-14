import api from "./api";

export async function fetchUsers() {
  const { data } = await api.get("/api/admin/users");
  return data;
}

export async function createUser(payload) {
  const { data } = await api.post("/api/admin/users", payload);
  return data;
}

export async function updateUserRole(id, role) {
  const { data } = await api.patch(`/api/admin/users/${id}/role`, { role });
  return data;
}

export async function removeUser(id) {
  const { data } = await api.delete(`/api/admin/users/${id}`);
  return data;
}

export async function fetchPasswordResetRequests() {
  const { data } = await api.get("/api/admin/users/password-reset-requests");
  return data;
}

export async function approvePasswordResetRequest(id) {
  const { data } = await api.post(`/api/admin/users/password-reset-requests/${id}/approve`);
  return data;
}
