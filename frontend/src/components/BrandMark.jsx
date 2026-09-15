export default function BrandMark({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3"  y="16" width="18" height="4.5" rx="2.5" fill="white" />
      <rect x="5.5" y="9.5" width="13" height="4.5" rx="2.5" fill="rgba(255,255,255,0.8)" />
      <rect x="8.5" y="3" width="7" height="4.5" rx="2.5" fill="rgba(255,255,255,0.6)" />
    </svg>
  )
}
