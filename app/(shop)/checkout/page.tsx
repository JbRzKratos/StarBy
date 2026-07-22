'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/stores/cart-store';
import { usePrice } from '@/lib/hooks/usePrice';

type Step = 'shipping' | 'payment' | 'review';

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('shipping');
  const cartItems = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const { formatPrice } = usePrice();

  const [shippingAddress, setShippingAddress] = useState({
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    pinCode: '',
    phone: '',
  });

  const [shippingError, setShippingError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [loading, setLoading] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [isCouponError, setIsCouponError] = useState(false);

  const steps: Step[] = ['shipping', 'payment', 'review'];
  const finalTotal = Math.max(0, totalPrice() - discountAmount);

  useEffect(() => {
    // Dynamically load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const validateShipping = () => {
    if (!shippingAddress.firstName.trim()) {
      setShippingError('Please enter your first name.');
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
          setDiscountAmount(totalPrice() * (data.discountValue / 100));
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
    if (cartItems.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    if (!validateShipping()) {
      setStep('shipping');
      return;
    }

    setLoading(true);

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
          street: fullStreet,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zip: shippingAddress.pinCode,
          country: 'India',
          phone: shippingAddress.phone || undefined,
        },
        paymentMethod: paymentMethod === 'cod' ? 'cod' : 'upi',
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
        alert(errStr);
        setLoading(false);
        return;
      }

      if (data.isCod) {
        clearCart();
        router.push('/account/orders');
      } else {
        const razorpayKey =
          data.razorpayKeyId ||
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
          'rzp_test_TGZ1O4UGYD5ArS';

        const options = {
          key: razorpayKey,
          amount: Math.round(data.amount * 100),
          currency: 'INR',
          name: 'StarBy',
          description: 'Premium Device Skins & Apparel',
          order_id: data.razorpayOrderId,
          handler: async function (response: any) {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: data.orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              clearCart();
              router.push('/account/orders');
            } else {
              alert('Payment verification failed: ' + (verifyData.message || 'Unknown error'));
            }
          },
          prefill: {
            name: fullName,
            contact: shippingAddress.phone,
          },
          theme: {
            color: '#1a1a1a',
          },
        };

        if (typeof (window as any).Razorpay !== 'undefined') {
          const rzp = new (window as any).Razorpay(options);
          rzp.on('payment.failed', function (response: any) {
            alert('Payment Failed: ' + (response.error?.description || 'Transaction cancelled'));
          });
          rzp.open();
        } else {
          alert(
            'Razorpay gateway script is still loading. Please click Place Order again in 2 seconds.',
          );
        }
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred during checkout.');
      setLoading(false);
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
                if (s === 'shipping' || validateShipping()) {
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
                      value={shippingAddress.firstName}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, firstName: e.target.value })
                      }
                      className="bg-charcoal border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
                    />
                    <input
                      placeholder="Last name"
                      value={shippingAddress.lastName}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, lastName: e.target.value })
                      }
                      className="bg-charcoal border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
                    />
                  </div>
                  <input
                    placeholder="Address line 1 *"
                    value={shippingAddress.address1}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, address1: e.target.value })
                    }
                    className="bg-charcoal border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
                  />
                  <input
                    placeholder="Address line 2 (optional)"
                    value={shippingAddress.address2}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, address2: e.target.value })
                    }
                    className="bg-charcoal border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <input
                      placeholder="City *"
                      value={shippingAddress.city}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, city: e.target.value })
                      }
                      className="bg-charcoal border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
                    />
                    <input
                      placeholder="State *"
                      value={shippingAddress.state}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, state: e.target.value })
                      }
                      className="bg-charcoal border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
                    />
                    <input
                      placeholder="PIN Code *"
                      value={shippingAddress.pinCode}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, pinCode: e.target.value })
                      }
                      className="bg-charcoal border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
                    />
                  </div>
                  <input
                    placeholder="Phone number"
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
                      paymentMethod === 'razorpay'
                        ? 'border-cobalt bg-cobalt/5'
                        : 'border-smoke hover:border-pearl'
                    }`}
                    onClick={() => setPaymentMethod('razorpay')}
                  >
                    <div
                      className={`w-4 h-4 border rounded-full flex items-center justify-center ${paymentMethod === 'razorpay' ? 'border-cobalt' : 'border-pearl'}`}
                    >
                      {paymentMethod === 'razorpay' && (
                        <div className="w-2 h-2 bg-cobalt rounded-full" />
                      )}
                    </div>
                    <span className="font-mono text-body-sm text-bone">
                      Online Payment (Cards, UPI, Netbanking) via Razorpay
                    </span>
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
                    <span className="font-mono text-body-sm text-bone">Cash on Delivery (COD)</span>
                  </label>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setStep('shipping')}
                      className="px-6 py-3 border border-smoke text-pearl font-mono text-caption uppercase tracking-widest hover:border-pearl transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => setStep('review')}
                      className="px-8 py-3 bg-cobalt text-bone font-mono text-caption uppercase tracking-widest hover:bg-cobalt/90 transition-colors"
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
                    {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment (Razorpay)'}
                  </p>
                  <p>
                    <strong>Items:</strong> {cartItems.length}
                  </p>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setStep('payment')}
                    disabled={loading}
                    className="px-6 py-3 border border-smoke text-pearl font-mono text-caption uppercase tracking-widest hover:border-pearl transition-colors disabled:opacity-50"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="px-8 py-3 bg-cobalt text-bone font-mono text-caption uppercase tracking-widest hover:bg-cobalt/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Place Order →'}
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
              <span className="font-mono text-body-sm text-bone">{formatPrice(totalPrice())}</span>
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
