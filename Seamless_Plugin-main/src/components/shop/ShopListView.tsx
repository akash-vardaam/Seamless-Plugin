import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  Funnel,
  Search,
  ShoppingCart,
} from 'lucide-react';
import { LoadingSpinner } from '../LoadingSpinner';
import { useShadowRoot } from '../ShadowRoot';
import {
  addItemToCart,
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

type ShopSortKey = 'featured' | 'price_asc' | 'price_desc' | 'title_asc' | 'title_desc';

const SORT_LABELS: Record<ShopSortKey, string> = {
  featured: 'Featured',
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
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

const handleActionKeyDown = (
  event: React.KeyboardEvent<HTMLElement>,
  action: () => void,
) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    action();
  }
};

export const ShopListView: React.FC = () => {
  const shadowRoot = useShadowRoot();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([]);
  const [selectedAvailabilities, setSelectedAvailabilities] = useState<string[]>([]);
  const [sort, setSort] = useState<ShopSortKey>('featured');

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
    if (!notice) return undefined;

    const timer = window.setTimeout(() => {
      setNotice('');
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [notice]);

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
      const eventPath = event.composedPath();
      const clickedSortControl = eventPath.some(
        (entry) => entry instanceof HTMLElement && Boolean(entry.closest('[data-shop-sort-wrap]')),
      );
      const clickedFilterControl = eventPath.some(
        (entry) => entry instanceof HTMLElement && Boolean(entry.closest('[data-shop-filter-wrap]')),
      );

      if (!clickedSortControl) {
        setSortOpen(false);
      }

      if (!clickedFilterControl) {
        setFiltersOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSortOpen(false);
        setFiltersOpen(false);
      }
    };

    shadowRoot?.addEventListener('click', handleClick as EventListener);
    document.addEventListener('click', handleClick as EventListener);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      shadowRoot?.removeEventListener('click', handleClick as EventListener);
      document.removeEventListener('click', handleClick as EventListener);
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
      if (sort === 'featured') {
        if (left.featured !== right.featured) {
          return left.featured ? -1 : 1;
        }
        const timestampDelta = right.sortTimestamp - left.sortTimestamp;
        if (timestampDelta !== 0) return timestampDelta;
        return String(left.title || '').localeCompare(String(right.title || ''));
      }

      if (sort === 'price_asc' || sort === 'price_desc') {
        const nullPriceFallback = sort === 'price_asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
        const leftPrice = left.price ?? nullPriceFallback;
        const rightPrice = right.price ?? nullPriceFallback;
        const priceDelta = sort === 'price_asc' ? leftPrice - rightPrice : rightPrice - leftPrice;
        if (priceDelta !== 0) return priceDelta;
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
    setSort('featured');
    setSortOpen(false);
  };

  const handleSimpleAddToCart = async (product: ShopProduct) => {
    if (!product.isAvailable) return;

    try {
      const nextCart = await addItemToCart(product, 1, {});
      setCartCount(nextCart.itemCount);
      setNotice(`${product.title} is added to cart.`);
    } catch (cartError: any) {
      setNotice(cartError?.message || 'Unable to add this product right now.');
    }
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
    <div className="seamless-shop seamless-shop--list">
      <section className="seamless-shop__section">
        <div className="seamless-shop__topbar">
          <div className="seamless-shop__count">Showing {filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'}</div>

          <div className="seamless-shop__actions">
            <div
              className={`seamless-shop__button ${activeFilterCount ? 'seamless-shop__button--active' : ''}`}
              role="button"
              tabIndex={0}
              aria-expanded={filtersOpen}
              data-shop-filter-wrap
              onClick={() => setFiltersOpen((current) => !current)}
              onKeyDown={(event) => handleActionKeyDown(event, () => setFiltersOpen((current) => !current))}
            >
              <Funnel className="seamless-shop__icon" />
              <span>Filters</span>
              <span className="seamless-shop__badge seamless-shop__badge--primary">
                {activeFilterCount}
              </span>
              <ChevronDown className={`seamless-shop__icon ${filtersOpen ? 'seamless-shop__rotate' : ''}`} />
            </div>

            <div className="seamless-shop__sort-wrap" data-shop-sort-wrap>
              <button
                type="button"
                className="seamless-shop__button"
                aria-expanded={sortOpen}
                onClick={() => setSortOpen((current) => !current)}
              >
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
                      {sort === value ? <Check className="seamless-shop__icon" /> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <a
              href={buildCartUrl()}
              className="seamless-shop__button-link seamless-shop__button-link--cart"
            >
              <ShoppingCart className="seamless-shop__icon" />
              <span>VIEW CART</span>
              <span className="seamless-shop__badge">
                {cartCount}
              </span>
            </a>
          </div>
        </div>

        {filtersOpen ? (
          <div className="seamless-shop__filters" data-shop-filter-wrap>
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
              <div
                className="seamless-shop__button"
                role="button"
                tabIndex={0}
                onClick={resetFilters}
                onKeyDown={(event) => handleActionKeyDown(event, resetFilters)}
              >
                Clear All Filters
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {notice ? (
        <div className={`seamless-shop__alert ${notice.includes('Unable') ? '' : 'seamless-shop__alert--success'}`}>
          {notice}
        </div>
      ) : null}

      {filteredProducts.length ? (
        <div className="seamless-shop__grid">
          {filteredProducts.map((product) => {
            const productCategories = resolveProductCategories(product, categoryMap);
            const categoryLabel = productCategories[0]?.name || 'Uncategorized';
            const hasVariants = Boolean(product.hasVariants || product.variants?.length);
            const isSimpleOutOfStock = !hasVariants && product.isAvailable === false;

            return (
              <article key={product.id} className="seamless-shop__product-card">
                <div className="seamless-shop__image-square">
                  <a href={buildProductUrl(product)} className="seamless-shop__product-link">
                    <img
                      src={product.featuredImage || getPlaceholderImage(product.title)}
                      alt={product.title}
                      loading="lazy"
                      className="seamless-shop__image"
                    />
                  </a>
                  <div className="seamless-shop__card-action-wrap">
                    {hasVariants ? (
                      <button
                        onClick={() => window.location.href = buildProductUrl(product)}
                        className="seamless-shop__primary-button seamless-shop__card-action"
                      >
                        <span className="seamless-shop-card-action-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-settings2-icon lucide-settings-2"><path d="M14 17H5"></path><path d="M19 7h-9"></path><circle cx="17" cy="17" r="3"></circle><circle cx="7" cy="7" r="3"></circle></svg></span>
                        Choose Options
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isSimpleOutOfStock}
                        className="seamless-shop__primary-button seamless-shop__card-action"
                        onClick={() => void handleSimpleAddToCart(product)}
                      >
                        <span className="seamless-shop-card-action-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-shopping-bag-icon lucide-shopping-bag"><path d="M16 10a4 4 0 0 1-8 0"></path><path d="M3.103 6.034h17.794"></path><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"></path></svg></span>
                        {isSimpleOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    )}
                  </div>
                </div>
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

