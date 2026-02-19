import React, { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  error?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ value, onChange, error }) => {
  const [hovered, setHovered] = useState(0);

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            transition: 'transform 0.15s ease',
            transform: hovered === star ? 'scale(1.2)' : 'scale(1)',
          }}
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill={(hovered || value) >= star ? '#F4A61D' : 'none'}
            stroke={(hovered || value) >= star ? '#F4A61D' : error ? '#dc2626' : '#CBD5E0'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transition: 'fill 0.15s ease, stroke 0.15s ease' }}
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </div>
  );
};

export default StarRating;
