# Portfolio
- Made with GitHub Copilot Edit (Claude 3.5 Sonnet)

### Prerequisites

- Install Docker

### Method One (Docker Run)
1. Fork from GitHub

   ```sh
   git clone https://github.com/mmw1984/protfolio.git
   ```
2. Build the Docker image:
    ```sh
    docker build -t portfolio .
    ```

3. Run the Docker container:
    ```sh
    docker run -p 3000:3000 portfolio
    ```

4. Open your browser and navigate to `http://yourip:3000` to see the portfolio website.

### Method Two (Docker Compose)
1. Fork from GitHub

   ```sh
   git clone https://github.com/mmw1984/protfolio.git
   ```
2. Build the Docker image:
    ```sh
    docker build -t portfolio .
    ```

3. Run the Docker container:
    ```sh
    docker compose up -d
    ```

4. Open your browser and navigate to `http://yourip:3000` to see the portfolio website.

### Method Three (GitHub Pages)
1. Fork the repo
2. Run GitHub Actions
3. Done

### Change font
1. Upload font.ttf in \font folder
2. Build New Docker Image/ Run GitHub Actions
