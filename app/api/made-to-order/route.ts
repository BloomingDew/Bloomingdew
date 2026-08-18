import { NextResponse } from 'next/server';
import { getMadeToOrderSurchargePct } from '../../../lib/made-to-order';
import { MADE_TO_ORDER_SIZES, STOCKED_SIZES } from '../../../lib/sizes';

// Public read of the made-to-order terms, so the custom page can show the
// real uplift rather than a hardcoded guess. Display only — the charge is
// recomputed server-side at payment time.
export async function GET() {
  return NextResponse.json({
    surchargePct: await getMadeToOrderSurchargePct(),
    madeToOrderSizes: MADE_TO_ORDER_SIZES,
    stockedSizes: STOCKED_SIZES,
  });
}
