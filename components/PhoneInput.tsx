'use client';

import { useMemo } from 'react';

// Country dialling codes, Bloomingdew's key markets first, then alphabetical.
export const DIAL_CODES: { code: string; label: string; flag: string }[] = [
  { code: '+234', label: 'Nigeria', flag: '🇳🇬' },
  { code: '+44', label: 'United Kingdom', flag: '🇬🇧' },
  { code: '+1', label: 'United States / Canada', flag: '🇺🇸' },
  { code: '+233', label: 'Ghana', flag: '🇬🇭' },
  { code: '+27', label: 'South Africa', flag: '🇿🇦' },
  { code: '+254', label: 'Kenya', flag: '🇰🇪' },
  { code: '+61', label: 'Australia', flag: '🇦🇺' },
  { code: '+971', label: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+353', label: 'Ireland', flag: '🇮🇪' },
  { code: '+33', label: 'France', flag: '🇫🇷' },
  { code: '+49', label: 'Germany', flag: '🇩🇪' },
  { code: '+39', label: 'Italy', flag: '🇮🇹' },
  { code: '+34', label: 'Spain', flag: '🇪🇸' },
  { code: '+31', label: 'Netherlands', flag: '🇳🇱' },
  { code: '+32', label: 'Belgium', flag: '🇧🇪' },
  { code: '+41', label: 'Switzerland', flag: '🇨🇭' },
  { code: '+46', label: 'Sweden', flag: '🇸🇪' },
  { code: '+47', label: 'Norway', flag: '🇳🇴' },
  { code: '+45', label: 'Denmark', flag: '🇩🇰' },
  { code: '+351', label: 'Portugal', flag: '🇵🇹' },
  { code: '+30', label: 'Greece', flag: '🇬🇷' },
  { code: '+212', label: 'Morocco', flag: '🇲🇦' },
  { code: '+20', label: 'Egypt', flag: '🇪🇬' },
  { code: '+225', label: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: '+237', label: 'Cameroon', flag: '🇨🇲' },
  { code: '+256', label: 'Uganda', flag: '🇺🇬' },
  { code: '+255', label: 'Tanzania', flag: '🇹🇿' },
  { code: '+91', label: 'India', flag: '🇮🇳' },
  { code: '+86', label: 'China', flag: '🇨🇳' },
  { code: '+81', label: 'Japan', flag: '🇯🇵' },
  { code: '+55', label: 'Brazil', flag: '🇧🇷' },
  { code: '+52', label: 'Mexico', flag: '🇲🇽' },
];

// Longest codes first so "+234" wins over "+2" when splitting a stored value.
const SORTED_CODES = [...DIAL_CODES].sort((a, b) => b.code.length - a.code.length);

// The stored value stays a single string ("+234 801 234 5678") so nothing
// downstream (orders, profiles, emails) has to change — this component just
// splits it for editing and rejoins on change.
function splitPhone(value: string, fallbackCode: string) {
  const trimmed = (value || '').trim();
  const match = SORTED_CODES.find(c => trimmed.startsWith(c.code));
  if (match) {
    return { dialCode: match.code, rest: trimmed.slice(match.code.length).trim() };
  }
  return { dialCode: fallbackCode, rest: trimmed };
}

export default function PhoneInput({
  value,
  onChange,
  defaultDialCode = '+234',
  inputStyle,
  required,
  placeholder = '801 234 5678',
}: {
  value: string;
  onChange: (fullNumber: string) => void;
  defaultDialCode?: string;
  inputStyle?: React.CSSProperties;
  required?: boolean;
  placeholder?: string;
}) {
  const { dialCode, rest } = useMemo(
    () => splitPhone(value, defaultDialCode),
    [value, defaultDialCode],
  );

  const emit = (code: string, number: string) => {
    const digits = number.replace(/[^\d\s-]/g, '').trimStart();
    onChange(digits ? `${code} ${digits}` : code);
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <select
        aria-label="Country code"
        value={dialCode}
        onChange={e => emit(e.target.value, rest)}
        style={{
          ...inputStyle,
          width: 'auto',
          minWidth: '110px',
          flexShrink: 0,
          cursor: 'pointer',
        }}
      >
        {DIAL_CODES.map(c => (
          <option key={`${c.code}-${c.label}`} value={c.code}>
            {c.flag} {c.code}
          </option>
        ))}
      </select>
      <input
        type="tel"
        inputMode="tel"
        required={required}
        value={rest}
        onChange={e => emit(dialCode, e.target.value)}
        placeholder={placeholder}
        style={{ ...inputStyle, flex: 1, minWidth: 0 }}
      />
    </div>
  );
}
