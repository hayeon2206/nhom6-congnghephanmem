import { Empty } from 'antd';
import WhaleIllustration from './WhaleIllustration';

/**
 * Branded stand-in for AntD's default Empty graphic. Empty states are the
 * one spot on data-dense working screens where a mascot moment costs
 * nothing — it only appears when there's nothing else to look at.
 */
export default function BrandEmpty({ description }) {
  return (
    <Empty
      image={<WhaleIllustration style={{ width: 44, height: 44, color: 'var(--color-border-strong)' }} />}
      styles={{ image: { height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' } }}
      description={<span style={{ color: 'var(--color-text-tertiary)' }}>{description}</span>}
    />
  );
}
