'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/stores/cart-store';
import { usePrice } from '@/lib/hooks/usePrice';
import { products } from '@/data/products';
import { createClient } from '@/lib/supabase/client';
import { load as loadCashfree } from '@cashfreepayments/cashfree-js';

type Step = 'shipping' | 'payment' | 'review';

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('shipping');
  const cartItems = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const totalPrice = useCartStore((s) => s.items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  const { formatPrice } = usePrice();
  // Guard against duplicate order submissions
  const submittingRef = useRef(false);

  const [shippingAddress, setShippingAddress] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    pinCode: '',
    phone: '',
  });

  const [shippingError, setShippingError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cashfree' | 'cod'>('cashfree');
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [isCouponError, setIsCouponError] = useState(false);

  const steps: Step[] = ['shipping', 'payment', 'review'];
  const finalTotal = Math.max(0, totalPrice - discountAmount);

  // Pre-fill email from authenticated user session
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setShippingAddress((prev) =>
          prev.email ? prev : { ...prev, email: data.user?.email ?? '' },
        );
      }
    });
  }, []);

  const validateShipping = () => {
    if (!shippingAddress.firstName.trim()) {
      setShippingError('Please enter your first name.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!shippingAddress.email.trim() || !emailRegex.test(shippingAddress.email)) {
      setShippingError('Please enter a valid email address for your order confirmation.');
      return false;
    }
    if (!shippingAddress.address1.trim()) {
      setShippingError('Please enter your street address.');
      return false;
    }
    if (!shippingAddress.city.trim()) {
      setShippingError('Please enter your city.');
      return false;
    }
    if (!shippingAddress.state.trim()) {
      setShippingError('Please enter your state.');
      return false;
    }
    if (!shippingAddress.pinCode.trim()) {
      setShippingError('Please enter your PIN / Postal code.');
      return false;
    }
    const pinRegex = /^\d{5,10}$/;
    if (!pinRegex.test(shippingAddress.pinCode.trim())) {
      setShippingError('Please enter a valid PIN / Postal code (5-10 digits).');
      return false;
    }
    if (shippingAddress.phone) {
      const cleanDigits = shippingAddress.phone.replace(/[^0-9]/g, '');
      if (cleanDigits.length < 10 || cleanDigits.length > 13) {
        setShippingError('Please enter a valid 10-digit phone number (e.g. 9876543210).');
        return false;
      }
    }
    setShippingError('');
    return true;
  };

  const handleContinueToPayment = () => {
    if (validateShipping()) {
      setStep('payment');
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponMsg('Validating...');
    setIsCouponError(false);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon(couponCode);
        setCouponMsg(data.message);
        setIsCouponError(false);
        if (data.discountType === 'percentage') {
          setDiscountAmount(totalPrice * (data.discountValue / 100));
        } else {
          setDiscountAmount(data.discountValue);
        }
      } else {
        setCouponMsg(data.message);
        setIsCouponError(true);
        setAppliedCoupon(null);
        setDiscountAmount(0);
      }
    } catch {
      setCouponMsg('Error validating coupon');
      setIsCouponError(true);
    }
  };

  const handlePlaceOrder = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;

    if (cartItems.length === 0) {
      setCheckoutError('Your cart is empty. Please add items before checking out.');
      submittingRef.current = false;
      return;
    }

    if (!validateShipping()) {
      setStep('shipping');
      submittingRef.current = false;
      return;
    }

    setLoading(true);
    setCheckoutError(null);

    try {
      const fullName =
        `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim() || 'Valued Customer';
      const fullStreet =
        `${shippingAddress.address1} ${shippingAddress.address2}`.trim() ||
        shippingAddress.address1;

      const payload = {
        items: cartItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || 'default',
          quantity: item.quantity,
          price: item.price,
          size: item.size || null,
          customization: item.customization || null,
        })),
        address: {
          name: fullName,
          email: shippingAddress.email,
          street: fullStreet,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zip: shippingAddress.pinCode,
          country: 'India',
          phone: shippingAddress.phone || undefined,
        },
        paymentMethod: paymentMethod === 'cod' ? 'cod' : 'cashfree',
        couponCode: appliedCoupon || undefined,
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        let errStr = data.message || 'Checkout failed';
        if (data.errors) {
          const detail = Object.entries(data.errors)
            .map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
            .join('\n');
          errStr += `:\n${detail}`;
        }
        setCheckoutError(errStr);
        setLoading(false);
        submittingRef.current = false;
        return;
      }

      if (data.isCod) {
        clearCart();
        router.push(`/payment/status?order_id=${data.cashfreeOrderId || data.orderId}`);
      } else {
        if (!data.paymentSessionId) {
          setCheckoutError('Payment session could not be initialized. Please try again.');
          setLoading(false);
          submittingRef.current = false;
          return;
        }

        // Initialize Cashfree JS SDK
        const cashfree = await loadCashfree({
          mode: data.cashfreeEnvironment === 'production' ? 'production' : 'sandbox',
        });

        // Trigger Cashfree checkout redirect
        await cashfree.checkout({
          paymentSessionId: data.paymentSessionId,
          redirectTarget: '_self',
        });
      }
    } catch (err) {
      console.error('Checkout execution error:', err);
      setCheckoutError('An unexpected error occurred during checkout. Please try again.');
      setLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <main className="pt-36 md:pt-40 pb-20">
      <div className="section-container max-w-4xl">
        <h1 className="font-display text-display-lg font-bold text-bone mb-8">Checkout</h1>

        {/* Step indicator */}
        <div className="flex items-center gap-4 mb-12">
          {steps.map((s, i) => (
            <button
              key={s}
              onClick={() => {
                if (s === 'shipping') {
                  setStep(s);
                } else if (validateShipping()) {
                  setStep(s);
                }
              }}
              className={`flex items-center gap-2 ${step === s ? 'text-cobalt' : 'text-ash'}`}
            >
              <span
                className={`w-8 h-8 rounded-full border font-mono text-caption flex items-center justify-center ${
                  step === s ? 'border-cobalt bg-cobalt/10 text-cobalt' : 'border-smoke text-ash'
                }`}
              >
                {i + 1}
              </span>
              <span className="font-mono text-caption uppercase tracking-wider hidden sm:block">
                {s}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form area */}
          <div className="lg:col-span-2">
            {checkoutError && (
              <div className="mb-6 p-4 bg-ember/10 border border-ember/50 rounded-lg flex items-start gap-3">
                <span className="text-ember text-lg leading-none mt-0.5">⚠</span>
                <div className="flex-1">
                  <p className="font-mono text-caption text-ember whitespace-pre-line">
                    {checkoutError}
                  </p>
                </div>
                <button
                  onClick={() => setCheckoutError(null)}
                  aria-label="Dismiss error"
                  className="text-ember/60 hover:text-ember font-mono text-caption leading-none ml-2"
                >
                  ✕
                </button>
              </div>
            )}
            {step === 'shipping' && (
              <div className="bg-graphite border border-smoke rounded-lg p-6 md:p-8">
                <h2 className="font-display text-display-sm font-bold text-bone mb-6">
                  Shipping Address
                </h2>

                {shippingError && (
                  <div className="mb-6 p-4 bg-ember/10 border border-ember/40 rounded text-ember font-mono text-caption">
                    {shippingError}
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      placeholder="First name *"
                      aria-label="First name"
                      value={shippingAddress.firstName}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, firstName: e.target.value })
                      }
                      className="bg-charcoal border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
                    />
                    <input
                      placeholder="Last name"
                      aria-label="Last name"
                      value={shippingAddress.lastName}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, lastName: e.target.value })
                      }
                      className="bg-charcoal border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="Email address * (for order confirmation)"
                    aria-label="Email address"
                    autoComplete="email"
                    value={shippingAddress.email}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, email: e.target.value })
                    }
                    className="bg-charcoal border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
                  />
                  <input
                    placeholder="Address line 1 *"
                    aria-label="Address line 1"
                    value={shippingAddress.address1}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, address1: e.target.value })
                    }
                    className="bg-charcoal border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
                  />
                  <input
                    placeholder="Address line 2 (optional)"
                    aria-label="Address line 2"
                    value={shippingAddress.address2}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, address2: e.target.value })
                    }
                    className="bg-charcoal border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <input
                      placeholder="City *"
                      aria-label="City"
                      value={shippingAddress.city}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, city: e.target.value })
                      }
                      className="bg-charcoal border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
                    />
                    <input
                      placeholder="State *"
                      aria-label="State"
                      value={shippingAddress.state}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, state: e.target.value })
                      }
                      className="bg-charcoal border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
                    />
                    <input
                      placeholder="PIN Code *"
                      aria-label="PIN Code"
                      value={shippingAddress.pinCode}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, pinCode: e.target.value })
                      }
                      className="bg-charcoal border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
                    />
                  </div>
                  <input
                    placeholder="Phone number"
                    aria-label="Phone number"
                    value={shippingAddress.phone}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, phone: e.target.value })
                    }
                    className="bg-charcoal border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
                  />
                  <button
                    onClick={handleContinueToPayment}
                    className="self-end px-8 py-3 bg-cobalt text-bone font-mono text-caption uppercase tracking-widest mt-4 hover:bg-cobalt/90 transition-colors"
                  >
                    Continue to Payment →
                  </button>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div className="bg-graphite border border-smoke rounded-lg p-6 md:p-8">
                <h2 className="font-display text-display-sm font-bold text-bone mb-6">
                  Payment Method
                </h2>
                <div className="flex flex-col gap-4">
                  <label
                    className={`flex items-center gap-3 p-4 border rounded-sm cursor-pointer transition-colors ${
                      paymentMethod === 'cashfree'
                        ? 'border-cobalt bg-cobalt/5'
                        : 'border-smoke hover:border-pearl'
                    }`}
                    onClick={() => setPaymentMethod('cashfree')}
                  >
                    <div
                      className={`w-4 h-4 border rounded-full flex items-center justify-center ${paymentMethod === 'cashfree' ? 'border-cobalt' : 'border-pearl'}`}
                    >
                      {paymentMethod === 'cashfree' && (
                        <div className="w-2 h-2 bg-cobalt rounded-full" />
                      )}
                    </div>
                    <div>
                      <span className="font-mono text-body-sm text-bone block font-bold">
                        Online Payment (UPI, Credit/Debit Cards, Netbanking, Wallets)
                      </span>
                      <span className="font-mono text-caption text-pearl block mt-0.5">
                        Secured via Cashfree Payments
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-4 border rounded-sm cursor-pointer transition-colors ${
                      paymentMethod === 'cod'
                        ? 'border-cobalt bg-cobalt/5'
                        : 'border-smoke hover:border-pearl'
                    }`}
                    onClick={() => setPaymentMethod('cod')}
                  >
                    <div
                      className={`w-4 h-4 border rounded-full flex items-center justify-center ${paymentMethod === 'cod' ? 'border-cobalt' : 'border-pearl'}`}
                    >
                      {paymentMethod === 'cod' && (
                        <div className="w-2 h-2 bg-cobalt rounded-full" />
                      )}
                    </div>
                    <div>
                      <span className="font-mono text-body-sm text-bone block font-bold">
                        Cash on Delivery (COD)
                      </span>
                      <span className="font-mono text-caption text-pearl block mt-0.5">
                        Pay upon physical delivery at your doorstep
                      </span>
                    </div>
                  </label>

                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <button
                      onClick={() => setStep('shipping')}
                      className="w-full sm:w-auto px-6 py-3 border border-smoke text-pearl font-mono text-caption uppercase tracking-widest hover:border-pearl transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => setStep('review')}
                      className="w-full sm:w-auto px-8 py-3 bg-cobalt text-bone font-mono text-caption uppercase tracking-widest hover:bg-cobalt/90 transition-colors"
                    >
                      Review Order →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 'review' && (
              <div className="bg-graphite border border-smoke rounded-lg p-6 md:p-8">
                <h2 className="font-display text-display-sm font-bold text-bone mb-6">
                  Review Order
                </h2>
                <div className="text-pearl text-body-sm mb-6 space-y-4">
                  <p>
                    <strong>Shipping To:</strong> {shippingAddress.firstName}{' '}
                    {shippingAddress.lastName}, {shippingAddress.address1}, {shippingAddress.city},{' '}
                    {shippingAddress.state} {shippingAddress.pinCode}
                  </p>
                  <p>
                    <strong>Payment Method:</strong>{' '}
                    {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment (Cashfree)'}
                  </p>
                  <p>
                    <strong>Items ({cartItems.length}):</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    {cartItems.map((item, i) => {
                      const product = products.find((p) => p.id === item.productId);
                      const variant = product?.variants.find((v) => v.id === item.variantId);
                      return (
                        <li key={i} className="font-mono text-caption text-pearl">
                          {product?.name ?? item.productId}
                          {variant ? ` — ${variant.name}` : ''}
                          {item.size ? ` (${item.size})` : ''} × {item.quantity}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <button
                    onClick={() => setStep('payment')}
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-3 border border-smoke text-pearl font-mono text-caption uppercase tracking-widest hover:border-pearl transition-colors disabled:opacity-50"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-3 bg-cobalt text-bone font-mono text-caption uppercase tracking-widest hover:bg-cobalt/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading && (
                      <div className="w-4 h-4 border-2 border-bone border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>{loading ? 'Initiating Payment...' : 'Place Order →'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-graphite border border-smoke rounded-lg p-6 h-fit sticky top-24">
            <h2 className="font-display text-body-lg text-bone mb-4">Summary</h2>

            <div className="mb-6 pb-6 border-b border-smoke/30">
              <label className="font-mono text-caption uppercase tracking-widest text-ash block mb-2">
                Discount Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="bg-charcoal border border-smoke text-bone font-mono text-body-sm px-3 py-2 w-full focus:outline-none focus:border-cobalt"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="bg-smoke/30 hover:bg-smoke/50 text-bone px-4 font-mono text-caption uppercase"
                >
                  Apply
                </button>
              </div>
              {couponMsg && (
                <p
                  className={`mt-2 font-mono text-caption ${isCouponError ? 'text-ember' : 'text-emerald-400'}`}
                >
                  {couponMsg}
                </p>
              )}
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-smoke/30">
              <span className="font-mono text-caption uppercase tracking-widest text-ash">
                Subtotal
              </span>
              <span className="font-mono text-body-sm text-bone">{formatPrice(totalPrice)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between items-center py-4 border-b border-smoke/30">
                <span className="font-mono text-caption uppercase tracking-widest text-emerald-400">
                  Discount
                </span>
                <span className="font-mono text-body-sm text-emerald-400">
                  -{formatPrice(discountAmount)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center py-4 border-b border-smoke/30">
              <span className="font-mono text-caption uppercase tracking-widest text-ash">
                Shipping
              </span>
              <span className="font-mono text-body-sm text-bone">{formatPrice(0)}</span>
            </div>
            <div className="flex justify-between items-center pt-4">
              <span className="font-mono text-body-md uppercase tracking-widest text-bone">
                Total
              </span>
              <span className="font-mono text-display-sm text-bone">{formatPrice(finalTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
