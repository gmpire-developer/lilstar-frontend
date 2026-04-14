import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import useDebouncedValue from "../hooks/useDebouncedValue";
import Loader from "../components/Loader";
import Pagination from "../components/Pagination";
import { useAuth } from "../context/AuthContext";
import { fetchCategories } from "../services/categoryService";
import { fetchProducts } from "../services/productService";

const PAGE_SIZE = 12;

function HomePage() {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const [minMaxPrice, setMinMaxPrice] = useState({ min: 0, max: 1000 });

  const debouncedSearch = useDebouncedValue(searchInput, 350);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [productsData, categoriesData] = await Promise.all([
          fetchProducts(),
          fetchCategories()
        ]);

        if (!isMounted) {
          return;
        }

        setProducts(productsData);
        setCategories(categoriesData);

        if (productsData.length > 0) {
          const prices = productsData.map((p) => Number(p.price));
          const minPrice = Math.floor(Math.min(...prices));
          const maxPrice = Math.ceil(Math.max(...prices));
          setMinMaxPrice({ min: minPrice, max: maxPrice });
          setPriceRange([minPrice, maxPrice]);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.response?.data?.message || "Failed to load products");
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
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory, stockFilter, priceRange, sortBy]);

  const filteredProducts = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    const min = priceRange[0];
    const max = priceRange[1];

    const output = products.filter((product) => {
      const isActive = product.is_active === true || Number(product.is_active) === 1;
      const productPrice = Number(product.price);
      const productStock = Number(product.stock);

      const matchesSearch =
        term.length === 0 ||
        product.name.toLowerCase().includes(term) ||
        (product.description || "").toLowerCase().includes(term) ||
        (product.category_name || "").toLowerCase().includes(term);

      const matchesCategory =
        !selectedCategory || String(product.category_id || "") === selectedCategory;

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "in-stock" && productStock > 0) ||
        (stockFilter === "low-stock" && productStock > 0 && productStock <= 10) ||
        (stockFilter === "out-of-stock" && productStock === 0);

      const matchesMinPrice = productPrice >= min;
      const matchesMaxPrice = productPrice <= max;

      return (
        isActive &&
        matchesSearch &&
        matchesCategory &&
        matchesStock &&
        matchesMinPrice &&
        matchesMaxPrice
      );
    });

    output.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "price-asc":
          return Number(a.price) - Number(b.price);
        case "price-desc":
          return Number(b.price) - Number(a.price);
        case "stock-desc":
          return Number(b.stock) - Number(a.stock);
        case "stock-asc":
          return Number(a.stock) - Number(b.stock);
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return output;
  }, [
    products,
    debouncedSearch,
    selectedCategory,
    stockFilter,
    priceRange,
    sortBy
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, safePage]);

  const showingFrom = filteredProducts.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(safePage * PAGE_SIZE, filteredProducts.length);

  const clearFilters = () => {
    setSearchInput("");
    setSelectedCategory("");
    setStockFilter("all");
    setPriceRange([minMaxPrice.min, minMaxPrice.max]);
    setSortBy("newest");
  };

  if (loading) {
    return <Loader text="Loading products..." />;
  }

  return (
    <section className="panel reveal">
      <div className="panel__head">
        <div>
          <h2>Product Catalog</h2>
          <p>Search and filter to find products.</p>
        </div>
        {isAuthenticated ? (
          <Link to="/manage/dashboard" className="btn btn-primary">
            Go to Dashboard
          </Link>
        ) : null}
      </div>

      <div className="search-bar-container">
        <input
          type="text"
          placeholder="Search products by name, description, or category..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="search-bar"
        />
      </div>

      <div className="catalog-layout">
        <aside className="catalog-sidebar panel panel--inner">
          <h3>Filters</h3>

          <div className="sidebar-form">

            <label htmlFor="catalog-category">Category</label>
            <select
              id="catalog-category"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
            </select>

            <label htmlFor="catalog-stock">Stock</label>
            <select
              id="catalog-stock"
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value)}
            >
              <option value="all">All stock</option>
              <option value="in-stock">In stock</option>
              <option value="low-stock">Low stock (1-10)</option>
              <option value="out-of-stock">Out of stock</option>
            </select>

            <label htmlFor="catalog-price-range">Price Range</label>
            <div className="price-range-container">
              <input
                id="catalog-price-range"
                type="range"
                min={minMaxPrice.min}
                max={minMaxPrice.max}
                step="1"
                value={priceRange[0]}
                onChange={(event) => {
                  const newMin = Number(event.target.value);
                  if (newMin <= priceRange[1]) {
                    setPriceRange([newMin, priceRange[1]]);
                  }
                }}
                className="price-slider price-slider--min"
              />
              <input
                type="range"
                min={minMaxPrice.min}
                max={minMaxPrice.max}
                step="1"
                value={priceRange[1]}
                onChange={(event) => {
                  const newMax = Number(event.target.value);
                  if (newMax >= priceRange[0]) {
                    setPriceRange([priceRange[0], newMax]);
                  }
                }}
                className="price-slider price-slider--max"
              />
            </div>
            <div className="price-display">
              <span>${priceRange[0]}</span> - <span>${priceRange[1]}</span>
            </div>

            <label htmlFor="catalog-sort">Sort</label>
            <select id="catalog-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="newest">Newest</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="price-asc">Price Low-High</option>
              <option value="price-desc">Price High-Low</option>
              <option value="stock-desc">Stock High-Low</option>
              <option value="stock-asc">Stock Low-High</option>
            </select>

            <button type="button" className="btn btn-outline" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </aside>

        <div className="catalog-results">
          <p className="results-meta">
            Showing {showingFrom}-{showingTo} of {filteredProducts.length} matched products
          </p>

          {error && <div className="alert alert-error">{error}</div>}

          {paginatedProducts.length === 0 ? (
            <p className="empty-state">No products found for the selected filters.</p>
          ) : (
            <div className="product-grid">
              {paginatedProducts.map((product) => (
                <Link className="card card-link stagger" to={`/products/${product.id}`} key={product.id}>
                  <img
                    src={product.image_url || "https://via.placeholder.com/600x380?text=No+Image"}
                    alt={product.name}
                    className="card__image"
                    loading="lazy"
                  />
                  <div className="card__body">
                    <h3 className="card__title">{product.name}</h3>
                    <p className="card__category">{product.category_name || "Uncategorized"}</p>
                    <p className="card__price">${Number(product.price).toFixed(2)}</p>
                    <p className="card__stock">Stock: {product.stock}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </div>
    </section>
  );
}

export default HomePage;
