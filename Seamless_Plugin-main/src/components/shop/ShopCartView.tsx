import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Minus, Plus, ShoppingCart } from 'lucide-react';
import { LoadingSpinner } from '../LoadingSpinner';
import {
  fetchCurrentCart,
  removeCartItem,
  subscribeToShopCart,
  updateCartItemQuantity,
} from '../../services/shopService';
import type { ShopCart, ShopCartItem } from '../../types/shop';
import { buildCheckoutUrl, buildProductUrl, buildShopUrl, formatCurrency, getGuestToken } from '../../utils/shopHelpers';

type DraftQuantities = Record<string, number>;

const getHomeUrl = (): string => {
  const config = (window as any).seamlessReactConfig || {};
  return String(config.siteUrl || window.location.origin).replace(/\/+$/g, '');
};

const getItemIdentifier = (item: ShopCartItem): string =>
  String(item.key || item.id || item.raw?.['key'] || item.raw?.['item_key'] || item.raw?.['id'] || '');

export const ShopCartView: React.FC = () => {
  const [cart, setCart] = useState<ShopCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [draftQuantities, setDraftQuantities] = useState<DraftQuantities>({});
  const [itemMessages, setItemMessages] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusIsError, setStatusIsError] = useState(false);

  useEffect(() => {
    void loadCart();
  }, []);

  useEffect(
    () =>
      subscribeToShopCart((nextCart) => {
        setCart(nextCart);
        setDraftQuantities({});
        setItemMessages({});
      }),
    [],
  );

  const loadCart = async () => {
    setLoading(true);
    setError(null);

    try {
      const loadedCart = await fetchCurrentCart();
      setCart(loadedCart);
      setDraftQuantities({});
      setItemMessages({});
      setStatusMessage(null);
      setStatusIsError(false);
    } catch (cartError: any) {
      setError(cartError?.message || 'Unable to load cart right now.');
    } finally {
      setLoading(false);
    }
  };

  const items = cart?.items || [];
  const isEmpty = !items.length;

  const getAvailableQuantityMessage = (item: ShopCartItem): string =>
    item.maxQuantity > 0
      ? `Only ${item.maxQuantity} item${item.maxQuantity === 1 ? ' is' : 's are'} available in stock.`
      : item.stockMessage || 'Requested quantity is not available.';

  const getDisplayedQuantity = (item: ShopCartItem): number => {
    const itemIdentifier = getItemIdentifier(item);
    return Math.max(1, draftQuantities[itemIdentifier] ?? item.quantity);
  };

  const hasPendingUpdates = useMemo(
    () => items.some((item) => getDisplayedQuantity(item) !== item.quantity),
    [draftQuantities, items],
  );

  const handleQuantityDraftChange = (item: ShopCartItem, desiredQuantity: number) => {
    const itemIdentifier = getItemIdentifier(item);
    if (!itemIdentifier) {
      setError('Unable to update this cart item right now.');
      return;
    }

    const nextQuantity = Math.max(1, desiredQuantity);
    const cappedQuantity =
      item.maxQuantity > 0 ? Math.min(nextQuantity, item.maxQuantity) : nextQuantity;

    setError(null);
    setStatusMessage(null);
    setStatusIsError(false);
    setItemMessages((current) => {
      const next = { ...current };
      delete next[itemIdentifier];

      if (item.maxQuantity > 0 && nextQuantity > item.maxQuantity) {
        next[itemIdentifier] = getAvailableQuantityMessage(item);
      }

      return next;
    });

    setDraftQuantities((current) => {
      if (cappedQuantity === item.quantity) {
        const next = { ...current };
        delete next[itemIdentifier];
        return next;
      }

      return {
        ...current,
        [itemIdentifier]: cappedQuantity,
      };
    });
  };

  const handleApplyUpdates = async () => {
    if (!hasPendingUpdates) return;

    setSaving(true);
    setError(null);
    setStatusMessage(null);
    setStatusIsError(false);

    let hadFailures = false;
    const nextMessages: Record<string, string> = {};

    for (const item of items) {
      const itemIdentifier = getItemIdentifier(item);
      const desiredQuantity = Math.max(1, draftQuantities[itemIdentifier] ?? item.quantity);
      if (!itemIdentifier || desiredQuantity === item.quantity) continue;

      try {
        await updateCartItemQuantity(item, desiredQuantity);
      } catch (updateError: any) {
        hadFailures = true;
        nextMessages[itemIdentifier] = String(updateError?.message || getAvailableQuantityMessage(item));
      }
    }

    const nextCart = await fetchCurrentCart();
    setCart(nextCart);
    setDraftQuantities({});
    setItemMessages(nextMessages);
    setStatusMessage(hadFailures ? 'Some cart items could not be updated.' : 'Cart updated.');
    setStatusIsError(hadFailures);
    setSaving(false);
  };

  const handleRemove = async (item: ShopCartItem) => {
    const itemIdentifier = getItemIdentifier(item);
    if (!itemIdentifier) {
      setError('Unable to remove this cart item right now.');
      return;
    }

    setRemovingKey(itemIdentifier);
    setError(null);
    setStatusMessage(null);
    setStatusIsError(false);

    try {
      const nextCart = await removeCartItem(item, getDisplayedQuantity(item));
      setCart(nextCart);
      setDraftQuantities((current) => {
        const next = { ...current };
        delete next[itemIdentifier];
        return next;
      });
      setItemMessages((current) => {
        const next = { ...current };
        delete next[itemIdentifier];
        return next;
      });
    } catch (removeError: any) {
      setError(removeError?.message || 'Unable to remove this item right now.');
    } finally {
      setRemovingKey(null);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="seamless-shop">
      {error ? <div className="seamless-shop__alert">{error}</div> : null}

      {isEmpty ? (
        <div className="seamless-shop__empty">
          <h2 className="seamless-shop__title-lg">Your cart is currently empty.</h2>
          <a href={buildShopUrl()} className="seamless-shop__button-link seamless-shop__mt-5">
            Return to Shop
          </a>
        </div>
      ) : (
        <>
          <div className="seamless-shop__cart-header">
            <nav className="seamless-shop__breadcrumb">
              <a href={getHomeUrl()}>Home</a>
              <span>/</span>
              <a href={buildShopUrl()}>Shop</a>
              <span>/</span>
              <span>Cart</span>
            </nav>
            <a href={buildShopUrl()} className="seamless-shop__cart-backlink shopping-cart__button-link">
              <ArrowLeft className="seamless-shop__icon" />
              <span>Continue Shopping</span>
            </a>
          </div>

          <div className="seamless-shop__cart-layout">
            <div className="seamless-shop__cart-items">
              {items.map((item) => {
                const itemIdentifier = getItemIdentifier(item);
                const displayedQuantity = getDisplayedQuantity(item);
                const incrementDisabled =
                  saving ||
                  removingKey === itemIdentifier ||
                  (item.maxQuantity > 0 && displayedQuantity >= item.maxQuantity) ||
                  !item.canIncrement;
                const decrementDisabled = saving || removingKey === itemIdentifier || displayedQuantity <= 1;
                const itemMessage =
                  itemMessages[itemIdentifier] ||
                  ((item.maxQuantity > 0 && displayedQuantity >= item.maxQuantity)
                    ? getAvailableQuantityMessage(item)
                    : '');

                return (
                  <article key={itemIdentifier || item.productId} className="seamless-shop__cart-item">
                    <div className="seamless-shop__cart-item-main">
                      <a
                        href={buildProductUrl({ id: item.productId, slug: '', title: item.productName })}
                        className="seamless-shop__cart-image"
                      >
                        <img src={item.imageUrl} alt={item.productName} className="seamless-shop__image" loading="lazy" />
                      </a>
                      <div className="seamless-shop__cart-details">
                        <div className="seamless-shop__cart-copy">
                          <h3 className="seamless-shop__title-lg">
                            <a href={buildProductUrl({ id: item.productId, slug: '', title: item.productName })}>
                              {item.productName}
                            </a>
                          </h3>
                          {item.variantSelections.length ? (
                            <p className="seamless-shop__muted">
                              {item.variantSelections
                                .map((selection) =>
                                  selection.attributeLabel
                                    ? `${selection.attributeLabel}: ${selection.valueLabel || selection.value}`
                                    : selection.valueLabel || selection.value,
                                )
                                .join(', ')}
                            </p>
                          ) : null}
                        </div>

                        <div className="seamless-shop__quantity">
                          <button
                            type="button"
                            className="seamless-shop__quantity-button"
                            disabled={decrementDisabled}
                            onClick={() => handleQuantityDraftChange(item, displayedQuantity - 1)}
                          >
                            <Minus className="seamless-shop__icon" />
                          </button>
                          <span className="seamless-shop__quantity-value">{displayedQuantity}</span>
                          <button
                            type="button"
                            disabled={incrementDisabled}
                            className="seamless-shop__quantity-button"
                            onClick={() => handleQuantityDraftChange(item, displayedQuantity + 1)}
                          >
                            <Plus className="seamless-shop__icon" />
                          </button>
                        </div>

                        {itemMessage ? <p className="seamless-shop__stock-note">{itemMessage}</p> : null}
                      </div>
                    </div>

                    <div className="seamless-shop__cart-actions">
                      <div className="seamless-shop__cart-price">
                        <strong className="seamless-shop__price">
                          {formatCurrency(item.unitPrice * displayedQuantity)}
                        </strong>
                        <span className="seamless-shop__muted">{formatCurrency(item.unitPrice)} each</span>
                      </div>
                      <button
                        type="button"
                        className="seamless-shop__primary-button seamless-shop__cart-remove"
                        disabled={saving || removingKey === itemIdentifier}
                        onClick={() => void handleRemove(item)}
                      >
                        <span>{removingKey === itemIdentifier ? 'Removing...' : 'Remove'}</span>
                      </button>
                    </div>
                  </article>
                );
              })}

              <div className="seamless-shop__cart-footer">
                <button
                  type="button"
                  className="seamless-shop__primary-button seamless-shop__cart-update"
                  disabled={saving || !hasPendingUpdates}
                  onClick={() => void handleApplyUpdates()}
                >
                  <span>{saving ? 'Updating...' : 'Update Cart'}</span>
                </button>
                {statusMessage ? (
                  <p
                    className={`seamless-shop__cart-status ${
                      statusIsError ? 'seamless-shop__cart-status--error' : 'seamless-shop__cart-status--success'
                    }`}
                  >
                    {statusMessage}
                  </p>
                ) : null}
              </div>
            </div>

            <aside className="seamless-shop__summary">
              <h3 className="seamless-shop__title-lg">Order Summary</h3>
              <div className="seamless-shop__summary-lines">
                <div className="seamless-shop__summary-line">
                  <span>Subtotal</span>
                  <span>
                    {formatCurrency(
                      items.reduce((total, item) => total + item.unitPrice * getDisplayedQuantity(item), 0),
                    )}
                  </span>
                </div>
                <div className="seamless-shop__summary-line seamless-shop__summary-line--total">
                  <span>Total</span>
                  <span>
                    {formatCurrency(
                      items.reduce((total, item) => total + item.unitPrice * getDisplayedQuantity(item), 0),
                    )}
                  </span>
                </div>
              </div>
              <button
                onClick={() => window.location.href = buildCheckoutUrl(getGuestToken())}
                className="seamless-shop__primary-button seamless-shop__primary-button--full seamless-shop__mt-6"
              >
                <ShoppingCart className="seamless-shop__icon" />
                <span>Proceed to Checkout</span>
              </button>
              <p className="seamless-shop__muted seamless-shop__mt-4">Taxes and shipping calculated at checkout.</p>
            </aside>
          </div>
        </>
      )}
    </div>
  );
};
