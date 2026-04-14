import api from "./api";

export async function fetchCategories() {
  const { data } = await api.get("/api/categories");
  return data;
}

export async function createCategory(payload) {
  const { data } = await api.post("/api/admin/categories", payload);
  return data;
}

export async function updateCategory(id, payload) {
  const { data } = await api.patch(`/api/admin/categories/${id}`, payload);
  return data;
}

export async function removeCategory(id) {
  const { data } = await api.delete(`/api/admin/categories/${id}`);
  return data;
}
