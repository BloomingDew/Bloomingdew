// Single source of truth for sizing.
//
// The stocked range is deliberately narrow — anything outside it is served by
// the made-to-order service rather than carried as inventory. These lists were
// duplicated across the product page, both admin product forms and the order
// guide, which is how they drifted apart in the first place.

/** Sizes carried as ready-to-wear stock. */
export const STOCKED_SIZES = ['12', '14', '16', '18'];

/**
 * Sizes available only through made-to-order, i.e. everything outside the
 * stocked range. Kept in ascending order for the picker.
 */
export const MADE_TO_ORDER_SIZES = ['4', '6', '8', '10', '20', '22', '24', '26'];

/** Everything a customer can obtain, one way or another. */
export const ALL_SIZES = [...MADE_TO_ORDER_SIZES, ...STOCKED_SIZES].sort(
  (a, b) => Number(a) - Number(b),
);

export type SizeGuideRow = { size: string; bust: number; waist: number; hip: number };

/** Body measurements in inches. Each step up adds 2" across the board. */
export const SIZE_GUIDE: SizeGuideRow[] = [
  { size: '12', bust: 40, waist: 32, hip: 42 },
  { size: '14', bust: 42, waist: 34, hip: 44 },
  { size: '16', bust: 44, waist: 36, hip: 46 },
  { size: '18', bust: 46, waist: 38, hip: 48 },
];
