import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

import Loader from "../components/Loader";
import { fetchProductById } from "../services/productService";

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [product, setProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      try {
        setLoading(true);
        setError("");
        const data = await fetchProductById(id);

        if (isMounted) {
          setProduct(data);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.response?.data?.message || "Failed to load product");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [product?.id]);

  useEffect(() => {
    if (!product || !Array.isArray(product.image_gallery) || product.image_gallery.length <= 1) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActiveImageIndex((previous) => (previous + 1) % product.image_gallery.length);
    }, 3200);

    return () => {
      window.clearInterval(interval);
    };
  }, [product]);

  if (loading) {
    return <Loader text="Loading product details..." />;
  }

  return (
    <section className="panel reveal product-detail-panel">
      <button
        type="button"
        className="back-nav-icon"
        aria-label="Go back"
        onClick={() => navigate(-1)}
      >
        {"<"}
      </button>

      {error ? (
        <div className="alert alert-error">{error}</div>
      ) : !product ? (
        <p className="empty-state">Product not found.</p>
      ) : (
        <div className="product-detail">
          <div className="product-carousel">
            <img
              src={
                product.image_gallery?.[activeImageIndex] ||
                product.banner_image_url ||
                product.image_url ||
                "https://via.placeholder.com/700x420?text=No+Image"
              }
              alt={product.name}
              className="product-detail__image"
              loading="lazy"
            />

            {Array.isArray(product.image_gallery) && product.image_gallery.length > 1 ? (
              <>
                <button
                  type="button"
                  className="carousel-nav carousel-nav--left"
                  onClick={() =>
                    setActiveImageIndex(
                      (previous) =>
                        (previous - 1 + product.image_gallery.length) % product.image_gallery.length
                    )
                  }
                >
                  <FiChevronLeft />
                </button>
                <button
                  type="button"
                  className="carousel-nav carousel-nav--right"
                  onClick={() =>
                    setActiveImageIndex((previous) => (previous + 1) % product.image_gallery.length)
                  }
                >
                  <FiChevronRight />
                </button>

                <div className="carousel-dots">
                  {product.image_gallery.map((image, index) => (
                    <button
                      key={image}
                      type="button"
                      className={`carousel-dot ${index === activeImageIndex ? "is-active" : ""}`}
                      onClick={() => setActiveImageIndex(index)}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>

          <div className="product-detail__content">
            <span className="tag">{product.category_name || "Uncategorized"}</span>
            <h2>{product.name}</h2>
            <p>{product.description || "No description available."}</p>
            <p className="product-detail__price">${Number(product.price).toFixed(2)}</p>
            <p>
              <strong>Stock:</strong> {product.stock}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default ProductDetailPage;
