import { useState } from 'react';
import VantaWaves from '../../components/VantaWaves';
import Typewriter from '../../components/Typewriter';
import FlipWord from '../../components/FlipWord';

const STATS = [
  { value: '3+', label: 'Kênh bán hợp nhất', hint: 'POS · Shopee · TikTok' },
  { value: '100%', label: 'Chặn bán vượt tồn', hint: 'Khi nhiều đơn cùng lúc' },
  { value: '24/7', label: 'Theo dõi thời gian thực', hint: 'Tồn kho & đơn hàng' },
];

/**
 * Shared left-hand brand panel for the auth screens — hidden on narrow
 * viewports via .auth-brand-panel in index.css. The intro plays once per
 * mount: eyebrow types in, then the wordmark, then the tagline, and only
 * once the tagline is fully typed does the flip word take its turn. The
 * animated sea (VantaWaves) is the panel's whole visual — no illustration
 * layered on top of it.
 */
export default function AuthBrandPanel() {
  const [stage, setStage] = useState('eyebrow');

  return (
    <div className="auth-brand-panel">
      <VantaWaves className="auth-panel-waves" />

      <div className="auth-brand-top">
        <div className="auth-brand-eyebrow">
          <Typewriter text="Hệ thống quản lý" speed={22} onDone={() => setStage('title')} />
        </div>
        <h1 className="auth-brand-title">
          {stage !== 'eyebrow' && <Typewriter text="OISM" speed={90} startDelay={120} onDone={() => setStage('slogan')} />}
        </h1>
        <div className="auth-brand-rule" />
        <div className="auth-brand-slogan">
          {(stage === 'slogan' || stage === 'done') && (
            <Typewriter text="Sáng tạo - Hiệu quả - " speed={28} onDone={() => setStage('done')} />
          )}
          {stage === 'done' && <FlipWord from="Tin cậy" to="Cà đùng" delay={2200} />}
        </div>
      </div>

      <div className="auth-brand-spacer" />

      <div className="auth-brand-stats">
        {STATS.map((s) => (
          <div key={s.label} className="auth-brand-stat">
            <div className="auth-brand-stat-value">{s.value}</div>
            <div className="auth-brand-stat-label">{s.label}</div>
            <div className="auth-brand-stat-hint">{s.hint}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
