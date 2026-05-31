'use client';

import { useState } from 'react';

interface Props {
  dark?: boolean;
}

export default function NewsletterForm({ dark = false }: Props) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  if (submitted) {
    return (
      <p className={`text-sm ${dark ? 'text-cream/75' : 'text-warm-gray'}`}>
        You&apos;re on the list — thank you!
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={dark ? 'Your email address' : 'Enter your email'}
        required
        className={`border text-sm px-3 py-2 focus:outline-none transition-colors ${
          dark
            ? 'bg-transparent border-warm-gray text-cream placeholder:text-warm-gray focus:border-cream'
            : 'flex-1 border-border bg-cream focus:border-charcoal'
        }`}
      />
      <button
        type="submit"
        className={`text-xs tracking-widest uppercase px-3 py-2 transition-colors ${
          dark
            ? 'bg-cream text-charcoal hover:bg-gold hover:text-cream'
            : 'bg-charcoal text-cream hover:bg-gold'
        }`}
      >
        Subscribe
      </button>
    </form>
  );
}
