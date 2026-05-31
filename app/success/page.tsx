import Link from 'next/link';

export default function SuccessPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg
          className="h-8 w-8 text-gold"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="font-display text-3xl font-semibold mb-4">Order Confirmed!</h1>
      <p className="text-warm-gray text-sm leading-relaxed mb-2">
        Thank you for your Bloomingdew order. We&apos;ve received your payment and are preparing
        your pieces with care.
      </p>
      <p className="text-warm-gray text-sm leading-relaxed mb-8">
        You&apos;ll receive a confirmation email shortly with your order details and tracking
        information once your order ships.
      </p>
      <Link
        href="/shop"
        className="inline-block bg-charcoal text-cream text-xs tracking-widest uppercase px-8 py-3 hover:bg-charcoal/80 transition-colors"
      >
        Continue Shopping
      </Link>
    </div>
  );
}
