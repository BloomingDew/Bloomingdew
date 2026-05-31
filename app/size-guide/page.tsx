export default function SizeGuidePage() {
  const sizes = [
    { label: 'XS (0–2)', bust: '32"', waist: '24"', hip: '34"' },
    { label: 'S (4–6)', bust: '34"', waist: '26"', hip: '36"' },
    { label: 'M (8–10)', bust: '36"', waist: '28"', hip: '38"' },
    { label: 'L (12–14)', bust: '38–40"', waist: '30–32"', hip: '40–42"' },
    { label: 'XL (16–18)', bust: '42–44"', waist: '34–36"', hip: '44–46"' },
    { label: 'XXL (20–22)', bust: '46–48"', waist: '38–40"', hip: '48–50"' },
    { label: '3XL (24–26)', bust: '50–52"', waist: '42–44"', hip: '52–54"' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-12">
        <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">Fit Guide</p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-4">Size Guide</h1>
        <p className="text-warm-gray text-sm leading-relaxed max-w-xl">
          We want every Bloomingdew piece to fit you perfectly. Use this guide to find your size, or
          select &quot;Custom&quot; on any product page for made-to-measure sizing.
        </p>
      </div>

      {/* How to Measure */}
      <section className="mb-12">
        <h2 className="font-display text-2xl font-semibold mb-6">How to Measure</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              label: 'Bust',
              desc: 'Measure around the fullest part of your chest, keeping the tape parallel to the floor.',
            },
            {
              label: 'Waist',
              desc: 'Measure around your natural waistline — the narrowest part of your torso.',
            },
            {
              label: 'Hip',
              desc: 'Measure around the fullest part of your hips, about 8" below your waistline.',
            },
          ].map((m) => (
            <div key={m.label} className="border border-border p-5">
              <p className="text-gold text-xs tracking-widest uppercase mb-2">{m.label}</p>
              <p className="text-sm text-charcoal leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Size Chart */}
      <section className="mb-12">
        <h2 className="font-display text-2xl font-semibold mb-6">Size Chart</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-charcoal text-cream">
                <th className="text-left px-5 py-3 text-xs tracking-widest uppercase font-normal">Size</th>
                <th className="text-left px-5 py-3 text-xs tracking-widest uppercase font-normal">Bust</th>
                <th className="text-left px-5 py-3 text-xs tracking-widest uppercase font-normal">Waist</th>
                <th className="text-left px-5 py-3 text-xs tracking-widest uppercase font-normal">Hip</th>
              </tr>
            </thead>
            <tbody>
              {sizes.map((row, i) => (
                <tr
                  key={row.label}
                  className={`border-b border-border ${i % 2 === 0 ? 'bg-white' : 'bg-cream'}`}
                >
                  <td className="px-5 py-3 font-medium">{row.label}</td>
                  <td className="px-5 py-3 text-warm-gray">{row.bust}</td>
                  <td className="px-5 py-3 text-warm-gray">{row.waist}</td>
                  <td className="px-5 py-3 text-warm-gray">{row.hip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Custom Sizing */}
      <section id="custom" className="bg-charcoal text-cream p-8">
        <h2 className="font-display text-2xl font-semibold mb-3">Custom Sizing</h2>
        <p className="text-cream/75 text-sm leading-relaxed mb-4">
          Don&apos;t see your size in the chart? Every Bloomingdew piece can be made to your exact
          measurements. Simply select &quot;Custom&quot; as your size when ordering and include your
          measurements in the order notes, or{' '}
          <a href="/about#contact" className="underline hover:text-gold transition-colors">
            reach out to us
          </a>{' '}
          before placing your order.
        </p>
        <p className="text-cream/75 text-sm leading-relaxed">
          Custom pieces take 10–21 business days to produce. We&apos;ll confirm your measurements
          before we start cutting.
        </p>
      </section>
    </div>
  );
}
