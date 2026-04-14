import api from "./api";

export async function fetchProducts() {
  const { data } = await api.get("/api/products");
  return data;
}

export async function fetchProductById(id) {
  const { data } = await api.get(`/api/products/${id}`);
  return data;
}

export async function createProduct(payload) {
  const { data } = await api.post("/api/admin/products", payload, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return data;
}

export async function uploadProductImages(files) {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  const { data } = await api.post("/api/admin/products/upload-images", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return data;
}

export async function updateProduct(id, payload) {
  const { data } = await api.put(`/api/admin/products/${id}`, payload, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return data;
}

export async function removeProduct(id) {
  const { data } = await api.delete(`/api/admin/products/${id}`);
  return data;
}
