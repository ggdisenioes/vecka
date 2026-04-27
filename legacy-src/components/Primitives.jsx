import { useState } from 'react';
import Icon from './Icon';

export const inputStyle = {
  padding: '12px 16px', border: '1.5px solid oklch(88% 0.016 60)', borderRadius: 8,
  fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: 'none', width: '100%',
  boxSizing: 'border-box', background: '#faf5f8',
};

export const labelStyle = {
  display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: 12,
  fontWeight: 600, color: 'oklch(45% 0.018 50)', marginBottom: 6, letterSpacing: '0.04em',
};

export function Btn({ children, variant = 'primary', size = 'md', onClick, style = {}, icon, disabled }) {
  const [hov, setHov] = useState(false);
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all .2s', letterSpacing: '0.02em',
    opacity: disabled ? 0.5 : 1,
    ...style,
  };
  const sizes = {
    sm: { padding: '8px 16px', fontSize: 13 },
    md: { padding: '12px 24px', fontSize: 14 },
    lg: { padding: '15px 32px', fontSize: 15 },
  };
  const variants = {
    primary: { background: hov ? '#4a7d6e' : '#5e9e8a', color: '#fff', borderRadius: 8 },
    outline: { background: 'transparent', color: '#5e9e8a', border: '1.5px solid #5e9e8a', borderRadius: 8, ...(hov ? { background: '#f0dee7' } : {}) },
    ghost: { background: hov ? 'oklch(93% 0.01 60)' : 'transparent', color: 'oklch(18% 0.022 50)', borderRadius: 8 },
    white: { background: hov ? 'oklch(96% 0.01 60)' : '#fff', color: '#5e9e8a', borderRadius: 8 },
  };
  return (
    <button
      style={{ ...base, ...sizes[size], ...variants[variant] }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={onClick} disabled={disabled}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
}

export function Badge({ children, color = '#5e9e8a', bg = '#f0dee7' }) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 999,
      fontSize: 11, fontWeight: 600, color, background: bg,
      letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif",
    }}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, color = '#5e9e8a' }) {
  return (
    <div style={{ background: 'oklch(90% 0.01 60)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
      <div style={{ width: `${value}%`, background: color, height: '100%', borderRadius: 999, transition: 'width .6s ease' }} />
    </div>
  );
}

export function Stars({ rating, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {[...Array(5)].map((_, i) => (
        <Icon key={i} name="star" size={13}
          color={i < Math.floor(rating) ? '#f59e0b' : '#d1d5db'}
          style={{ fill: i < Math.floor(rating) ? '#f59e0b' : 'none' }}
        />
      ))}
      {count !== null && (
        <span style={{ fontSize: 12, color: 'oklch(52% 0.018 50)', fontFamily: "'DM Sans', sans-serif" }}>
          {rating} ({count})
        </span>
      )}
    </div>
  );
}

export function SectionHeader({ eyebrow, title, subtitle, center = true, light = false }) {
  return (
    <div style={{ textAlign: center ? 'center' : 'left', marginBottom: 48 }}>
      {eyebrow && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: light ? '#97ceb8' : '#5e9e8a', marginBottom: 12 }}>
          {eyebrow}
        </div>
      )}
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 44, fontWeight: 600, margin: '0 0 16px', color: light ? '#fff' : 'oklch(18% 0.022 50)', lineHeight: 1.15 }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: light ? 'oklch(80% 0.01 60)' : 'oklch(52% 0.018 50)', maxWidth: 560, margin: center ? '0 auto' : '0', lineHeight: 1.7 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function Toast({ notification }) {
  if (!notification) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      background: notification.type === 'error' ? '#ef4444' : 'oklch(18% 0.022 50)',
      color: '#fff', padding: '12px 24px', borderRadius: 10,
      fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
      boxShadow: '0 8px 32px rgba(0,0,0,.25)', zIndex: 9999,
      animation: 'fadeUp .3s ease', whiteSpace: 'nowrap',
    }}>
      {notification.msg}
    </div>
  );
}
