# Marco Wong Portfolio - New Design

A modern, liquid glass effect portfolio website with contemporary web design aesthetics.

## Features

- **Liquid Glass Design**: Modern glassmorphism effects with backdrop filters
- **Fully Responsive**: Optimized for desktop, tablet, and mobile devices
- **Dark Mode**: Smooth toggle between light and dark themes
- **Multi-language Support**: English, Traditional Chinese (Hong Kong), and Traditional Chinese (Taiwan)
- **Interactive Gallery**: Lightbox gallery with smooth transitions
- **Smooth Animations**: Cubic-bezier animations for professional feel
- **Customizable Settings**: Adjustable font size, animations, and theme preferences
- **Mobile-Optimized**: Enhanced mobile navigation with smooth slide animations
- **SEO Ready**: Includes robots.txt, sitemap.xml, and meta tags
- **Accessible**: Semantic HTML, ARIA labels, and keyboard navigation support

## Typography

- **Headings**: Instrument Serif (italic, elegant serif font)
- **Body**: Plus Jakarta Sans (modern, clean sans-serif)
- **UI Elements**: Inter (versatile, readable interface font)

## Color Scheme

### Light Theme
- Background: #FAFBFC (soft white)
- Secondary: #FFFFFF (pure white)
- Text: #0F172A (deep blue-black)
- Accent: #006495 (professional blue)

### Dark Theme
- Background: #0F172A (deep blue-black)
- Secondary: #1E293B (slate)
- Text: #F8FAFC (off-white)
- Accent: #60A5FA (bright blue)

## Structure

```
mmw1984.github.io-new/
├── index.html              # Main HTML file
├── translations.js         # Multi-language translations
├── gallery/                # Gallery images and data
│   ├── gallery.json       # Gallery metadata
│   └── images/            # Gallery image files
├── notion-avatar-*.png     # Avatar image
├── favicon.ico            # Favicon
├── favicon-16x16.png      # Favicon 16x16
├── favicon-32x32.png      # Favicon 32x32
├── android-chrome-*.png   # Android icons
├── apple-touch-icon.png   # Apple touch icon
├── site.webmanifest       # Web app manifest
├── robots.txt             # Robots.txt for SEO
├── sitemap.xml            # Sitemap for SEO
└── README.md              # This file
```

## How to Use

### Local Development
1. Navigate to the project directory
2. Start a local server:
   ```bash
   python -m http.server 8080
   ```
3. Open `http://localhost:8080` in your browser

### Features
- Click the moon/sun icon to toggle dark mode
- Use the 🌐 globe icon to switch languages
- Click the ⚙️ settings button to customize font size and animations
- All navigation links smoothly scroll to their sections
- Click gallery images to open lightbox view with navigation

## Customization

### Changing Colors
Edit the CSS variables in the `:root` and `[data-theme="dark"]` sections:
- `--bg-primary`: Main background color
- `--bg-secondary`: Card and secondary backgrounds
- `--text-primary`: Main text color
- `--text-secondary`: Secondary text color
- `--accent`: Accent color for links and buttons

### Adding Content
- Modify the HTML sections directly
- Update the `translations.js` file for multi-language support
- Add new sections following the existing structure

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Credits

- Design inspired by modern web design trends
- Fonts: Google Fonts (Instrument Serif, Inter, Plus Jakarta Sans)
- Icons: Font Awesome 6
- Created for Marco Wong (mmw1984)

## Deployment

This repository is intended to be published as a **static site on GitHub Pages** (default branch / root). The `index.html` and supporting static assets under this repo are the canonical source for production.

Development/runtime artifacts that are not used for GitHub Pages have been archived into `dev-archive/` so they do not cause confusion.

- Archived: `dev-archive/app.py`, `dev-archive/Dockerfile`, `dev-archive/docker-compose.yml` — these are retained only for reference or local experimentation.

If you need to run a local preview, use `python -m http.server 8080` from the project root.

## License

© 2025 Marco Wong. All rights reserved.
