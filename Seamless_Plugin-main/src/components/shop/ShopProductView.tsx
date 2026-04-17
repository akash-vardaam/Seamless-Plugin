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
import type { ShopCart, ShopCategory, ShopProduct } from '../../types/shop';
import {
  buildCartUrl,
  buildProductUrl,
  buildSafeRichTextBlocks,
  buildSiteUrl,
  buildShopUrl,
  buildVariantSelectionMap,
  flattenCategories,
  formatAttributeLabel,
  getCartQuantityForSelection,
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
  const [cart, setCart] = useState<ShopCart | null>(null);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0);
  const [notice, setNotice] = useState('');
  const [stockWarning, setStockWarning] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomState, setZoomState] = useState<ZoomState>({ open: false, scale: 1, x: 0, y: 0 });
  const galleryThumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const scrollLockRef = useRef<{
    scrollY: number;
    bodyOverflow: string;
    bodyPosition: string;
    bodyTop: string;
    bodyWidth: string;
    htmlOverflow: string;
  } | null>(null);
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
        const [loadedProducts, loadedCategories, cart] = await Promise.all([
          fetchAllShopProducts(),
          fetchShopCategories().catch(() => []),
          fetchCurrentCart().catch(() => null),
        ]);

        if (cancelled) return;

        const preferredSlug =
          loadedProducts.find((candidate) => candidate.slug === slug || candidate.id === slug)?.slug ||
          slug;

        const singleProduct = await fetchShopProduct(preferredSlug);

        if (cancelled) return;

        const resolvedProduct =
          singleProduct ||
          loadedProducts.find((candidate) => candidate.slug === preferredSlug) ||
          null;

        if (!resolvedProduct) {
          setError('Unable to load this product right now.');
          return;
        }

        setProduct(resolvedProduct);
        setAllProducts(loadedProducts);
        setCart(cart);
        setCategories(loadedCategories.length ? loadedCategories : buildFallbackCategoriesFromProducts(loadedProducts));
        setSelectedVariantIds(getInitialVariantSelection(resolvedProduct));
        setGalleryIndex(0);
        setQuantity(1);
        setCartCount(cart?.itemCount ?? 0);
        setStockWarning('');
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

    const scrollY = window.scrollY;
    scrollLockRef.current = {
      scrollY,
      bodyOverflow: document.body.style.overflow,
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyWidth: document.body.style.width,
      htmlOverflow: document.documentElement.style.overflow,
    };

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setZoomState({ open: false, scale: 1, x: 0, y: 0 });
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);

      const lockedScroll = scrollLockRef.current;
      if (!lockedScroll) return;

      document.documentElement.style.overflow = lockedScroll.htmlOverflow;
      document.body.style.overflow = lockedScroll.bodyOverflow;
      document.body.style.position = lockedScroll.bodyPosition;
      document.body.style.top = lockedScroll.bodyTop;
      document.body.style.width = lockedScroll.bodyWidth;
      window.scrollTo(0, lockedScroll.scrollY);
      scrollLockRef.current = null;
    };
  }, [zoomState.open]);

  useEffect(
    () =>
      subscribeToShopCart((nextCart) => {
        setCart(nextCart);
        setCartCount(nextCart.itemCount);
      }),
    [],
  );

  useEffect(() => {
    const refreshCartCount = () => {
      if (document.visibilityState === 'visible') {
        void fetchCurrentCart()
          .then((nextCart) => {
            setCart(nextCart);
            setCartCount(nextCart.itemCount);
          })
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

  useEffect(() => {
    galleryThumbRefs.current[galleryIndex]?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'smooth',
    });
  }, [galleryIndex]);

  const currentImage = galleryImages[galleryIndex] || product?.featuredImage || getPlaceholderImage(product?.title || 'Product');
  const productCategories = useMemo(() => (product ? resolveProductCategories(product, categoryMap) : []), [categoryMap, product]);
  const categoryLabel = productCategories.map((category) => category.name).join(', ');
  const richDescriptionBlocks = useMemo(
    () => buildSafeRichTextBlocks(product?.descriptionHtml || product?.shortDescription || ''),
    [product?.descriptionHtml, product?.shortDescription],
  );
  const currentVariantSelectionMap = useMemo(
    () =>
      buildVariantSelectionMap(
        selectedOptions.map((option, index) => ({
          attributeType: product?.variants[index]?.attributeType || '',
          attributeLabel: product?.variants[index]?.attributeType || '',
          value: String(option?.value || ''),
          valueLabel: String(option?.value || ''),
        })),
      ),
    [product?.variants, selectedOptions],
  );
  const quantityInCart = useMemo(
    () => getCartQuantityForSelection(cart, String(product?.id || ''), currentVariantSelectionMap),
    [cart, currentVariantSelectionMap, product?.id],
  );

  const selectedStock = primaryOption?.stockQuantity ?? product?.stockQuantity ?? 0;
  const availableStock = selectedStock > 0 ? Math.max(selectedStock - quantityInCart, 0) : 0;
  const hasTrackedStock = selectedStock > 0;
  const isOutOfStock =
    product?.hasVariants && primaryOption
      ? !primaryOption.isAvailable || (hasTrackedStock && availableStock <= 0)
      : !product?.isAvailable || (hasTrackedStock && availableStock <= 0);

  useEffect(() => {
    setQuantity((current) => {
      if (current < 1) return 1;
      if (availableStock > 0 && current > availableStock) return availableStock;
      return current;
    });
  }, [availableStock]);

  useEffect(() => {
    if (!notice) return undefined;

    const timer = window.setTimeout(() => {
      setNotice('');
    }, 9000);

    return () => window.clearTimeout(timer);
  }, [notice]);

  const getCartQuantityForVariantOption = (groupIndex: number, optionId: string, optionValue: string): number => {
    if (!product) return 0;

    const nextSelections = { ...currentVariantSelectionMap };
    const attributeType = String(product.variants[groupIndex]?.attributeType || '')
      .trim()
      .toLowerCase();

    if (attributeType) {
      nextSelections[attributeType] = String(optionValue || '').trim().toLowerCase();
    }

    const selectedId = selectedVariantIds[groupIndex];
    if (!selectedId || selectedId !== optionId) {
      return getCartQuantityForSelection(cart, product.id, nextSelections);
    }

    return quantityInCart;
  };

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
    setStockWarning('');

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

      if (availableStock <= 0) {
        setStockWarning('This selected variant is out of stock. Choose another available option.');
        return;
      }

      if (quantity > availableStock) {
        setQuantity(availableStock);
        setStockWarning(
          availableStock === 1
            ? 'Only 1 item is available for this selection.'
            : `Only ${availableStock} items are available for this selection.`,
        );
        return;
      }

      const nextCart = await addItemToCart(product, quantity, variantSelections);
      setCart(nextCart);
      setCartCount(nextCart.itemCount);
      setNotice(`${product.title} is added to cart.`);
    } catch (cartError: any) {
      setStockWarning(
        cartError?.message || 'This selected variant is out of stock. Choose another available option.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleZoomWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
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
    <div className="seamless-shop seamless-shop--product">
      <div className="seamless_breadcrum_container">
        <nav className="seamless-shop__breadcrumb">
          <a href={buildSiteUrl()} >
            Home
          </a>
          <span>/</span>
          <a href={buildShopUrl()} >
            Shop
          </a>
          <span>/</span>
          <span>{product.title}</span>
        </nav>
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
        </div>

      {notice ? (
        <div className={`seamless-shop__alert ${notice.includes('Unable') ? '' : 'seamless-shop__alert--success'}`}>
          {notice}
        </div>
      ) : null}

      <section className="seamless-shop__product-layout">
        <div className="seamless-shop__gallery">
          <div className="seamless-shop__gallery-stage">
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

          {galleryImages.length > 1 ? (
            <div className="seamless-shop__gallery-thumbs" aria-label="Product images">
              {galleryImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  ref={(node) => {
                    galleryThumbRefs.current[index] = node;
                  }}
                  type="button"
                  className={`seamless-shop__gallery-thumb ${galleryIndex === index ? 'seamless-shop__gallery-thumb--active' : ''}`}
                  aria-label={`Show product image ${index + 1}`}
                  aria-current={galleryIndex === index ? 'true' : undefined}
                  onClick={() => setGalleryIndex(index)}
                >
                  <img src={image} alt={`${product.title} ${index + 1}`} loading="lazy" />
                </button>
              ))}
            </div>
          ) : null}
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
                    <div className="seamless-shop__variant-picker">
                      <div className="seamless-shop__variant-options">
                        {group.options.map((option) => {
                          const isSelected = selectedOption?.id === option.id;
                          const optionStockQuantity = Number(option.stockQuantity ?? 0) || 0;
                          const optionCartQuantity = getCartQuantityForVariantOption(groupIndex, option.id, option.value);
                          const optionIsSoldOut = optionStockQuantity > 0 && optionCartQuantity >= optionStockQuantity;
                          const isOptionDisabled = !option.isAvailable || optionIsSoldOut;
                          const hasSwatch = Boolean(option.swatch);
                          const optionClassName = [
                            hasSwatch ? 'seamless-shop__variant-swatch' : 'seamless-shop__button',
                            isSelected ? 'is-selected seamless-shop__button--active' : '',
                            isOptionDisabled ? 'is-disabled' : '',
                          ]
                            .filter(Boolean)
                            .join(' ');

                          return (
                            <div key={option.id} className="seamless-shop__variant-option">
                              <button
                                type="button"
                                data-variant-group-index={groupIndex}
                                data-variant-id={option.id}
                                aria-pressed={isSelected}
                                aria-disabled={isOptionDisabled}
                                aria-label={option.value}
                                disabled={isOptionDisabled}
                                className={optionClassName}
                                style={hasSwatch ? ({ '--swatch-color': option.swatch || '#ffffff' } as React.CSSProperties) : undefined}
                                onClick={() => {
                                  setSelectedVariantIds((current) => {
                                    const next = [...current];
                                    next[groupIndex] = option.id;
                                    return next;
                                  });
                                  setGalleryIndex(0);
                                  setQuantity(1);
                                  setStockWarning('');
                                }}
                              >
                                {hasSwatch ? (
                                  <span className="seamless-shop__variant-swatch-inner">
                                    {isOptionDisabled ? <span className="seamless-shop__swatch-unavailable" /> : null}
                                  </span>
                                ) : (
                                  <span>{formatAttributeLabel(option.value)}</span>
                                )}
                              </button>
                              {isSelected ? (
                                <span className="seamless-shop__variant-label">{option.value}</span>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : null}
          </div>

          <div className="seamless-shop__purchase-row">
            <div className="seamless-shop__quantity">
              <button
                type="button"
                className="seamless-shop__quantity-button"
                disabled={isOutOfStock}
                onClick={() => {
                  setQuantity((current) => Math.max(1, current - 1));
                  setStockWarning('');
                }}
              >
                <Minus className="seamless-shop__icon" />
              </button>
              <span className="seamless-shop__quantity-value">
                {quantity}
              </span>
              <button
                type="button"
                className="seamless-shop__quantity-button"
                disabled={isOutOfStock || (availableStock > 0 && quantity >= availableStock)}
                onClick={() =>
                  {
                    setQuantity((current) => {
                      if (availableStock > 0) return Math.min(availableStock, current + 1);
                      return current + 1;
                    });
                    setStockWarning('');
                  }
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

          {isOutOfStock || stockWarning ? (
            <p className="seamless-shop__stock-note">
              {stockWarning || 'This selected variant is out of stock. Choose another available option.'}
            </p>
          ) : (
            <div className="seamless-shop__trust-note">
              <Check className="seamless-shop__icon" />
              <span>Fast, trackable worldwide shipping available</span>
            </div>
          )}
        </div>
      </section>

      <section className="seamless-shop__section seamless-shop__details-section">
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
        <section className="seamless-shop__section seamless-shop__similar-section">
          <div className="seamless-shop__similar-heading">
            <h2 className="seamless-shop__heading-small">Similar Products</h2>
            <a href={buildShopUrl()} className="seamless-shop__link-primary seamless-shop__heading-small">
              View Collection
            </a>
          </div>
          <div className="seamless-shop__similar-grid">
            {similarProducts.map((item) => (
              <article key={item.id} className="seamless-shop__similar-item">
                <a href={buildProductUrl(item)} className="seamless-shop__similar-link">
                  <div className="seamless-shop__similar-image-frame">
                    <img
                      src={item.featuredImage || getPlaceholderImage(item.title)}
                      alt={item.title}
                      loading="lazy"
                      className="seamless-shop__similar-image"
                    />
                    <span className="seamless-shop__similar-overlay">View Item</span>
                  </div>
                </a>
                <div className="seamless-shop__similar-copy">
                  <h3 className="seamless-shop__similar-title">
                    <a href={buildProductUrl(item)}>
                      {item.title}
                    </a>
                  </h3>
                  <strong className="seamless-shop__similar-price">{item.priceLabel}</strong>
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

const getProductTypeLabel = (value: string): string => {
  const config = (window as any).seamlessReactConfig || {};
  if (String(value || '').toLowerCase() === 'physical') {
    return String(config.shopProductTypeLabel || 'Physical');
  }

  return formatAttributeLabel(value || 'physical');
};
