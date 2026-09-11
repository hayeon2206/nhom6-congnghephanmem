/**
 * Hand-drawn whale-tail mark — the brand's small glyph, used wherever the
 * mascot needs to appear at icon size without competing with real content
 * (sidebar mark, favicon source, future empty states). The photographic
 * hero painting on the auth screens lives separately in assets/whale-hero.png.
 */
export default function WhaleIllustration({ className, style }) {
  return (
    <svg viewBox="0 0 300 300" className={className} style={style} aria-hidden="true">
      <g fill="currentColor">
        <path d="M150 280C147 225 133 180 100 148C72 120 65 90 80 55C98 78 100 100 118 115C130 125 133 133 130 145C145 130 165 122 188 124C172 134 160 148 158 165C156 195 154 240 152 280Z" />
        <path
          transform="scale(-1,1) translate(-300,0)"
          d="M150 280C147 225 133 180 100 148C72 120 65 90 80 55C98 78 100 100 118 115C130 125 133 133 130 145C145 130 165 122 188 124C172 134 160 148 158 165C156 195 154 240 152 280Z"
        />
      </g>
    </svg>
  );
}
