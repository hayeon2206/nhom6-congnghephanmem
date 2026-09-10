import { CheckCircleFilled } from '@ant-design/icons';

const POINTS = [
  'Sổ cái tồn kho theo thời gian thực, không thể sửa/xoá',
  'Chặn bán vượt tồn kho khi nhiều kênh bán cùng lúc',
  'Đồng bộ đơn hàng từ POS, Shopee, TikTok, Lazada vào một nơi',
];

/** Shared left-hand brand panel for the auth screens — hidden on narrow viewports via .auth-brand-panel in index.css. */
export default function AuthBrandPanel() {
  return (
    <div
      className="auth-brand-panel"
      style={{
        width: 440,
        background: 'var(--color-primary)',
        color: '#fff',
        padding: '56px 48px',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 16,
            }}
          >
            O
          </div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>OISM</div>
        </div>

        <h1 style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em', margin: 0 }}>
          Quản lý bán hàng &amp; tồn kho đa kênh cho doanh nghiệp bán lẻ.
        </h1>

        <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {POINTS.map((p) => (
            <div key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <CheckCircleFilled style={{ color: 'var(--color-accent)', marginTop: 3, flexShrink: 0 }} />
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 1.6 }}>{p}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>© {new Date().getFullYear()} OISM</div>
    </div>
  );
}
