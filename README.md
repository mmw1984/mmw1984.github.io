# Portfolio Project

## English

This project uses Docker to serve a portfolio website using Nginx.

### Prerequisites

- Docker installed on your machine.

### Getting Started

1. Build the Docker image:
    ```sh
    docker build -t portfolio .
    ```

2. Run the Docker container:
    ```sh
    docker run -p 3000:80 portfolio
    ```

3. Open your browser and navigate to `http://localhost:3000` to see the portfolio website.

## 中文

這個項目使用 Docker 和 Nginx 來提供作品集網站服務。

### 先決條件

- 在您的機器上安裝 Docker。

### 入門指南

1. 構建 Docker 映像：
    ```sh
    docker build -t portfolio .
    ```

2. 運行 Docker 容器：
    ```sh
    docker run -p 3000:80 portfolio
    ```

3. 打開瀏覽器並導航到 `http://localhost:3000` 查看作品集網站。
