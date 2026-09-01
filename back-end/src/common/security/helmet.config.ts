// Directives are enumerated in full, on purpose. Abbreviating any entry to just
// its CDN drops the 'self' it also needs and breaks same-origin assets.
export const helmetOptions = {
  contentSecurityPolicy: {
    // Required: the `null` removal idiom below only works with defaults on.
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://unpkg.com'],
      // helmet defaults script-src-attr to 'none', which blocks inline event
      // handlers INDEPENDENTLY of script-src. 36 HTML files use onclick=.
      scriptSrcAttr: ["'unsafe-inline'"],
      // jsdelivr appears in style/font too: profile-modal.js injects the
      // Phosphor icon script from unpkg at runtime, which then pulls six
      // stylesheets from jsdelivr that @font-face back to jsdelivr.
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdn.jsdelivr.net'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://images.unsplash.com'],
      connectSrc: ["'self'", 'http://localhost:3000', 'http://127.0.0.1:3000'],
      // Removed: left on it rewrites the front-end's hard-coded
      // http://localhost:3000 subresources to https://, where nothing listens.
      upgradeInsecureRequests: null,
    },
  },
  // Load-bearing: avatars are rendered as <img src="http://localhost:3000/uploads/...">
  // from a different origin. helmet's default same-origin breaks every avatar.
  crossOriginResourcePolicy: { policy: 'cross-origin' as const },
  crossOriginEmbedderPolicy: false,
  hsts: process.env.NODE_ENV === 'production',
};
