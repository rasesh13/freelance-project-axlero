export function avatarUrl(name, style = 'neutral') {
  return `/api/avatar?seed=${encodeURIComponent(String(name || 'Member').trim().slice(0, 80))}&style=${style}`;
}

export function avatarStyleFromUrl(value) {
  if (typeof value !== 'string' || !value.startsWith('/api/avatar?')) return null;
  const style = new URL(value, 'http://localhost').searchParams.get('style');
  return ['masculine', 'feminine', 'neutral'].includes(style) ? style : null;
}

export function avatarSrc(value, name) {
  if (!value || /photo-(1534528741775-53994a69daeb|1494790108377-be9c29b29330)/.test(value)) {
    return avatarUrl(name);
  }
  return value;
}
