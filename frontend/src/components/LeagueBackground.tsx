import React from 'react';
import type { LeagueCode } from '../constants/leagues';

interface LeagueBackgroundProps {
  league: LeagueCode;
}

const GRASS = '#16ff86';

/** Classic black-and-white soccer ball. */
const SoccerBall: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
    <defs>
      <radialGradient id="ball-shade" cx="38%" cy="34%" r="72%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="70%" stopColor="#eef2f5" />
        <stop offset="100%" stopColor="#b9c2cb" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="46" fill="url(#ball-shade)" stroke="#0b0e12" strokeWidth="2" />
    <polygon points="50,30 64,40 59,57 41,57 36,40" fill="#0b0e12" />
    <polygon points="50,12 60,20 56,29 44,29 40,20" fill="#0b0e12" opacity="0.9" />
    <polygon points="22,40 33,36 39,46 32,58 21,55" fill="#0b0e12" opacity="0.9" />
    <polygon points="78,40 67,36 61,46 68,58 79,55" fill="#0b0e12" opacity="0.9" />
    <polygon points="38,66 50,62 62,66 58,80 42,80" fill="#0b0e12" opacity="0.9" />
  </svg>
);

/** Deterministic crowd speckle flecked with national colours. */
const Crowd: React.FC<{ palette: string[] }> = ({ palette }) => {
  const dots = Array.from({ length: 150 }, (_, i) => {
    const rx = ((i * 9301 + 49297) % 233280) / 233280;
    const ry = ((i * 4523 + 7919) % 997) / 997;
    return {
      x: 40 + rx * 1360,
      y: 330 + ry * 150,
      r: 1.4 + ((i * 13) % 5) * 0.4,
      fill: palette[(i * 7) % palette.length],
      op: 0.35 + ((i * 17) % 10) / 18,
    };
  });
  return (
    <g clipPath="url(#st-standClip)">
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.fill} opacity={d.op} />
      ))}
    </g>
  );
};

const FloodlightTower: React.FC<{ x: number; flip?: boolean; glow: string }> = ({ x, flip = false, glow }) => {
  const dir = flip ? -1 : 1;
  return (
    <g transform={`translate(${x},0)`}>
      <path d="M-6 760 L6 760 L3 150 L-3 150 Z" fill="#16161e" />
      {Array.from({ length: 9 }, (_, i) => {
        const y0 = 170 + i * 64;
        return <path key={i} d={`M-4.2 ${y0} L4.2 ${y0 + 64}`} stroke="#2a2a38" strokeWidth={1.6} />;
      })}
      <g transform={`translate(0,150) rotate(${dir * -12})`}>
        <rect x={-46} y={-30} width={92} height={40} rx={7} fill="#1e1e2a" />
        <rect x={-46} y={-30} width={92} height={40} rx={7} fill="none" stroke="#3a3a4e" strokeWidth={1.5} />
        {[-30, -10, 10, 30].map((dx) =>
          [-16, 0].map((dy) => (
            <circle key={`${dx}-${dy}`} cx={dx} cy={dy} r={6.4} fill={glow} opacity={0.95} />
          )),
        )}
        <ellipse cx={0} cy={-10} rx={74} ry={42} fill={glow} opacity={0.2} className="scene-layer" />
      </g>
    </g>
  );
};

interface SceneConfig {
  sky: string;
  blooms: string;
  beam: string;
  standTop: string;
  standMid: string;
  standBottom: string;
  crowd: string[];
  tifo: React.ReactNode;
  ballShadowA: string;
  ballShadowB: string;
  vignette: string;
  stars?: boolean;
}

const SCENES: Partial<Record<LeagueCode, SceneConfig>> = {
  // England — red & white, St George's Cross
  PL: {
    sky: 'radial-gradient(120% 82% at 50% 122%, #17cf5f 0%, #0e9a4a 12%, #8f0c22 46%, #5a0816 72%, #2a0410 100%)',
    blooms:
      'radial-gradient(44% 40% at 84% 2%, rgba(255,255,255,0.22) 0%, transparent 60%), radial-gradient(46% 42% at 8% 14%, rgba(212,13,26,0.30) 0%, transparent 60%)',
    beam: '#ffffff',
    standTop: '#44060f', standMid: '#2a0610', standBottom: '#180308',
    crowd: ['#ffffff', '#d40d1a', '#f1f3f5', '#cf0a2c', '#ffffff', '#e8434f'],
    tifo: (
      <>
        <rect x="612" y="350" width="216" height="116" rx="4" fill="#f4f6f8" opacity="0.6" />
        <rect x="708" y="350" width="24" height="116" fill="#d40d1a" opacity="0.85" />
        <rect x="612" y="396" width="216" height="24" fill="#d40d1a" opacity="0.85" />
      </>
    ),
    ballShadowA: 'rgba(255,255,255,0.6)', ballShadowB: 'rgba(212,13,26,0.55)',
    vignette: 'radial-gradient(120% 95% at 50% 38%, transparent 58%, rgba(20,2,6,0.52) 100%)',
  },
  // Germany — black, red & gold
  BL1: {
    sky: 'radial-gradient(120% 82% at 50% 122%, #17cf5f 0%, #0e9a4a 12%, #b3121d 44%, #3a0408 72%, #0a0a0b 100%)',
    blooms:
      'radial-gradient(44% 40% at 84% 2%, rgba(255,206,0,0.22) 0%, transparent 60%), radial-gradient(46% 42% at 8% 14%, rgba(208,0,21,0.30) 0%, transparent 60%)',
    beam: '#ffe89a',
    standTop: '#2a0a0c', standMid: '#180609', standBottom: '#0a0a0b',
    crowd: ['#ffce00', '#d2010c', '#ffffff', '#f5c400', '#d2010c', '#1c1c1c'],
    tifo: (
      <>
        <rect x="612" y="350" width="216" height="38.7" fill="#1a1a1a" opacity="0.85" />
        <rect x="612" y="388.7" width="216" height="38.7" fill="#d2010c" opacity="0.85" />
        <rect x="612" y="427.3" width="216" height="38.7" fill="#ffce00" opacity="0.85" />
      </>
    ),
    ballShadowA: 'rgba(255,206,0,0.6)', ballShadowB: 'rgba(208,0,21,0.55)',
    vignette: 'radial-gradient(120% 95% at 50% 38%, transparent 58%, rgba(8,4,2,0.55) 100%)',
  },
  // France — bleu, blanc, rouge
  FL1: {
    sky: 'radial-gradient(120% 82% at 50% 122%, #17cf5f 0%, #0e9a4a 12%, #0a3d8f 44%, #06224f 72%, #03101f 100%)',
    blooms:
      'radial-gradient(44% 40% at 84% 2%, rgba(255,255,255,0.20) 0%, transparent 60%), radial-gradient(46% 42% at 8% 14%, rgba(0,85,164,0.32) 0%, transparent 60%)',
    beam: '#ffffff',
    standTop: '#0a1f44', standMid: '#06142e', standBottom: '#030c1c',
    crowd: ['#0055a4', '#ffffff', '#ef4135', '#ffffff', '#0055a4', '#cdd6e0'],
    tifo: (
      <>
        <rect x="612" y="350" width="72" height="116" fill="#0055a4" opacity="0.85" />
        <rect x="684" y="350" width="72" height="116" fill="#f4f6f8" opacity="0.7" />
        <rect x="756" y="350" width="72" height="116" fill="#ef4135" opacity="0.85" />
      </>
    ),
    ballShadowA: 'rgba(0,120,255,0.55)', ballShadowB: 'rgba(239,65,53,0.55)',
    vignette: 'radial-gradient(120% 95% at 50% 38%, transparent 58%, rgba(2,8,18,0.55) 100%)',
  },
  // Italy — verde, bianco, rosso
  SA: {
    sky: 'radial-gradient(120% 82% at 50% 122%, #17cf5f 0%, #0e9a4a 12%, #034196 44%, #021f4a 72%, #020e1f 100%)',
    blooms:
      'radial-gradient(44% 40% at 84% 2%, rgba(0,140,69,0.24) 0%, transparent 60%), radial-gradient(46% 42% at 8% 14%, rgba(205,33,42,0.26) 0%, transparent 60%)',
    beam: '#eaf2ff',
    standTop: '#08213f', standMid: '#05152a', standBottom: '#020e1f',
    crowd: ['#008c45', '#ffffff', '#cd212a', '#ffffff', '#008c45', '#bcd3ff'],
    tifo: (
      <>
        <rect x="612" y="350" width="72" height="116" fill="#008c45" opacity="0.85" />
        <rect x="684" y="350" width="72" height="116" fill="#f4f6f8" opacity="0.7" />
        <rect x="756" y="350" width="72" height="116" fill="#cd212a" opacity="0.85" />
      </>
    ),
    ballShadowA: 'rgba(0,170,84,0.55)', ballShadowB: 'rgba(205,33,42,0.55)',
    vignette: 'radial-gradient(120% 95% at 50% 38%, transparent 58%, rgba(2,8,18,0.55) 100%)',
  },
  // Spain — rojo y gualda (red & gold)
  PD: {
    sky: 'radial-gradient(120% 82% at 50% 122%, #17cf5f 0%, #0e9a4a 12%, #c40d1e 44%, #7a0814 70%, #2a0408 100%)',
    blooms:
      'radial-gradient(44% 40% at 84% 2%, rgba(255,193,71,0.28) 0%, transparent 60%), radial-gradient(46% 42% at 8% 14%, rgba(198,11,30,0.30) 0%, transparent 60%)',
    beam: '#ffd76a',
    standTop: '#33060c', standMid: '#1f0408', standBottom: '#140305',
    crowd: ['#c60b1e', '#ffc400', '#ffffff', '#ffc400', '#c60b1e', '#ffd76a'],
    tifo: (
      <>
        <rect x="612" y="350" width="216" height="29" fill="#c60b1e" opacity="0.85" />
        <rect x="612" y="379" width="216" height="58" fill="#ffc400" opacity="0.85" />
        <rect x="612" y="437" width="216" height="29" fill="#c60b1e" opacity="0.85" />
      </>
    ),
    ballShadowA: 'rgba(255,193,71,0.6)', ballShadowB: 'rgba(198,11,30,0.55)',
    vignette: 'radial-gradient(120% 95% at 50% 38%, transparent 58%, rgba(16,2,4,0.54) 100%)',
  },
  // Europe — UEFA blue & silver, starball night
  CL: {
    sky: 'radial-gradient(120% 82% at 50% 122%, #17cf5f 0%, #0e9a4a 12%, #123d8c 44%, #0a1f4d 72%, #01040c 100%)',
    blooms:
      'radial-gradient(44% 40% at 84% 2%, rgba(255,255,255,0.18) 0%, transparent 60%), radial-gradient(46% 42% at 8% 14%, rgba(90,166,255,0.30) 0%, transparent 60%)',
    beam: '#dbe9ff',
    standTop: '#0a1f4d', standMid: '#05122e', standBottom: '#01040c',
    crowd: ['#5aa6ff', '#ffffff', '#8cc1ff', '#ffffff', '#5aa6ff', '#cfe2ff'],
    tifo: (
      <g opacity="0.85">
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          return (
            <circle key={i} cx={720 + Math.cos(a) * 92} cy={408 + Math.sin(a) * 46} r={4.5} fill="#ffd24a" />
          );
        })}
      </g>
    ),
    ballShadowA: 'rgba(140,193,255,0.6)', ballShadowB: 'rgba(255,255,255,0.5)',
    vignette: 'radial-gradient(120% 95% at 50% 38%, transparent 58%, rgba(1,4,12,0.58) 100%)',
    stars: true,
  },
};

/** Deterministic starfield for the European night. */
const Starfield: React.FC = () => {
  const stars = Array.from({ length: 60 }, (_, i) => {
    const rx = ((i * 9301 + 49297) % 233280) / 233280;
    const ry = ((i * 4523 + 7919) % 997) / 997;
    const r3 = ((i * 1597 + 3301) % 911) / 911;
    return {
      left: `${(rx * 100).toFixed(2)}%`,
      top: `${(ry * 55).toFixed(2)}%`,
      size: 1 + r3 * 2,
      dur: 3 + r3 * 5,
      delay: -(rx * 6),
    };
  });
  return (
    <div className="absolute inset-0">
      {stars.map((s, i) => (
        <span
          key={i}
          className="scene-layer absolute rounded-full bg-white"
          style={{
            left: s.left, top: s.top, width: s.size, height: s.size,
            boxShadow: '0 0 6px rgba(255,255,255,0.8)',
            animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
};

const StadiumScene: React.FC<{ cfg: SceneConfig }> = ({ cfg }) => (
  <>
    <div className="absolute inset-0" style={{ background: cfg.sky }} />
    {cfg.stars && <Starfield />}
    <div
      className="scene-layer absolute inset-0"
      style={{ background: cfg.blooms, animation: 'haze-drift 22s ease-in-out infinite' }}
    />

    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 810" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="st-pitch" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c9f55" stopOpacity="0.7" />
          <stop offset="55%" stopColor="#0ed673" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#15ff86" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="st-stand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cfg.standTop} stopOpacity="0" />
          <stop offset="55%" stopColor={cfg.standMid} stopOpacity="0.92" />
          <stop offset="100%" stopColor={cfg.standBottom} stopOpacity="1" />
        </linearGradient>
        <linearGradient id="st-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cfg.beam} stopOpacity="0.5" />
          <stop offset="70%" stopColor={cfg.beam} stopOpacity="0.06" />
          <stop offset="100%" stopColor={cfg.beam} stopOpacity="0" />
        </linearGradient>
        <clipPath id="st-pitchClip"><polygon points="408,556 1032,556 1520,812 -80,812" /></clipPath>
        <clipPath id="st-standClip"><path d="M0,430 C 360,322 1080,322 1440,430 L1440,560 C 1080,470 360,470 0,560 Z" /></clipPath>
        <filter id="st-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14" /></filter>
      </defs>

      <g filter="url(#st-soft)">
        <polygon className="scene-layer" points="120,150 200,150 560,812 -160,812" fill="url(#st-beam)" style={{ animation: 'beam-glow 9s ease-in-out infinite' }} />
        <polygon className="scene-layer" points="1240,150 1320,150 1600,812 880,812" fill="url(#st-beam)" style={{ animation: 'beam-glow 11s ease-in-out 1s infinite' }} />
        <polygon className="scene-layer" points="540,160 700,160 860,812 360,812" fill="url(#st-beam)" style={{ animation: 'beam-glow 13s ease-in-out 0.5s infinite', opacity: 0.5 }} />
      </g>

      <path d="M0,430 C 360,322 1080,322 1440,430 L1440,560 C 1080,470 360,470 0,560 Z" fill="url(#st-stand)" />
      <Crowd palette={cfg.crowd} />
      <g clipPath="url(#st-standClip)" opacity="0.7">{cfg.tifo}</g>
      <path d="M0,430 C 360,322 1080,322 1440,430" fill="none" stroke={cfg.beam} strokeOpacity="0.45" strokeWidth="2.5" filter="url(#st-soft)" />

      <g clipPath="url(#st-pitchClip)">
        <polygon points="408,556 1032,556 1520,812 -80,812" fill="url(#st-pitch)" />
        {[[556, 596], [636, 690], [744, 812]].map(([y0, y1], i) => (
          <polygon key={i} points={`-80,${y0} 1520,${y0} 1520,${y1} -80,${y1}`} fill="#ffffff" opacity={0.06} />
        ))}
        <ellipse cx="720" cy="566" rx="118" ry="20" fill="none" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="2" />
        <line x1="-80" y1="566" x2="1520" y2="566" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="2" />
      </g>
      <ellipse className="scene-layer" cx="720" cy="760" rx="660" ry="158" fill={GRASS} opacity="0.2" filter="url(#st-soft)" style={{ animation: 'glow-breathe 9s ease-in-out infinite' }} />

      <path d="M0,520 C 220,470 360,470 408,556 L0,812 Z" fill={cfg.standBottom} opacity="0.96" />
      <path d="M1440,520 C 1220,470 1080,470 1032,556 L1440,812 Z" fill={cfg.standBottom} opacity="0.96" />

      <FloodlightTower x={150} glow={cfg.beam} />
      <FloodlightTower x={1290} glow={cfg.beam} flip />
    </svg>

    <div className="absolute left-0 top-[58vh]">
      <div className="scene-layer" style={{ animation: 'ball-fly-r 8s ease-in-out infinite', filter: `drop-shadow(0 0 10px ${cfg.ballShadowA})` }}>
        <SoccerBall size={34} />
      </div>
    </div>
    <div className="absolute right-0 top-[70vh]">
      <div className="scene-layer" style={{ animation: 'ball-fly-l 12s ease-in-out 3s infinite', filter: `drop-shadow(0 0 8px ${cfg.ballShadowB})` }}>
        <SoccerBall size={24} />
      </div>
    </div>

    <div className="absolute inset-0" style={{ background: cfg.vignette }} />
  </>
);

/** Full-screen static image background. No motion. Optional dark scrim for legibility. */
const ImageScene: React.FC<{ src: string; overlay?: string }> = ({ src, overlay }) => (
  <div className="absolute inset-0">
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      aria-hidden
    />
    {overlay && <div className="absolute inset-0" style={{ background: overlay }} aria-hidden />}
  </div>
);

/** Leagues that use a bespoke full-screen image instead of the generated stadium scene. */
const IMAGE_SCENES: Partial<Record<LeagueCode, string>> = {
  PL: '/prem_background.jpg',
  FL1: '/ligue1_background.jpg',
  BL1: '/bundesliga_background.jpg',
  PD: '/laliga_background.jpg',
  SA: '/seriea_background.jpg',
  CL: '/ucl_background.jpg',
  WC: '/worldcup_background.jpg',
};

/** Dark scrims for image backgrounds that are too bright for legible UI text. */
const IMAGE_OVERLAYS: Partial<Record<LeagueCode, string>> = {};

const LeagueBackground: React.FC<LeagueBackgroundProps> = ({ league }) => (
  <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
    {IMAGE_SCENES[league]
      ? <ImageScene src={IMAGE_SCENES[league]!} overlay={IMAGE_OVERLAYS[league]} />
      : <StadiumScene cfg={(SCENES[league] ?? SCENES.PL)!} />}
  </div>
);

export default LeagueBackground;
