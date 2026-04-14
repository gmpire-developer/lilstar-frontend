import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiImage, FiUpload, FiX } from "react-icons/fi";

import Loader from "../components/Loader";
import { fetchCategories } from "../services/categoryService";
import {
  createProduct,
  fetchProductById,
  updateProduct,
  uploadProductImages
} from "../services/productService";

const initialForm = {
  name: "",
  description: "",
  price: "",
  category_id: "",
  stock: "0",
  is_active: true
};

function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const isEditMode = useMemo(() => Boolean(id), [id]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageGallery, setImageGallery] = useState([]);
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [showBannerModal, setShowBannerModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const categoriesData = await fetchCategories();

        if (!isMounted) {
          return;
        }

        setCategories(categoriesData);

        if (isEditMode) {
          const product = await fetchProductById(id);

          if (!isMounted) {
            return;
          }

          setForm({
            name: product.name || "",
            description: product.description || "",
            price: String(product.price ?? ""),
            category_id: product.category_id ? String(product.category_id) : "",
            stock: String(product.stock ?? 0),
            is_active: Boolean(product.is_active)
          });

          setImageGallery(Array.isArray(product.image_gallery) ? product.image_gallery : []);
          setBannerImageUrl(product.banner_image_url || product.image_url || "");
          setImagePreviewUrl(product.image_url || product.banner_image_url || "");
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.response?.data?.message || "Failed to load form data");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id, isEditMode]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleUploadImages = async (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    try {
      setUploadingImages(true);
      setError("");

      const response = await uploadProductImages(files);
      const uploaded = response.images || [];

      setImageGallery((previous) => {
        const merged = [...previous, ...uploaded];
        const unique = Array.from(new Set(merged));
        return unique.slice(0, 8);
      });

      if (!bannerImageUrl && uploaded[0]) {
        setBannerImageUrl(uploaded[0]);
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Image upload failed");
    } finally {
      setUploadingImages(false);
      event.target.value = "";
    }
  };

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0] || null;
    setImageFile(file);

    if (!file) {
      return;
    }

    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    const preview = URL.createObjectURL(file);
    setImagePreviewUrl(preview);
  };

  const removeImage = (url) => {
    setImageGallery((previous) => previous.filter((item) => item !== url));
    if (bannerImageUrl === url) {
      setBannerImageUrl("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || "",
      price: Number(form.price),
      category_id: form.category_id ? Number(form.category_id) : "",
      stock: Number(form.stock),
      image_gallery: imageGallery,
      banner_image_url: bannerImageUrl || imageGallery[0] || "",
      is_active: form.is_active
    };

    if (!payload.name || Number.isNaN(payload.price) || Number.isNaN(payload.stock)) {
      setError("Name, price, and stock must be valid values.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const formData = new FormData();
      formData.append("name", payload.name);
      formData.append("description", payload.description);
      formData.append("price", String(payload.price));
      formData.append("category_id", String(payload.category_id));
      formData.append("stock", String(payload.stock));
      formData.append("is_active", String(payload.is_active));
      formData.append("image_gallery", JSON.stringify(payload.image_gallery));
      formData.append("banner_image_url", payload.banner_image_url);

      if (imageFile) {
        // Backend expects the primary image under this key.
        formData.append("image", imageFile);
      }

      if (isEditMode) {
        await updateProduct(id, formData);
      } else {
        await createProduct(formData);
      }

      navigate("/manage/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader text="Loading form..." />;
  }

  return (
    <section className="panel reveal form-panel">
      <h2>{isEditMode ? "Edit Product" : "Add Product"}</h2>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="form" onSubmit={handleSubmit}>
        <label htmlFor="name">Name</label>
        <input id="name" name="name" value={form.name} onChange={handleChange} required />

        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={4}
        />

        <label htmlFor="price">Price</label>
        <input
          id="price"
          name="price"
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={handleChange}
          required
        />

        <label htmlFor="category_id">Category</label>
        <select id="category_id" name="category_id" value={form.category_id} onChange={handleChange}>
          <option value="">Uncategorized</option>
          {categories.map((category) => (
            <option key={category.id} value={String(category.id)}>
              {category.name}
            </option>
          ))}
        </select>

        <label htmlFor="stock">Stock</label>
        <input
          id="stock"
          name="stock"
          type="number"
          min="0"
          value={form.stock}
          onChange={handleChange}
          required
        />

        <label htmlFor="image">Primary Image</label>
        <div className="upload-row">
          <input id="image" name="image" type="file" accept="image/*" onChange={handleImageSelect} />
          <span className="subtle-text">Optional: upload one primary image to S3.</span>
        </div>

        {imagePreviewUrl ? (
          <div className="single-image-preview">
            <img src={imagePreviewUrl} alt="Selected product" loading="lazy" />
          </div>
        ) : null}

        <label htmlFor="images-upload">Upload Product Images</label>
        <div className="upload-row">
          <input
            id="images-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleUploadImages}
          />
          <span className="subtle-text">Up to 8 images, 5MB each</span>
        </div>

        {uploadingImages ? <div className="alert">Uploading images...</div> : null}

        {imageGallery.length > 0 ? (
          <>
            <div className="image-preview-grid">
              {imageGallery.map((url) => (
                <div
                  key={url}
                  className={`image-preview-card ${bannerImageUrl === url ? "is-banner" : ""}`}
                >
                  <img src={url} alt="Product" loading="lazy" />
                  <div className="image-preview-actions">
                    <button
                      type="button"
                      className="btn btn-outline icon-btn"
                      onClick={() => setBannerImageUrl(url)}
                      title="Set as banner"
                    >
                      <FiImage />
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger icon-btn"
                      onClick={() => removeImage(url)}
                      title="Remove"
                    >
                      <FiX />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-outline icon-btn"
              onClick={() => setShowBannerModal(true)}
            >
              <FiImage /> Choose Banner in Modal
            </button>
          </>
        ) : null}

        <label className="checkbox">
          <input
            name="is_active"
            type="checkbox"
            checked={form.is_active}
            onChange={handleChange}
          />
          Active product
        </label>

        <div className="actions-row">
          <button type="submit" className="btn btn-primary icon-btn" disabled={submitting}>
            <FiUpload /> {submitting ? "Saving..." : "Save Product"}
          </button>
          <Link to="/manage/dashboard" className="btn btn-outline">
            Cancel
          </Link>
        </div>
      </form>

      {showBannerModal ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="panel__head">
              <h3>Select Banner Image</h3>
              <button
                type="button"
                className="btn btn-outline icon-btn"
                onClick={() => setShowBannerModal(false)}
              >
                <FiX />
              </button>
            </div>

            <div className="image-preview-grid">
              {imageGallery.map((url) => (
                <button
                  key={url}
                  type="button"
                  className={`image-select-tile ${bannerImageUrl === url ? "is-selected" : ""}`}
                  onClick={() => {
                    setBannerImageUrl(url);
                    setShowBannerModal(false);
                  }}
                >
                  <img src={url} alt="Select banner" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default ProductFormPage;
