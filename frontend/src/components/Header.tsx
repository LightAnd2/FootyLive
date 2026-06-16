import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 glass-effect shadow-lg shadow-black/30">
      {/* Accent line */}
      <div
        className="h-0.5 w-full"
        style={{ background: 'linear-gradient(90deg, transparent 0%, var(--league-accent) 50%, transparent 100%)' }}
      />

      <div className="container mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <h1
              className="text-2xl sm:text-3xl font-black leading-none"
              style={{ fontFamily: 'Orbitron, monospace' }}
            >
              <span style={{ color: 'var(--league-accent)' }}>
                FootyLive
              </span>
            </h1>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
