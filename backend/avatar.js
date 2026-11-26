const STYLES = new Set(['masculine', 'feminine', 'neutral']);

const masculineNames = new Set([
  'rasesh', 'arjun', 'rohit', 'rahul', 'aditya', 'amit', 'ankit', 'akash',
  'abhishek', 'vikram', 'raj', 'ravi', 'sahil', 'siddharth', 'karan',
  'david', 'marcus', 'alexander', 'james', 'michael', 'daniel',
]);
const feminineNames = new Set([
  'neha', 'aisha', 'sarah', 'claire', 'priya', 'ananya', 'riya', 'simran',
  'sneha', 'pooja', 'meera', 'isha', 'kavya', 'divya', 'emily', 'emma',
  'olivia', 'sophia', 'jessica', 'elizabeth',
]);

function normalizeStyle(style) {
  return STYLES.has(style) ? style : 'neutral';
}

// A familiar first name can suggest a starting look, but unknown names remain neutral.
// The person can always choose an appearance in Workspace Settings.
function inferAvatarStyle(name) {
  const firstName = String(name || '').trim().split(/\s+/)[0].toLocaleLowerCase('en');
  if (masculineNames.has(firstName)) return 'masculine';
  if (feminineNames.has(firstName)) return 'feminine';
  return 'neutral';
}

function avatarUrl(name, style = inferAvatarStyle(name)) {
  return `/api/avatar?seed=${encodeURIComponent(String(name || 'Member').trim().slice(0, 80))}&style=${normalizeStyle(style)}`;
}

function generatedAvatarStyle(value) {
  if (typeof value !== 'string' || !value.startsWith('/api/avatar?')) return null;
  try {
    const style = new URL(value, 'http://localhost').searchParams.get('style');
    return STYLES.has(style) ? style : null;
  } catch {
    return null;
  }
}

function isLegacyDefaultAvatar(value) {
  return !value || [
    'photo-1534528741775-53994a69daeb',
    'photo-1494790108377-be9c29b29330',
  ].some((photoId) => String(value).includes(photoId));
}

function hashSeed(seed) {
  let hash = 2166136261;
  for (const char of String(seed || 'Member').toLocaleLowerCase('en').slice(0, 80)) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function renderAvatarSvg(name, style) {
  const hash = hashSeed(name);
  const look = normalizeStyle(style);
  const palettes = [
    { bg: '#FFE3D0', shade: '#F7B789', shirt: '#F36B21' },
    { bg: '#DDEFEA', shade: '#83C3AE', shirt: '#287C70' },
    { bg: '#E9E2F8', shade: '#B5A2E8', shirt: '#694BAC' },
    { bg: '#DDEAFF', shade: '#8BB8F2', shirt: '#315C9E' },
  ];
  const skins = ['#F5C99E', '#E9AF7C', '#CC8D60', '#9C6546', '#704631'];
  const hairs = ['#24202B', '#44302B', '#653F2C', '#272F3F', '#6B4B32'];
  const palette = palettes[hash % palettes.length];
  const skin = skins[(hash >>> 3) % skins.length];
  const hair = hairs[(hash >>> 7) % hairs.length];
  const hairShape = look === 'feminine'
    ? `<path d="M34 83c-5-27 2-47 30-50 28 3 35 23 30 50l-8 23-9-17 1-36H50l1 36-9 17z" fill="${hair}"/>`
    : look === 'masculine'
      ? `<path d="M40 62c-2-20 5-30 24-30s28 10 24 30c-7-7-13-11-17-12-9 8-19 7-31 12z" fill="${hair}"/>`
      : `<path d="M39 63c-2-20 6-31 25-31 16 0 26 10 25 30-8-6-14-10-17-15-8 8-18 12-33 16z" fill="${hair}"/>`;
  const lowerHair = look === 'feminine'
    ? `<path d="M39 58c-7 15-4 33-2 44 3 5 9 7 13 7l-2-18-3-25zM89 58c7 15 4 33 2 44-3 5-9 7-13 7l2-18 3-25z" fill="${hair}"/>`
    : '';
  const beard = look === 'masculine' && hash % 3 === 0
    ? `<path d="M48 87c5 9 12 13 16 13s11-4 16-13c-2 12-8 19-16 19s-14-7-16-19z" fill="${hair}" opacity=".78"/>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="Illustrated profile avatar">
    <style>@keyframes blink{0%,44%,48%,100%{transform:scaleY(1)}46%{transform:scaleY(.08)}}.eye{transform-box:fill-box;transform-origin:center;animation:blink 5s infinite}@media(prefers-reduced-motion:reduce){.eye{animation:none}}</style>
    <rect width="128" height="128" rx="28" fill="${palette.bg}"/>
    <circle cx="102" cy="25" r="22" fill="${palette.shade}" opacity=".35"/>
    <circle cx="25" cy="104" r="32" fill="${palette.shade}" opacity=".3"/>
    <path d="M14 128c2-24 22-35 50-35s48 11 50 35" fill="${palette.shirt}"/>
    <path d="M52 91v14c6 8 18 8 24 0V91" fill="${skin}"/>
    ${lowerHair}
    <ellipse cx="64" cy="69" rx="27" ry="34" fill="${skin}"/>
    <ellipse cx="37" cy="73" rx="4" ry="7" fill="${skin}"/>
    <ellipse cx="91" cy="73" rx="4" ry="7" fill="${skin}"/>
    ${hairShape}
    <path d="M49 66q6-3 11 0M68 66q6-3 11 0" fill="none" stroke="${hair}" stroke-width="2" stroke-linecap="round"/>
    <ellipse class="eye" cx="55" cy="73" rx="2" ry="2.6" fill="#24202B"/>
    <ellipse class="eye" cx="73" cy="73" rx="2" ry="2.6" fill="#24202B"/>
    <path d="M64 75l-2 9h4" fill="none" stroke="#A46E50" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M57 91q7 5 14 0" fill="none" stroke="#9C5548" stroke-width="2" stroke-linecap="round"/>
    ${beard}
  </svg>`;
}

module.exports = { avatarUrl, generatedAvatarStyle, inferAvatarStyle, isLegacyDefaultAvatar, normalizeStyle, renderAvatarSvg };
