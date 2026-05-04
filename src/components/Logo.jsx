export default function Logo({ size = 40 }) {
  return (
    <svg
      width={size}
      height={size * 0.78}
      viewBox="0 0 130 102"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Qur'aanic Studies logo"
    >
      {/* ── Left page ── */}
      <path
        d="M64 12 Q42 9 14 15 L14 92 Q40 86 64 90 Z"
        fill="#0A3D2B"
        stroke="#C9A84C"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Left page text lines */}
      <line x1="26" y1="35" x2="55" y2="33" stroke="#C9A84C" strokeWidth="1.1" opacity="0.5"/>
      <line x1="26" y1="45" x2="55" y2="43" stroke="#C9A84C" strokeWidth="0.8" opacity="0.32"/>
      <line x1="26" y1="55" x2="55" y2="53" stroke="#C9A84C" strokeWidth="0.8" opacity="0.32"/>
      <line x1="26" y1="65" x2="50" y2="63" stroke="#C9A84C" strokeWidth="0.8" opacity="0.22"/>
      <line x1="26" y1="75" x2="45" y2="73" stroke="#C9A84C" strokeWidth="0.8" opacity="0.15"/>

      {/* ── Right page ── */}
      <path
        d="M64 12 Q86 9 116 15 L116 92 Q90 86 64 90 Z"
        fill="#071F15"
        stroke="#C9A84C"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* ── Spine ── */}
      <line x1="64" y1="11" x2="64" y2="91" stroke="#C9A84C" strokeWidth="2.2"/>

      {/* ── Gold star at spine top ── */}
      <text
        x="64" y="8"
        textAnchor="middle"
        fontSize="9"
        fill="#C9A84C"
        opacity="0.85"
      >✦</text>

      {/* ── Qaf letter on right page ── */}
      <text
        x="90"
        y="72"
        textAnchor="middle"
        fontFamily="Amiri, Georgia, serif"
        fontSize="46"
        fill="#C9A84C"
        fontWeight="700"
      >ق</text>

      {/* ── Page curl / shadow at bottom ── */}
      <path
        d="M14 92 Q40 86 64 90 Q90 86 116 92"
        fill="none"
        stroke="#C9A84C"
        strokeWidth="1"
        opacity="0.35"
      />
    </svg>
  )
}
