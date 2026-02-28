# CEO Weekly Insight Platform - README

This project is a full-stack web application designed to provide curated insights and articles for C-level executives, delivered through a mobile-first interface with a corresponding admin panel for content management.

## Tech Stack

- **Frontend**: React (Vite), TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: better-sqlite3 (for local development and mock data)
- **DevOps**: Docker, GitHub Actions

## Project Structure

- `/src/pages/admin`: Contains the admin panel components.
- `/src/pages/mobile`: Contains the mobile client components.
- `/server.ts`: The main backend server file, including API routes and database initialization.
- `/app.db`: The SQLite database file.
- `/Dockerfile`: For containerizing the application.
- `/.github/workflows/ci.yml`: GitHub Actions workflow for CI/CD.

## Database Initialization

The database is initialized in `server.ts`. When the server starts, it checks if the `articles` table is empty. If it is, it populates the database with mock data. This ensures that the application can run out-of-the-box without any manual database setup.

To connect to a production database, you would modify the database connection logic in `server.ts` to use credentials from environment variables.

## Development Environment Setup

### Local Development

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
    This will start the Express server with Vite middleware for hot-reloading.

### Docker-based Development

1.  **Build the Docker Image**:
    ```bash
    docker build -t ceo-weekly .
    ```

2.  **Run the Docker Container**:
    ```bash
    docker run -p 3000:3000 ceo-weekly
    ```

## CI/CD

A GitHub Actions workflow is configured in `.github/workflows/ci.yml`. This workflow will:

1.  **On Pull Request**: Build and lint the application to check for errors.
2.  **On Push to `main`**: Build and push a Docker image to a container registry.

**Note**: You will need to configure `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets in your GitHub repository for the deployment job to work.
