import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: '#2C2C2C',
      color: '#E8DDD3',
      padding: '4rem 2rem 2rem',
      marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '3rem',
        paddingBottom: '3rem',
        borderBottom: '1px solid #9A8F8740',
      }}>

        {/* Brand */}
        <div>
          <h3 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '1.3rem',
            fontWeight: 500,
            color: '#FAF7F4',
            marginBottom: '0.75rem',
          }}>
            Bloomingdew
          </h3>
          <p style={{ fontSize: '0.85rem', lineHeight: 1.8, color: '#9A8F87' }}>
            Handcrafted clothing made with love. Every piece tells a story.
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 style={footerHeading}>Explore</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <li><Link href="/shop" style={footerLink}>Shop All</Link></li>
            <li><Link href="/custom" style={footerLink}>Custom Orders</Link></li>
            <li><Link href="/order-guide" style={footerLink}>Order Guide</Link></li>
            <li><Link href="/faq" style={footerLink}>FAQ</Link></li>
            <li><Link href="/about" style={footerLink}>About</Link></li>
            <li><Link href="/contact" style={footerLink}>Contact</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 style={footerHeading}>Get in Touch</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <li style={{ fontSize: '0.85rem', color: '#9A8F87' }}>hello@bloomingdew.com</li>
            <li style={{ fontSize: '0.85rem', color: '#9A8F87' }}>Instagram</li>
          </ul>
        </div>
      </div>

      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        paddingTop: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        fontSize: '0.78rem',
        color: '#9A8F87',
      }}>
        <span>© {new Date().getFullYear()} Bloomingdew. All rights reserved.</span>
        <span>Made with love.</span>
        <Link href="/admin/login" style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: '0.68rem',
          color: '#5C5450',
          textDecoration: 'none',
          letterSpacing: '0.08em',
          opacity: 0.5,
        }}>
          Admin
        </Link>
      </div>
    </footer>
  );
}

const footerHeading: React.CSSProperties = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 500,
  fontSize: '0.75rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: '#FAF7F4',
  marginBottom: '1rem',
};

const footerLink: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#9A8F87',
  transition: 'color 0.2s',
};
