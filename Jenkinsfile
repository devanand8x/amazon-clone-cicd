pipeline {
    agent any

    environment {
        APP_NAME = 'amazon-clone'
        PORT     = '5000'
    }

    stages {
        stage('1. Code Validation & Test') {
            steps {
                echo '🧪 Running unit tests inside Node container...'
                sh 'docker run --rm -v $(pwd):/app -w /app node:latest npm test'
            }
        }

        stage('2. Build Docker Image') {
            steps {
                echo '🐳 Building fresh Docker image...'
                sh "docker build -t ${APP_NAME}:latest ."
            }
        }

        stage('3. Deploy Container') {
            steps {
                echo '🚀 Deploying updated Amazon Clone container...'
                sh """
                    docker stop amazon-app || true
                    docker rm amazon-app || true

                    docker run -d \\
                      --name amazon-app \\
                      -p ${PORT}:5000 \\
                      -v \$(pwd)/server/data:/app/server/data \\
                      --restart unless-stopped \\
                      ${APP_NAME}:latest
                """
            }
        }

        stage('4. Health Check') {
            steps {
                echo '🔍 Verifying application health...'
                sh 'sleep 3'
                sh 'curl -f http://localhost:5000/api/health'
            }
        }
    }

    post {
        success {
            echo "================================================="
            echo "🎉 Pipeline Passed! App deployed successfully!"
            echo "🌐 Live at: http://192.168.50.138:5000"
            echo "================================================="
        }
        failure {
            echo "❌ Pipeline Failed! Please check the logs."
        }
    }
}
