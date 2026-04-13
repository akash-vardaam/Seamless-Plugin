import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  Funnel,
  Search,
  ShoppingCart,
  SlidersHorizontal,
} from 'lucide-react';
import { LoadingSpinner } from '../LoadingSpinner';
import { useShadowRoot } from '../ShadowRoot';
import {
  fetchAllShopProducts,
  fetchCurrentCart,
  fetchShopCategories,
  subscribeToShopCart,
} from '../../services/shopService';
import type { ShopCategory, ShopProduct } from '../../types/shop';
import {
  buildCartUrl,
  buildProductUrl,
  flattenCategories,
  formatAttributeLabel,
  getPlaceholderImage,
  resolveProductCategories,
  slugify,
  truncateText,
} from '../../utils/shopHelpers';

type ShopSortKey = 'newest' | 'oldest' | 'title_asc' | 'title_desc';

const SORT_LABELS: Record<ShopSortKey, string> = {
  newest: 'Newest First',
  oldest: 'Oldest First',
  title_asc: 'Title (A-Z)',
  title_desc: 'Title (Z-A)',
};

const PRODUCT_TYPE_OPTIONS = ['physical', 'virtual', 'downloadable'];
const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'In stock' },
  { value: 'unavailable', label: 'Low stock' },
];

const buildFallbackCategoriesFromProducts = (products: ShopProduct[]): ShopCategory[] => {
  const map = new Map<string, ShopCategory>();

  products
    .flatMap((product) => product.categories || [])
    .forEach((category) => {
      const id = String(category.id ?? category.slug ?? category.name);
      if (!id || map.has(id)) return;

      map.set(id, {
        id,
        name: category.name || category.slug || 'Category',
        slug: category.slug || slugify(category.name || category.slug || 'category'),
        parentId: null,
        children: [],
      });
    });

  return Array.from(map.values());
};

const filterCheckboxClass =
  'seamless-shop__checkbox';

export const ShopListView: React.FC = () => {
  const shadowRoot = useShadowRoot();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([]);
  const [selectedAvailabilities, setSelectedAvailabilities] = useState<string[]>([]);
  const [sort, setSort] = useState<ShopSortKey>('newest');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const loadedProducts = await fetchAllShopProducts();
        const [loadedCategories, cart] = await Promise.all([
          fetchShopCategories().catch(() => []),
          fetchCurrentCart().catch(() => null),
        ]);

        if (cancelled) return;

        setProducts(loadedProducts);
        setCategories(loadedCategories.length ? loadedCategories : buildFallbackCategoriesFromProducts(loadedProducts));
        setCartCount(cart?.itemCount ?? 0);
      } catch (shopError: any) {
        if (cancelled) return;
        setError(shopError?.message || 'Unable to load shop products right now.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => subscribeToShopCart((cart) => setCartCount(cart.itemCount)), []);

  useEffect(() => {
    const refreshCartCount = () => {
      if (document.visibilityState === 'visible') {
        void fetchCurrentCart()
          .then((cart) => setCartCount(cart.itemCount))
          .catch(() => undefined);
      }
    };

    window.addEventListener('focus', refreshCartCount);
    document.addEventListener('visibilitychange', refreshCartCount);

    return () => {
      window.removeEventListener('focus', refreshCartCount);
      document.removeEventListener('visibilitychange', refreshCartCount);
    };
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const clickedSortControl = event
        .composedPath()
        .some((entry) => entry instanceof HTMLElement && Boolean(entry.closest('[data-shop-sort-wrap]')));

      if (!clickedSortControl) {
        setSortOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSortOpen(false);
      }
    };

    const eventRoot = shadowRoot || document;

    eventRoot.addEventListener('click', handleClick as EventListener);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      eventRoot.removeEventListener('click', handleClick as EventListener);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shadowRoot]);

  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, ShopCategory>();
    flatCategories.forEach((category) => {
      map.set(String(category.id), category);
      if (category.slug) {
        map.set(String(category.slug), category);
      }
    });
    return map;
  }, [flatCategories]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const matchesFilters = products.filter((product) => {
      const productCategories = resolveProductCategories(product, categoryMap);
      const matchesSearch =
        !normalizedSearch ||
        [
          product.title,
          product.sku,
          product.shortDescription,
          ...productCategories.map((category) => category.name),
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

      if (!matchesSearch) return false;

      if (selectedCategoryIds.length) {
        const productCategoryKeys = new Set(
          productCategories.flatMap((category) => [String(category.id || ''), String(category.slug || '')]),
        );
        const hasCategoryMatch = selectedCategoryIds.some((categoryId) => productCategoryKeys.has(categoryId));
        if (!hasCategoryMatch) return false;
      }

      if (selectedProductTypes.length && !selectedProductTypes.includes(product.productType.toLowerCase())) {
        return false;
      }

      if (selectedAvailabilities.length && !selectedAvailabilities.includes(product.availabilityStatus.toLowerCase())) {
        return false;
      }

      return true;
    });

    return [...matchesFilters].sort((left, right) => {
      if (sort === 'newest') {
        const timestampDelta = right.sortTimestamp - left.sortTimestamp;
        if (timestampDelta !== 0) return timestampDelta;
        return String(left.title || '').localeCompare(String(right.title || ''));
      }

      if (sort === 'oldest') {
        const timestampDelta = left.sortTimestamp - right.sortTimestamp;
        if (timestampDelta !== 0) return timestampDelta;
        return String(left.title || '').localeCompare(String(right.title || ''));
      }

      if (sort === 'title_desc') {
        return String(right.title || '').localeCompare(String(left.title || ''));
      }

      return String(left.title || '').localeCompare(String(right.title || ''));
    });
  }, [categoryMap, products, search, selectedAvailabilities, selectedCategoryIds, selectedProductTypes, sort]);

  const activeFilterCount =
    selectedCategoryIds.length +
    selectedProductTypes.length +
    selectedAvailabilities.length +
    (search.trim() ? 1 : 0);

  const toggleSelection = (
    value: string,
    setSelectedValues: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setSelectedValues((current) =>
      current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value],
    );
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedCategoryIds([]);
    setSelectedProductTypes([]);
    setSelectedAvailabilities([]);
    setSort('newest');
    setSortOpen(false);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="seamless-shop seamless-shop--compact">
        <div className="seamless-shop__alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="seamless-shop">
      <section className="seamless-shop__section">
        <div className="seamless-shop__topbar">
          <div className="seamless-shop__count">Showing {filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'}</div>

          <div className="seamless-shop__actions">
            <button
              type="button"
              className={`seamless-shop__button ${activeFilterCount ? 'seamless-shop__button--active' : ''}`}
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((current) => !current)}
            >
              <Funnel className="seamless-shop__icon" />
              <span>Filters</span>
              {activeFilterCount > 0 ? (
                <span className="seamless-shop__badge seamless-shop__badge--primary">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>

            <div className="seamless-shop__sort-wrap" data-shop-sort-wrap>
              <button
                type="button"
                className="seamless-shop__button"
                aria-expanded={sortOpen}
                onClick={() => setSortOpen((current) => !current)}
              >
                <SlidersHorizontal className="seamless-shop__icon" />
                <span>{SORT_LABELS[sort]}</span>
                <ChevronDown className={`seamless-shop__icon ${sortOpen ? 'seamless-shop__rotate' : ''}`} />
              </button>

              {sortOpen ? (
                <div className="seamless-shop__sort-menu">
                  {(Object.entries(SORT_LABELS) as [ShopSortKey, string][]).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={`seamless-shop__sort-option ${sort === value ? 'seamless-shop__sort-option--active' : ''}`}
                      onClick={() => {
                        setSort(value);
                        setSortOpen(false);
                      }}
                    >
                      <span>{label}</span>
                      {sort === value ? <span>Selected</span> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <a
              href={buildCartUrl()}
              className="seamless-shop__button-link"
            >
              <ShoppingCart className="seamless-shop__icon" />
              <span>View Cart</span>
              <span className="seamless-shop__badge">
                {cartCount}
              </span>
            </a>
          </div>
        </div>

        {filtersOpen ? (
          <div className="seamless-shop__filters">
            <div className="seamless-shop__filter-group">
              <label className="seamless-shop__label">Search</label>
              <div className="seamless-shop__search-wrap">
                <Search className="seamless-shop__search-icon" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Find items..."
                  className="seamless-shop__input"
                />
              </div>
            </div>

            <div className="seamless-shop__filter-group">
              <div className="seamless-shop__label">Category</div>
              <label className="seamless-shop__checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedCategoryIds.length === 0}
                  className={filterCheckboxClass}
                  onChange={() => setSelectedCategoryIds([])}
                />
                <span>All categories</span>
              </label>
              {flatCategories.length ? (
                <div className="seamless-shop__filter-group">
                  {flatCategories.map((category) => (
                    <label
                      key={category.id}
                      className={`seamless-shop__checkbox-label ${category.parentId ? 'seamless-shop__checkbox-label--child' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.includes(category.id) || selectedCategoryIds.includes(category.slug)}
                        className={filterCheckboxClass}
                        onChange={() => toggleSelection(category.id, setSelectedCategoryIds)}
                      />
                      <span>{category.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="seamless-shop__muted">No categories available</p>
              )}
            </div>

            <div className="seamless-shop__filter-group">
              <div className="seamless-shop__label">Product Type</div>
              <label className="seamless-shop__checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedProductTypes.length === 0}
                  className={filterCheckboxClass}
                  onChange={() => setSelectedProductTypes([])}
                />
                <span>All types</span>
              </label>
              {PRODUCT_TYPE_OPTIONS.map((value) => (
                <label key={value} className="seamless-shop__checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedProductTypes.includes(value)}
                    className={filterCheckboxClass}
                    onChange={() => toggleSelection(value, setSelectedProductTypes)}
                  />
                  <span>{formatAttributeLabel(value)}</span>
                </label>
              ))}
            </div>

            <div className="seamless-shop__filter-group">
              <div className="seamless-shop__label">Availability</div>
              <label className="seamless-shop__checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedAvailabilities.length === 0}
                  className={filterCheckboxClass}
                  onChange={() => setSelectedAvailabilities([])}
                />
                <span>All availability</span>
              </label>
              {AVAILABILITY_OPTIONS.map((option) => (
                <label key={option.value} className="seamless-shop__checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedAvailabilities.includes(option.value)}
                    className={filterCheckboxClass}
                    onChange={() => toggleSelection(option.value, setSelectedAvailabilities)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
              <button
                type="button"
                className="seamless-shop__button"
                onClick={resetFilters}
              >
                Clear All Filters
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {filteredProducts.length ? (
        <div className="seamless-shop__grid">
          {filteredProducts.map((product) => {
            const productCategories = resolveProductCategories(product, categoryMap);
            const categoryLabel = productCategories[0]?.name || 'Uncategorized';

            return (
              <article key={product.id} className="seamless-shop__product-card">
                <a href={buildProductUrl(product)} className="seamless-shop__product-link">
                  <div className="seamless-shop__image-square">
                    <img
                      src={product.featuredImage || getPlaceholderImage(product.title)}
                      alt={product.title}
                      loading="lazy"
                      className="seamless-shop__image"
                    />
                  </div>
                </a>
                <div className="seamless-shop__card-body">
                  <div className="seamless-shop__eyebrow">{categoryLabel}</div>
                  <h3 className="seamless-shop__title">
                    <a href={buildProductUrl(product)}>
                      {product.title}
                    </a>
                  </h3>
                  <p className="seamless-shop__text seamless-shop__clamp">
                    {truncateText(product.shortDescription || product.descriptionHtml, 72)}
                  </p>
                  <div className="seamless-shop__inline">
                    <strong className="seamless-shop__price">{product.priceLabel}</strong>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="seamless-shop__empty seamless-shop__empty--dashed">
          No products matched your current filters.
        </div>
      )}
    </div>
  );
};

