import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item: {
        name: string;
        size: string;
        color: string;
        price: number;
        quantity: number;
        image: string;
      }) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${item.name} — ${item.color} / ${item.size}`,
            images: [item.image],
          },
          unit_amount: item.price,
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/shop`,
      shipping_address_collection: {
        allowed_countries: ['US', 'GB', 'NG', 'CA', 'AU', 'FR', 'DE', 'GH', 'ZA'],
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
