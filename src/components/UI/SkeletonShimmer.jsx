/**
 * HMS Reusable Skeleton Shimmer Components
 * 
 * Usage:
 *   import { SkeletonCard, SkeletonTable, SkeletonProfile, SkeletonStatCard, SkeletonWrapper } from '../components/UI/SkeletonShimmer';
 * 
 *   <SkeletonWrapper loading={isLoading}>
 *     <YourRealComponent />
 *   </SkeletonWrapper>
 *
 *   Or use individual placeholders directly:
 *   {loading ? <SkeletonTable rows={5} cols={4} /> : <RealTable />}
 */

import React from 'react';
import './SkeletonShimmer.css';

// ─── Primitive: single shimmer bar ───────────────────────────────────────────
export const Sk = ({ height = 'md', width = 'full', circle = false, round = false, style = {}, className = '' }) => {
  const cls = [
    'sk',
    `sk-${height}`,
    `sk-w-${width}`,
    circle ? 'sk-circle' : '',
    round  ? 'sk-round' : '',
    className,
  ].filter(Boolean).join(' ');

  return <span className={cls} style={style} aria-hidden="true" />;
};

// ─── Stat Card ───────────────────────────────────────────────────────────────
export const SkeletonStatCard = () => (
  <div className="sk-stat-card" aria-label="Loading stat..." role="status">
    {/* Icon + badge row */}
    <div className="sk-row" style={{ justifyContent: 'space-between' }}>
      <Sk height="3xl" style={{ width: 56, height: 56, borderRadius: 8 }} />
      <Sk height="sm" width="1/4" round />
    </div>
    {/* Value */}
    <Sk height="2xl" width="1/2" />
    {/* Label */}
    <Sk height="sm" width="3/4" />
  </div>
);

// ─── Generic Card ─────────────────────────────────────────────────────────────
export const SkeletonCard = ({ lines = 3, hasHeader = true, hasFooter = false }) => (
  <div className="sk-card sk-gap" role="status" aria-label="Loading...">
    {hasHeader && (
      <div className="sk-row" style={{ marginBottom: 4 }}>
        <Sk height="2xl" style={{ width: 40, height: 40, borderRadius: 8 }} />
        <div className="sk-gap" style={{ flex: 1 }}>
          <Sk height="md" width="3/4" />
          <Sk height="sm" width="1/2" />
        </div>
      </div>
    )}
    {Array.from({ length: lines }, (_, i) => (
      <Sk key={i} height="md" width={i === lines - 1 ? '3/4' : 'full'} />
    ))}
    {hasFooter && (
      <div className="sk-row" style={{ marginTop: 8 }}>
        <Sk height="2xl" width="1/3" round />
        <Sk height="2xl" width="1/3" round />
      </div>
    )}
  </div>
);

// ─── Table ────────────────────────────────────────────────────────────────────
export const SkeletonTable = ({ rows = 5, cols = 5 }) => {
  // distribute column widths realistically
  const colWidths = ['1/4', '3/4', '1/2', '1/3', '1/4'];

  return (
    <div className="sk-table" role="status" aria-label="Loading table...">
      {/* Header */}
      <div className="sk-table-head">
        {Array.from({ length: cols }, (_, i) => (
          <Sk key={i} height="sm" round style={{ flex: i === 0 ? '0 0 80px' : 1 }} />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }, (_, r) => (
        <div className="sk-table-row" key={r}>
          {Array.from({ length: cols }, (_, c) => (
            <Sk
              key={c}
              height="md"
              style={{
                flex: c === 0 ? '0 0 80px' : 1,
                width: colWidths[c % colWidths.length],
                // vary widths slightly per row for realism
                opacity: 0.7 + (r % 3) * 0.1,
              }}
              round={c === cols - 1}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// ─── Profile / Avatar ─────────────────────────────────────────────────────────
export const SkeletonProfile = ({ size = 'md', lines = 2 }) => (
  <div className="sk-profile" role="status" aria-label="Loading profile...">
    <span className={`sk sk-avatar-${size}`} aria-hidden="true" />
    <div className="sk-gap" style={{ flex: 1 }}>
      <Sk height="lg" width="3/4" />
      {lines >= 2 && <Sk height="sm" width="1/2" />}
      {lines >= 3 && <Sk height="sm" width="1/3" />}
    </div>
  </div>
);

// ─── List / Queue ──────────────────────────────────────────────────────────────
export const SkeletonList = ({ items = 4 }) => (
  <div className="sk-gap" role="status" aria-label="Loading list...">
    {Array.from({ length: items }, (_, i) => (
      <div
        key={i}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          borderRadius: 8,
          border: '1px solid var(--accents-2)',
          background: 'var(--geist-background)',
        }}
      >
        <Sk height="2xl" style={{ width: 40, height: 40, borderRadius: 6 }} />
        <div className="sk-gap" style={{ flex: 1 }}>
          <Sk height="md" width="3/4" />
          <Sk height="sm" width="1/2" />
        </div>
        <Sk height="sm" width="1/4" round />
      </div>
    ))}
  </div>
);

// ─── Wrapper: shows skeleton while loading ────────────────────────────────────
/**
 * @param {object} props
 * @param {boolean}     props.loading    — show skeleton when true
 * @param {React.ReactNode} props.children — real content
 * @param {React.ReactNode} [props.skeleton] — custom skeleton; defaults to a generic card
 * @param {number}      [props.lines]   — passed to SkeletonCard when using default skeleton
 */
export const SkeletonWrapper = ({ loading, children, skeleton, lines = 3 }) => {
  if (!loading) return <>{children}</>;
  return (
    <div className="sk-wrapper" aria-busy="true">
      {skeleton ?? <SkeletonCard lines={lines} />}
    </div>
  );
};

export default SkeletonWrapper;
