# Jitesh Shukla Dental Click — Website

A modern, animated, responsive dental clinic site.

## Local dev

```bash
python3 -m http.server 5500
```

## Deploy (GitHub Pages)

1. Create a new GitHub repo and push this folder as `main` branch.
2. In GitHub: Settings → Pages → Build and deployment → Source: GitHub Actions.
3. Ensure Actions are enabled. The included workflow `.github/workflows/pages.yml` will build and deploy.
4. After the action runs, your site will be available at `https://<your-username>.github.io/<repo>/`.

### SPA routing note
This is a static site with in-page anchors only; no special routing is required.

## Content
- Edit `data/clinic.json` for clinic details
- Edit `data/procedures.json` for treatments
- Edit `data/photos.json` for gallery

## License
All third-party images referenced via public URLs remain property of their respective owners. Replace with your own assets for production.
