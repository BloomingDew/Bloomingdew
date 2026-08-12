import Link from 'next/link';

export const metadata = {
  title: 'Refund, Return & Exchange Policy — Bloomingdew',
  description:
    'All Bloomingdew purchases are final sale. Read our full refund, return and exchange policy, including how to report a damaged, defective or incorrect item.',
};

const EFFECTIVE_DATE = 'August 11, 2026';

type Section = { heading: string; paragraphs?: string[]; intro?: string; list?: string[]; outro?: string[] };

const sections: Section[] = [
  {
    heading: '1. Sale Policy',
    paragraphs: [
      'All purchases made through Bloomingdew, whether online, through social media, by telephone, WhatsApp, in person, or through any other approved Bloomingdew sales channel, are considered final sale.',
    ],
    intro: 'Accordingly, we are unable to accept returns or exchanges where a customer:',
    list: [
      'Changes their mind;',
      'Selects the wrong size;',
      'No longer requires the item;',
      'Decides the item does not suit their personal preference;',
      'Selects the wrong colour or style;',
      'Purchases an item as a gift and the recipient prefers something else; or',
      'Later decides they would prefer a different Bloomingdew piece.',
    ],
    outro: [
      'We encourage customers to contact our team before purchasing if they require assistance with sizing, fit, measurements, colour, fabric, styling or any other product-related question.',
    ],
  },
  {
    heading: '2. Bespoke & Made-to-Measure Orders',
    paragraphs: [
      'Bespoke and made-to-measure pieces are created specifically for each customer.',
      'For this reason, all bespoke and made-to-measure purchases are considered final sale and are non-refundable, non-returnable and non-exchangeable.',
      'Once production or material procurement has commenced, a bespoke order cannot be cancelled because of a change of mind or change in personal circumstances.',
    ],
    intro: 'This includes garments that are:',
    list: [
      "Made to the customer's measurements;",
      "Customized to the customer's specifications;",
      'Created from a customer-selected fabric or colour;',
      'Modified from an existing Bloomingdew design;',
      'Personalized in any way; or',
      "Produced specifically at the customer's request.",
    ],
    outro: [
      'By placing a bespoke or made-to-measure order, the customer acknowledges that the garment is being created specifically for them and accepts the final-sale nature of the purchase.',
    ],
  },
  {
    heading: '3. Bespoke Deposits & Payments',
    paragraphs: [
      'Where a deposit is required for a bespoke or made-to-measure order, the deposit secures production capacity, materials and other resources required to create the garment.',
      'Bespoke deposits are considered final sale and are non-refundable once production or material procurement has commenced.',
      'Where a balance remains outstanding, Bloomingdew may pause production or withhold delivery until the outstanding amount has been received.',
    ],
  },
  {
    heading: '4. Fitting & Alterations',
    paragraphs: [
      'We take great care when handling measurements and fittings.',
      'Because every body and garment is unique, minor adjustments may occasionally be required to achieve the desired fit.',
      'Where a fitting issue is attributable to an error made by Bloomingdew, we will work with the customer in good faith to determine an appropriate alteration or corrective solution.',
      'Where a garment has been produced using measurements supplied or approved by the customer, Bloomingdew cannot be responsible for inaccuracies in those measurements.',
      "Alterations requested because of changes in the customer's measurements, incorrect measurements supplied by the customer, personal preference or requests made after production may attract an additional alteration fee.",
      'Any applicable fee will be communicated before the alteration is undertaken.',
    ],
  },
  {
    heading: '5. Damaged, Defective or Incorrect Items',
    paragraphs: [
      'While all orders undergo quality checks before dispatch, we understand that issues can occasionally occur.',
    ],
    intro: 'If you receive an item that is:',
    list: [
      'Incorrect;',
      'Damaged in transit; or',
      'Confirmed to have a manufacturing defect,',
    ],
    outro: [
      'please contact Bloomingdew within 48 hours of delivery.',
      'Please provide your order number and clear photographs showing the issue. Our team will review the matter and determine the appropriate resolution.',
      'Where the issue is verified as being attributable to Bloomingdew, we may, where appropriate: repair the item; replace the item; correct the item through an appropriate alteration; or provide another suitable resolution.',
      'A refund will only be considered where appropriate and subject to applicable law.',
      'Issues arising from normal wear and tear, improper care, accidental damage, alterations performed by a third party, misuse or failure to follow garment-care instructions are not considered manufacturing defects.',
    ],
  },
  {
    heading: '6. Inspection Upon Delivery',
    paragraphs: [
      'Customers are encouraged to inspect their order immediately upon delivery.',
      'Any concern regarding damage, an incorrect item or an apparent manufacturing defect should be reported within 48 hours of delivery.',
    ],
  },
  {
    heading: '7. Refunds',
    paragraphs: [
      'Except where otherwise required by applicable law or expressly agreed by Bloomingdew, payments for completed purchases are not refundable.',
      'Where Bloomingdew approves a refund in connection with an incorrect, damaged or verified defective item, the refund will ordinarily be made to the original payment method.',
      'For payments processed through Paystack, an approved refund may be processed through Paystack or another applicable payment channel.',
      "Refund processing times are dependent on the payment processor, bank, card issuer or other financial institution. Bloomingdew cannot guarantee the exact date on which a refunded amount will appear in a customer's account.",
    ],
  },
  {
    heading: '8. Sale, Promotional & Discounted Items',
    paragraphs: [
      'Sale, promotional, discounted, clearance and special-offer purchases are also considered final sale and are not eligible for return or exchange.',
      'Where a specific promotional offer contains terms that differ from this policy, those terms will be communicated at the time of purchase.',
    ],
  },
  {
    heading: '9. Return Shipping',
    paragraphs: [
      'Because Bloomingdew does not ordinarily accept returns or exchanges, customers should not send items back without first contacting our team.',
      'Unauthorized returns may not be accepted or processed.',
      'Where Bloomingdew specifically requests that an item be returned for inspection or corrective action, we will provide appropriate instructions.',
    ],
  },
  {
    heading: '10. Our Commitment to You',
    paragraphs: [
      'Our goal is for every Bloomingdew customer to feel confident and delighted with their purchase.',
      'We therefore encourage you to contact our team before placing an order if you need assistance with sizing, measurements, fit, styling, fabric, colour or product details.',
      'We are always happy to help you make an informed purchase.',
    ],
  },
  {
    heading: '11. Policy Acknowledgement',
    paragraphs: [
      'By completing a purchase with Bloomingdew, you acknowledge that you have read, understood and accepted this Refund, Return & Exchange Policy.',
      'All purchases are considered final sale.',
    ],
  },
];

const body: React.CSSProperties = {
  fontFamily: "'Jost', sans-serif",
  fontSize: '0.95rem',
  fontWeight: 400,
  color: '#5C5450',
  lineHeight: 1.9,
  marginBottom: '1rem',
};

export default function RefundPolicyPage() {
  return (
    <div>
      {/* Hero */}
      <section style={{ padding: '6rem 2rem 4rem', textAlign: 'center', borderBottom: '1px solid #E8DDD3' }}>
        <p style={{
          fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.28em',
          textTransform: 'uppercase', color: '#C9A882', marginBottom: '1rem',
        }}>
          Policy
        </p>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 4vw, 3.2rem)',
          fontWeight: 500, color: '#2C2C2C', lineHeight: 1.2, marginBottom: '1rem',
        }}>
          Refund, Return &amp; Exchange Policy
        </h1>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#9A8F87', letterSpacing: '0.05em' }}>
          Effective {EFFECTIVE_DATE}
        </p>
      </section>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '4rem 2rem 6rem' }}>

        {/* Summary */}
        <div style={{ backgroundColor: '#FAF7F4', border: '1px solid #E8DDD3', padding: '2rem', marginBottom: '3rem' }}>
          <p style={{ ...body, marginBottom: '1rem' }}>
            At Bloomingdew, every piece is carefully selected, prepared and fulfilled with the highest
            level of attention to detail. We are committed to providing an exceptional experience from
            the moment you place your order to the moment your Bloomingdew piece arrives.
          </p>
          <p style={{ ...body, marginBottom: '1rem', color: '#2C2C2C', fontWeight: 500 }}>
            Because of the nature of our products and the care involved in preparing each order, all
            purchases are considered final sale and are not eligible for return or exchange.
          </p>
          <p style={{ ...body, marginBottom: 0 }}>
            We kindly encourage you to review your order details, sizing, measurements, product
            descriptions and other relevant information carefully before completing your purchase. Our
            team is always available to assist with sizing, fit and product questions before you place
            your order — just <Link href="/contact" style={{ color: '#2C2C2C', textDecoration: 'underline', textUnderlineOffset: '3px' }}>get in touch</Link>.
          </p>
        </div>

        {/* Sections */}
        {sections.map(section => (
          <section key={section.heading} style={{ marginBottom: '2.75rem' }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: 500,
              color: '#2C2C2C', marginBottom: '1rem',
            }}>
              {section.heading}
            </h2>
            {section.paragraphs?.map((p, i) => <p key={i} style={body}>{p}</p>)}
            {section.intro && <p style={body}>{section.intro}</p>}
            {section.list && (
              <ul style={{ ...body, paddingLeft: '1.2rem', marginBottom: '1rem' }}>
                {section.list.map((item, i) => (
                  <li key={i} style={{ marginBottom: '0.4rem' }}>{item}</li>
                ))}
              </ul>
            )}
            {section.outro?.map((p, i) => <p key={i} style={body}>{p}</p>)}
          </section>
        ))}

        {/* Contact */}
        <section style={{ borderTop: '1px solid #E8DDD3', paddingTop: '2.5rem', marginTop: '1rem' }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: 500,
            color: '#2C2C2C', marginBottom: '1rem',
          }}>
            Contact
          </h2>
          <p style={{ ...body, marginBottom: '0.35rem' }}>
            Email: <a href="mailto:info@bloomingdew.com" style={{ color: '#2C2C2C', textDecoration: 'underline', textUnderlineOffset: '3px' }}>info@bloomingdew.com</a>
          </p>
          <p style={{ ...body, marginBottom: '0.35rem' }}>
            Phone / WhatsApp: <a href="https://wa.me/2349062013707" target="_blank" rel="noopener noreferrer" style={{ color: '#2C2C2C', textDecoration: 'underline', textUnderlineOffset: '3px' }}>+234 906 201 3707</a>
          </p>
          <p style={{ ...body, marginBottom: '2rem' }}>Website: www.bloomingdew.com</p>
          <p style={{ ...body, fontStyle: 'italic', marginBottom: 0 }}>
            Thank you for choosing Bloomingdew. We truly appreciate your trust in our brand.
          </p>
        </section>
      </div>
    </div>
  );
}
