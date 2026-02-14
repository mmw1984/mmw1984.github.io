# dev-archive

This folder contains archived development/runtime artifacts that are NOT used by the live GitHub Pages site.

Files moved here:

- `app.py` — simple Flask dev server (archived). Not used for production (GitHub Pages uses static files).
- `Dockerfile` — archived container build used previously for an Nginx image.
- `docker-compose.yml` — archived compose file.

If you need to run the Flask dev server or Docker image for experimentation:

- Flask: `python app.py` (run from this directory)
- Docker: `docker build -t mmw1984-archive .` then run a container manually

Note: These files were archived to avoid confusion — the canonical deployment for this repository is GitHub Pages (static site).