import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  X,
} from 'lucide-react';
import { LoadingSpinner } from '../LoadingSpinner';
import {
  addItemToCart,
  fetchAllShopProducts,
  fetchCurrentCart,
  fetchShopCategories,
  fetchShopProduct,
  subscribeToShopCart,
} from '../../services/shopService';
import type { ShopCategory, ShopProduct } from '../../types/shop';
import {
  buildCartUrl,
  buildProductUrl,
  buildSafeRichTextBlocks,
  buildShopUrl,
  flattenCategories,
  formatAttributeLabel,
  getInitialVariantSelection,
  getPlaceholderImage,
  normalizeGalleryImages,
  resolveProductCategories,
} from '../../utils/shopHelpers';

interface ZoomState {
  open: boolean;
  scale: number;
  x: number;
  y: number;
}

const clampScale = (value: number) => Math.min(4, Math.max(1, value));

const buildFallbackCategoriesFromProducts = (products: ShopProduct[]): ShopCategory[] => {
  const map = new Map<string, ShopCategory>();

  products
    .flatMap((product) => product.categories)
    .forEach((category) => {
      const id = String(category.id ?? category.slug ?? category.name);
      if (!id || map.has(id)) return;

      map.set(id, {
        id,
        name: category.name || category.slug || 'Category',
        slug: category.slug || id,
        parentId: null,
        children: [],
      });
    });

  return Array.from(map.values());
};

export const ShopProductView: React.FC = () => {
  const { slug = '' } = useParams();
  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [allProducts, setAllProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomState, setZoomState] = useState<ZoomState>({ open: false, scale: 1, x: 0, y: 0 });
  const dragStateRef = useRef<{ active: boolean; startX: number; startY: number; baseX: number; baseY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!slug) {
        setError('No product was requested.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [singleProduct, loadedProducts, loadedCategories, cart] = await Promise.all([
          fetchShopProduct(slug),
          fetchAllShopProducts(),
          fetchShopCategories().catch(() => []),
          fetchCurrentCart().catch(() => null),
        ]);

        if (cancelled) return;

        const resolvedProduct =
          singleProduct ||
          loadedProducts.find((candidate) => candidate.slug === slug || candidate.id === slug) ||
          null;

        if (!resolvedProduct) {
          setError('Unable to load this product right now.');
          return;
        }

        setProduct(resolvedProduct);
        setAllProducts(loadedProducts);
        setCategories(loadedCategories.length ? loadedCategories : buildFallbackCategoriesFromProducts(loadedProducts));
        setSelectedVariantIds(getInitialVariantSelection(resolvedProduct));
        setGalleryIndex(0);
        setQuantity(1);
        setCartCount(cart?.itemCount ?? 0);
      } catch (productError: any) {
        if (!cancelled) {
          setError(productError?.message || 'Unable to load this product right now.');
        }
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
  }, [slug]);

  useEffect(() => {
    if (!zoomState.open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setZoomState({ open: false, scale: 1, x: 0, y: 0 });
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [zoomState.open]);

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

  const selectedOptions = useMemo(() => {
    if (!product?.variants?.length) return [];

    return product.variants
      .map((group, index) => {
        const selectedId = selectedVariantIds[index];
        return group.options.find((option) => option.id === selectedId) || group.options[0] || null;
      })
      .filter(Boolean);
  }, [product, selectedVariantIds]);

  const primaryOption = selectedOptions[0] || null;
  const galleryImages = useMemo(() => {
    if (!product) return [];
    const images = normalizeGalleryImages(product, primaryOption);
    return images.length ? images : [getPlaceholderImage(product.title)];
  }, [primaryOption, product]);

  useEffect(() => {
    setGalleryIndex((current) => Math.min(current, Math.max(galleryImages.length - 1, 0)));
  }, [galleryImages.length]);

  const currentImage = galleryImages[galleryIndex] || product?.featuredImage || getPlaceholderImage(product?.title || 'Product');
  const productCategories = useMemo(() => (product ? resolveProductCategories(product, categoryMap) : []), [categoryMap, product]);
  const categoryLabel = productCategories.map((category) => category.name).join(', ');
  const richDescriptionBlocks = useMemo(
    () => buildSafeRichTextBlocks(product?.descriptionHtml || product?.shortDescription || ''),
    [product?.descriptionHtml, product?.shortDescription],
  );

  const selectedStock = primaryOption?.stockQuantity ?? product?.stockQuantity ?? 0;
  const isOutOfStock = product?.hasVariants && primaryOption ? !primaryOption.isAvailable : !product?.isAvailable;

  useEffect(() => {
    setQuantity((current) => {
      if (current < 1) return 1;
      if (selectedStock > 0 && current > selectedStock) return selectedStock;
      return current;
    });
  }, [selectedStock]);

  const similarProducts = useMemo(() => {
    if (!product) return [];

    return allProducts
      .filter((candidate) => candidate.slug !== product.slug)
      .filter((candidate) => {
        if (!productCategories.length) return true;

        const candidateCategories = resolveProductCategories(candidate, categoryMap);
        return candidateCategories.some((candidateCategory) =>
          productCategories.some(
            (category) =>
              String(category.id) === String(candidateCategory.id) ||
              String(category.slug) === String(candidateCategory.slug),
          ),
        );
      })
      .slice(0, 4);
  }, [allProducts, categoryMap, product, productCategories]);

  const handleAddToCart = async () => {
    if (!product || isOutOfStock || submitting) return;

    setSubmitting(true);

    try {
      const variantSelections = product.variants.reduce<Record<string, string>>((accumulator, group, index) => {
        const option = selectedOptions[index];
        const attributeType = String(group.attributeType || '').trim().toLowerCase();
        const value = String(option?.value || '').trim();

        if (attributeType && value) {
          accumulator[attributeType] = value;
        }

        return accumulator;
      }, {});

      const cart = await addItemToCart(product, quantity, variantSelections);
      setCartCount(cart.itemCount);
      setNotice(`${product.title} is added to cart.`);
    } catch (cartError: any) {
      setNotice(cartError?.message || 'Unable to add this product right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleZoomWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    setZoomState((current) => {
      const scale = clampScale(current.scale * (event.deltaY > 0 ? 0.9 : 1.1));
      return { ...current, scale };
    });
  };

  const handleZoomPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragStateRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      baseX: zoomState.x,
      baseY: zoomState.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleZoomPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.active) return;

    setZoomState((current) => ({
      ...current,
      x: dragStateRef.current.baseX + (event.clientX - dragStateRef.current.startX),
      y: dragStateRef.current.baseY + (event.clientY - dragStateRef.current.startY),
    }));
  };

  const closeZoom = () => {
    dragStateRef.current.active = false;
    setZoomState({ open: false, scale: 1, x: 0, y: 0 });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !product) {
    return (
      <div className="seamless-shop seamless-shop--compact">
        <div className="seamless-shop__panel">
          <p className="seamless-shop__text">{error || 'Unable to load this product right now.'}</p>
          <a
            href={buildShopUrl()}
            className="seamless-shop__button-link seamless-shop__mt-4"
          >
            Back to Shop
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="seamless-shop">
      <nav className="seamless-shop__breadcrumb">
        <a href={getShopUrlHome()} >
          Home
        </a>
        <span>/</span>
        <a href={buildShopUrl()} >
          Shop
        </a>
        <span>/</span>
        <span>{product.title}</span>
        <a
          href={buildCartUrl()}
          className="seamless-shop__breadcrumb-cart"
        >
          <ShoppingCart className="seamless-shop__icon" />
          <span>View Cart</span>
          <span className="seamless-shop__badge">
            {cartCount}
          </span>
        </a>
      </nav>

      {notice ? (
        <div className={`seamless-shop__alert ${notice.includes('Unable') ? '' : 'seamless-shop__alert--success'}`}>
          {notice}
        </div>
      ) : null}

      <section className="seamless-shop__product-layout">
        <div className="seamless-shop__gallery">
          {galleryImages.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous image"
                className="seamless-shop__gallery-nav seamless-shop__gallery-nav--prev"
                disabled={galleryImages.length <= 1}
                onClick={() => setGalleryIndex((current) => (current - 1 + galleryImages.length) % galleryImages.length)}
              >
                <ChevronLeft className="seamless-shop__icon--md" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                className="seamless-shop__gallery-nav seamless-shop__gallery-nav--next"
                disabled={galleryImages.length <= 1}
                onClick={() => setGalleryIndex((current) => (current + 1) % galleryImages.length)}
              >
                <ChevronRight className="seamless-shop__icon--md" />
              </button>
            </>
          ) : null}

          <button
            type="button"
            aria-label="Zoom image"
            className="seamless-shop__icon-button seamless-shop__zoom-button"
            onClick={() => setZoomState({ open: true, scale: 1, x: 0, y: 0 })}
          >
            <Search className="seamless-shop__icon" />
          </button>

          <button
            type="button"
            className="seamless-shop__image-button"
            onClick={() => setZoomState({ open: true, scale: 1, x: 0, y: 0 })}
          >
            <img
              src={currentImage}
              alt={product.title}
              className="seamless-shop__image-contain"
            />
          </button>
        </div>

        <div className="seamless-shop__product-info">
          <div className="seamless-shop__product-meta seamless-shop__eyebrow">
            <span>{categoryLabel || 'Shop Product'}</span>
            <span className="seamless-shop__pill">
              {getProductTypeLabel(product.productType)}
            </span>
          </div>

          <h1 className="seamless-shop__title-xl">{product.title}</h1>
          <div className="seamless-shop__price-large">{product.priceLabel}</div>
          <p className="seamless-shop__text">
            {product.shortDescription || 'Additional product information will be available soon.'}
          </p>

          <div className="seamless-shop__variant-list">
            {product.variants.length ? (
              product.variants.map((group, groupIndex) => {
                const selectedOption = selectedOptions[groupIndex];

                return (
                  <div key={group.attributeType} className="seamless-shop__variant-group">
                    <div className="seamless-shop__label">
                      {formatAttributeLabel(group.attributeType)}
                    </div>
                    <div className="seamless-shop__variant-options">
                      {group.options.map((option) => {
                        const isSelected = selectedOption?.id === option.id;

                        return (
                          <button
                            key={option.id}
                            type="button"
                            aria-pressed={isSelected}
                            disabled={!option.isAvailable}
                            className={`seamless-shop__variant-button ${option.isAvailable ? '' : 'seamless-shop__variant-button--disabled'}`}
                            onClick={() => {
                              setSelectedVariantIds((current) => {
                                const next = [...current];
                                next[groupIndex] = option.id;
                                return next;
                              });
                              setGalleryIndex(0);
                              setQuantity(1);
                            }}
                          >
                            <span
                              className={`seamless-shop__swatch ${isSelected ? 'seamless-shop__swatch--selected' : ''}`}
                              style={{ backgroundColor: option.swatch || '#ffffff' }}
                            >
                              <span
                                className="seamless-shop__swatch-inner"
                                style={{ backgroundColor: option.swatch || '#ffffff' }}
                              >
                                {!option.isAvailable ? <span className="seamless-shop__swatch-unavailable" /> : null}
                              </span>
                            </span>
                            {isSelected ? (
                              <span className="seamless-shop__variant-label">{option.value}</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="seamless-shop__variant-group">
                <span className="seamless-shop__eyebrow">Product Type</span>
                <strong className="seamless-shop__price">{getProductTypeLabel(product.productType)}</strong>
              </div>
            )}
          </div>

          <div className="seamless-shop__purchase-row">
            <div className="seamless-shop__quantity">
              <button
                type="button"
                className="seamless-shop__quantity-button"
                disabled={isOutOfStock}
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              >
                <Minus className="seamless-shop__icon" />
              </button>
              <span className="seamless-shop__quantity-value">
                {quantity}
              </span>
              <button
                type="button"
                className="seamless-shop__quantity-button"
                disabled={isOutOfStock || (selectedStock > 0 && quantity >= selectedStock)}
                onClick={() =>
                  setQuantity((current) => {
                    if (selectedStock > 0) return Math.min(selectedStock, current + 1);
                    return current + 1;
                  })
                }
              >
                <Plus className="seamless-shop__icon" />
              </button>
            </div>

            <button
              type="button"
              disabled={isOutOfStock || submitting}
              className="seamless-shop__primary-button seamless-shop__button--full"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="seamless-shop__icon" />
              <span>{isOutOfStock ? 'Out of Stock' : submitting ? 'Adding...' : 'Add to Cart'}</span>
            </button>
          </div>

          {isOutOfStock && primaryOption ? (
            <p className="seamless-shop__stock-note">
              This selected variant is out of stock. Choose another available option.
            </p>
          ) : (
            <div className="seamless-shop__trust-note">
              <Check className="seamless-shop__icon" />
              <span>Fast, trackable worldwide shipping available</span>
            </div>
          )}
        </div>
      </section>

      <section className="seamless-shop__section">
        <h2 className="seamless-shop__heading-small">Product Details</h2>
        <div className="seamless-shop__rich-text">
          {richDescriptionBlocks.length ? (
            richDescriptionBlocks.map((block, index) =>
              block.type === 'list' ? (
                <div key={`${block.heading || 'list'}-${index}`} className="seamless-shop__variant-group">
                  {block.heading ? <p className="seamless-shop__rich-heading">{block.heading}:</p> : null}
                  <ul >
                    {(block.items || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p key={`${block.text || 'paragraph'}-${index}`} >
                  {block.text}
                </p>
              ),
            )
          ) : (
            <p >Additional product information will be available soon.</p>
          )}
        </div>
      </section>

      {similarProducts.length ? (
        <section className="seamless-shop__section">
          <div className="seamless-shop__similar-heading">
            <h2 className="seamless-shop__heading-small">Similar Products</h2>
            <a href={buildShopUrl()} className="seamless-shop__link-primary seamless-shop__heading-small">
              View Collection
            </a>
          </div>
          <div className="seamless-shop__similar-grid">
            {similarProducts.map((item) => (
              <article key={item.id} className="seamless-shop__product-card">
                <a href={buildProductUrl(item)} className="seamless-shop__product-link">
                  <div className="seamless-shop__image-square">
                    <img
                      src={item.featuredImage || getPlaceholderImage(item.title)}
                      alt={item.title}
                      loading="lazy"
                      className="seamless-shop__image"
                    />
                  </div>
                </a>
                <div className="seamless-shop__card-body">
                  <div className="seamless-shop__eyebrow">
                    {resolveProductCategories(item, categoryMap)[0]?.name || 'Uncategorized'}
                  </div>
                  <h3 className="seamless-shop__title">
                    <a href={buildProductUrl(item)}>
                      {item.title}
                    </a>
                  </h3>
                  <p className="seamless-shop__text seamless-shop__clamp">
                    {item.shortDescription}
                  </p>
                  <strong className="seamless-shop__price">{item.priceLabel}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {zoomState.open ? (
        <div className="seamless-shop__zoom-overlay">
          <button type="button" className="seamless-shop__zoom-backdrop" aria-label="Close zoom view" onClick={closeZoom} />
          <div className="seamless-shop__zoom-frame">
            <button
              type="button"
              className="seamless-shop__icon-button seamless-shop__zoom-close"
              aria-label="Close zoom view"
              onClick={closeZoom}
            >
              <X className="seamless-shop__icon" />
            </button>
            <div
              className={`seamless-shop__zoom-stage ${dragStateRef.current.active ? 'seamless-shop__zoom-stage--dragging' : ''}`}
              onWheel={handleZoomWheel}
              onPointerDown={handleZoomPointerDown}
              onPointerMove={handleZoomPointerMove}
              onPointerUp={() => {
                dragStateRef.current.active = false;
              }}
              onPointerCancel={() => {
                dragStateRef.current.active = false;
              }}
            >
              <img
                src={currentImage}
                alt={product.title}
                className="seamless-shop__zoom-image"
                style={{
                  transformOrigin: '0 0',
                  transform: `translate(${zoomState.x}px, ${zoomState.y}px) scale(${zoomState.scale})`,
                }}
              />
            </div>
            <div className="seamless-shop__zoom-help">
              Scroll to zoom, drag to pan
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const getShopUrlHome = (): string => {
  const config = (window as any).seamlessReactConfig || {};
  return String(config.siteUrl || window.location.origin).replace(/\/+$/g, '');
};

const getProductTypeLabel = (value: string): string => {
  const config = (window as any).seamlessReactConfig || {};
  if (String(value || '').toLowerCase() === 'physical') {
    return String(config.shopProductTypeLabel || 'Physical');
  }

  return formatAttributeLabel(value || 'physical');
};

