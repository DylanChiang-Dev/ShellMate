# ShellMate

ShellMate is a web-based SSH terminal and file manager.

## Deployment with Docker Compose

To deploy ShellMate using Docker Compose, follow these steps:

### Prerequisites

- Docker and Docker Compose installed on your server.
- The `server/src/data` directory should contain your initial data files (`auth.json`, `profiles.json`, etc.) or backups.
- The `server/.env` file should be configured with your environment variables (PORT, JWT_SECRET, etc.).

### Steps

1.  **Clone the repository** (or copy the files to your server).
2.  **Configure environment**: Ensure `server/.env` exists and is populated.
3.  **Start the service**:
    ```bash
    docker-compose up -d --build
    ```
4.  **Access the application**: Open your browser and navigate to `http://localhost:3000` (or your server's IP/domain).

### Data Persistence

Data is persisted in `server/src/data` on the host machine. This directory is mounted into the container at `/app/server/src/data`.
To back up your data, simply back up the `server/src/data` directory.

### Stopping the Service

```bash
docker-compose down
```
