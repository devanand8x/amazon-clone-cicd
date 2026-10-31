# 🛒 Amazon Clone - Full Stack Project (Docker & Jenkins CI/CD)

A modern, responsive, full-stack Amazon Clone built with **Node.js**, **Express**, and **Vanilla JavaScript & CSS3**, containerized with **Docker** and automated with a complete **Jenkins CI/CD Pipeline**.

---

## 🏗️ Architecture Overview

```
                      ┌──────────────────────┐
                      │  Developer / Git SCM │
                      └──────────┬───────────┘
                                 │ Git Push
                                 ▼
                      ┌──────────────────────┐
                      │   Jenkins Pipeline   │
                      └──────────┬───────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │ 1. Checkout           │ 2. npm test           │ 3. Docker Build
         ▼                       ▼                       ▼
   Pull latest code      Run validation tests     Build production image
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ 4. Smoke Test Check   │
                     └──────────┬────────────┘
                                │
                                ▼
                     ┌───────────────────────┐
                     │ 5. Docker Deploy      │
                     │  (Port 5000:5000)     │
                     └───────────────────────┘
```

---

## 📁 Repository Structure

```
amazon-clone/
├── Dockerfile                  # Production container image definition
├── .dockerignore               # Optimized Docker build context
├── docker-compose.yml          # Container configuration for Amazon Clone
├── docker-compose.jenkins.yml  # Local Jenkins controller with Docker support
├── Jenkinsfile                 # Declarative CI/CD Pipeline definition
├── package.json                # Project dependencies & scripts
├── test/
│   └── api.test.js             # Automated unit & integration tests
├── server/
│   ├── data/
│   │   ├── products.json       # Product catalog datastore
│   │   └── orders.json         # Orders datastore
│   ├── routes/
│   │   ├── productRoutes.js    # Product endpoints
│   │   └── orderRoutes.js      # Orders & checkout endpoints
│   └── server.js               # Express application
└── public/
    ├── css/styles.css          # Amazon UI design system
    ├── js/app.js               # Reactive cart & storefront logic
    └── index.html              # Frontend application
```

---

## 🐳 Running with Docker

### Method A: Using Docker Compose (Recommended)
Build and start the application container in detached mode:
```bash
docker-compose up -d --build
```

- Application URL: **`http://localhost:5000`**
- Stop the container:
```bash
docker-compose down
```
- View container logs:
```bash
docker-compose logs -f
```

### Method B: Using Docker CLI Directly
```bash
# 1. Build the Docker image
docker build -t amazon-clone:latest .

# 2. Run the container with persistent data volume
docker run -d \
  --name amazon-clone-app \
  -p 5000:5000 \
  -v "$(pwd)/server/data:/app/server/data" \
  amazon-clone:latest
```

---

## ⚙️ CI/CD Pipeline with Jenkins

The included [`Jenkinsfile`](./Jenkinsfile) implements a 6-stage automated CI/CD lifecycle:

1. **Checkout SCM**: Clones the latest branch code.
2. **Install Dependencies**: Runs `npm ci` for clean, deterministic builds.
3. **Run Tests**: Executes `npm test` verifying products, orders, pricing logic, and UI templates.
4. **Docker Build**: Packages the application into an image tagged with the Jenkins build number (`amazon-clone:${BUILD_NUMBER}`) and `latest`.
5. **Container Smoke Test**: Spins up an ephemeral container on test port `5055` and probes `/api/health` before approving deployment.
6. **Deploy**: Deploys the new container live with zero-downtime using `docker-compose up -d`.

---

## 🚀 Setting Up Jenkins Locally (Optional)

If you don't already have a running Jenkins instance, you can spin one up instantly:

### 1. Launch Jenkins via Docker
```bash
docker-compose -f docker-compose.jenkins.yml up -d
```

### 2. Retrieve Initial Admin Password
```bash
docker exec -it jenkins-ci cat /var/jenkins_home/secrets/initialAdminPassword
```

### 3. Complete Jenkins Setup
1. Open **`http://localhost:8080`** in your browser.
2. Paste the administrator password.
3. Click **"Install suggested plugins"**.
4. Create your admin user account.

### 4. Configure Jenkins Pipeline
1. In Jenkins dashboard, click **"New Item"**.
2. Enter name (e.g. `amazon-clone-pipeline`) and select **"Pipeline"** -> Click **OK**.
3. Scroll to the **Pipeline** section:
   - **Definition**: Select **Pipeline script from SCM**.
   - **SCM**: Select **Git**.
   - **Repository URL**: Paste your repository URL (or local Git path).
   - **Script Path**: Verify it says `Jenkinsfile`.
4. Click **Save** and then click **"Build Now"**.

---

## 🧪 Running Tests Locally

Run the automated test suite without Docker:
```bash
npm test
```

Expected output:
```
✔ products.json exists and contains valid products
✔ orders.json exists and is valid JSON
✔ Calculates shipping correctly (Free shipping over $35 threshold)
✔ Generates valid Amazon format order ID
✔ Frontend index.html contains essential root elements
# tests 5
# pass 5
# fail 0
```
