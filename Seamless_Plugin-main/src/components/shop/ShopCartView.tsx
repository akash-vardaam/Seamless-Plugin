import React, { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { LoadingSpinner } from '../LoadingSpinner';
import {
  fetchCurrentCart,
  removeCartItem,
  subscribeToShopCart,
  updateCartItemQuantity,
} from '../../services/shopService';
import type { ShopCart, ShopCartItem } from '../../types/shop';
import { buildCheckoutUrl, buildShopUrl, formatCurrency, getGuestToken } from '../../utils/shopHelpers';

export const ShopCartView: React.FC = () => {
  const [cart, setCart] = useState<ShopCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [itemMessages, setItemMessages] = useState<Record<string, string>>({});
  const [pendingQuantities, setPendingQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    void loadCart();
  }, []);

  useEffect(
    () =>
      subscribeToShopCart((nextCart) => {
        setCart(nextCart);
        setPendingQuantities({});
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
      setPendingQuantities({});
      setItemMessages({});
    } catch (cartError: any) {
      setError(cartError?.message || 'Unable to load cart right now.');
    } finally {
      setLoading(false);
    }
  };

  const items = cart?.items || [];
  const isEmpty = !items.length;

  const displayedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        displayQuantity: pendingQuantities[item.key] ?? item.quantity,
      })),
    [items, pendingQuantities],
  );

  const handlePendingQuantityChange = (item: ShopCartItem, nextQuantity: number) => {
    const normalizedQuantity = Math.max(1, nextQuantity);

    setItemMessages((current) => ({ ...current, [item.key]: '' }));
    setPendingQuantities((current) => {
      if (normalizedQuantity === item.quantity) {
        const next = { ...current };
        delete next[item.key];
        return next;
      }

      return { ...current, [item.key]: normalizedQuantity };
    });
  };

  const applyUpdates = async () => {
    if (!Object.keys(pendingQuantities).length) return;

    setUpdating(true);
    setStatusMessage('');

    for (const [itemKey, desiredQuantity] of Object.entries(pendingQuantities)) {
      const item = items.find((entry) => entry.key === itemKey);
      if (!item) continue;

      try {
        await updateCartItemQuantity(item, desiredQuantity);
      } catch {
        setItemMessages((current) => ({
          ...current,
          [itemKey]: item.stockMessage || 'Only this quantity is available for this product.',
        }));
      }
    }

    await loadCart();
    setUpdating(false);
    setStatusMessage('Cart updated.');

    window.setTimeout(() => {
      setStatusMessage('');
    }, 1800);
  };

  const handleRemove = async (itemKey: string) => {
    setUpdating(true);
    try {
      const nextCart = await removeCartItem(itemKey);
      setCart(nextCart);
      setPendingQuantities((current) => {
        const next = { ...current };
        delete next[itemKey];
        return next;
      });
      setItemMessages((current) => {
        const next = { ...current };
        delete next[itemKey];
        return next;
      });
    } catch (removeError: any) {
      setError(removeError?.message || 'Unable to remove this item right now.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="seamless-shop">
      <nav className="seamless-shop__breadcrumb">
        <a href={getHomeUrl()} >
          Home
        </a>
        <span>/</span>
        <a href={buildShopUrl()} >
          Shop
        </a>
        <span>/</span>
        <span>Cart</span>
        <a href={buildShopUrl()} className="seamless-shop__breadcrumb-cart">
          Continue Shopping
        </a>
      </nav>

      {error ? (
        <div className="seamless-shop__alert">
          {error}
        </div>
      ) : null}

      {isEmpty ? (
        <div className="seamless-shop__empty">
          <h2 className="seamless-shop__title-lg">Your cart is currently empty.</h2>
          <a
            href={buildShopUrl()}
            className="seamless-shop__button-link seamless-shop__mt-5"
          >
            Return to Shop
          </a>
        </div>
      ) : (
        <div className="seamless-shop__cart-layout">
          <div className="seamless-shop__cart-items">
            {displayedItems.map((item) => {
              const incrementDisabled = (item.maxQuantity > 0 && item.displayQuantity >= item.maxQuantity) || !item.canIncrement;

              return (
                <article key={item.key} className="seamless-shop__cart-item">
                  <div className="seamless-shop__cart-item-main">
                    <div className="seamless-shop__cart-image">
                      <img src={item.imageUrl} alt={item.productName} className="seamless-shop__image" loading="lazy" />
                    </div>
                    <div className="seamless-shop__cart-details">
                      <div>
                        <h3 className="seamless-shop__title-lg">{item.productName}</h3>
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
                          onClick={() => handlePendingQuantityChange(item, item.displayQuantity - 1)}
                        >
                          <Minus className="seamless-shop__icon" />
                        </button>
                        <span className="seamless-shop__quantity-value">
                          {item.displayQuantity}
                        </span>
                        <button
                          type="button"
                          disabled={incrementDisabled}
                          className="seamless-shop__quantity-button"
                          onClick={() => {
                            if (item.maxQuantity > 0 && item.displayQuantity >= item.maxQuantity) {
                              setItemMessages((current) => ({
                                ...current,
                                [item.key]: `Only ${item.maxQuantity} available for this product.`,
                              }));
                              return;
                            }

                            if (!item.canIncrement) {
                              setItemMessages((current) => ({
                                ...current,
                                [item.key]: item.stockMessage || 'Only this quantity is available for this product.',
                              }));
                              return;
                            }

                            handlePendingQuantityChange(item, item.displayQuantity + 1);
                          }}
                        >
                          <Plus className="seamless-shop__icon" />
                        </button>
                      </div>

                      {itemMessages[item.key] ? (
                        <p className="seamless-shop__stock-note">{itemMessages[item.key]}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="seamless-shop__cart-actions">
                    <div className="seamless-shop__cart-price">
                      <strong className="seamless-shop__price">{formatCurrency(item.subtotal)}</strong>
                      <span className="seamless-shop__muted">{formatCurrency(item.unitPrice)} each</span>
                    </div>
                    <button
                      type="button"
                      className="seamless-shop__remove-button"
                      onClick={() => void handleRemove(item.key)}
                    >
                      <Trash2 className="seamless-shop__icon" />
                      <span>Remove</span>
                    </button>
                  </div>
                </article>
              );
            })}

            <div className="seamless-shop__update-row">
              <button
                type="button"
                disabled={!Object.keys(pendingQuantities).length || updating}
                className="seamless-shop__primary-button"
                onClick={() => void applyUpdates()}
              >
                {updating ? 'Updating...' : 'Update Cart'}
              </button>
              {statusMessage ? <span className="seamless-shop__success-text">{statusMessage}</span> : null}
            </div>
          </div>

          <aside className="seamless-shop__summary">
            <h3 className="seamless-shop__title-lg">Order Summary</h3>
            <div className="seamless-shop__summary-lines">
              <div className="seamless-shop__summary-line">
                <span>Subtotal</span>
                <span>{formatCurrency(cart?.subtotal || 0)}</span>
              </div>
              <div className="seamless-shop__summary-line seamless-shop__summary-line--total">
                <span>Total</span>
                <span>{formatCurrency(cart?.total || 0)}</span>
              </div>
            </div>
            <a
              href={buildCheckoutUrl(getGuestToken())}
              className="seamless-shop__primary-button seamless-shop__primary-button--full seamless-shop__mt-6"
            >
              <ShoppingCart className="seamless-shop__icon" />
              <span>Proceed to Checkout</span>
            </a>
            <p className="seamless-shop__muted seamless-shop__mt-4">Taxes and shipping calculated at checkout.</p>
          </aside>
        </div>
      )}
    </div>
  );
};

const getHomeUrl = (): string => {
  const config = (window as any).seamlessReactConfig || {};
  return String(config.siteUrl || window.location.origin).replace(/\/+$/g, '');
};

