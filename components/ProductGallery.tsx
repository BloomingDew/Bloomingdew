'use client';

import Image from 'next/image';
import { useState } from 'react';

interface Props {
  images: string[];
  name: string;
}

export default function ProductGallery({ images, name }: Props) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {/* Thumbnails */}
      <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`relative flex-shrink-0 w-16 h-20 md:w-20 md:h-24 overflow-hidden border-2 transition-colors ${
              active === i ? 'border-charcoal' : 'border-transparent hover:border-warm-gray'
            }`}
          >
            <Image
              src={src}
              alt={`${name} — view ${i + 1}`}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* Main Image */}
      <div className="relative flex-1 aspect-[3/4] overflow-hidden bg-stone-100">
        <Image
          src={images[active]}
          alt={name}
          fill
          priority
          className="object-cover"
        />
      </div>
    </div>
  );
}
