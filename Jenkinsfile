pipeline {
    agent any

    environment {
        APP_NAME     = 'amazon-clone'
        IMAGE_TAG    = "${env.BUILD_NUMBER ?: 'latest'}"
        DOCKER_IMAGE = "${APP_NAME}:${IMAGE_TAG}"
        PORT         = '5000'
    }

    options {
        timeout(time: 15, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }

    stages {
        stage('Checkout SCM') {
            steps {
                echo "📦 Checking out repository source code..."
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo "⬇️ Installing NPM dependencies..."
                // Works on both Linux and Windows Jenkins runners
                script {
                    if (isUnix()) {
                        sh 'npm ci'
                    } else {
                        bat 'npm ci'
                    }
                }
            }
        }

        stage('Run Tests') {
            steps {
                echo "🧪 Running unit & validation test suite..."
                script {
                    if (isUnix()) {
                        sh 'npm test'
                    } else {
                        bat 'npm test'
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                echo "🐳 Building Docker image: ${DOCKER_IMAGE}..."
                script {
                    if (isUnix()) {
                        sh "docker build -t ${APP_NAME}:${IMAGE_TAG} -t ${APP_NAME}:latest ."
                    } else {
                        bat "docker build -t ${APP_NAME}:${IMAGE_TAG} -t ${APP_NAME}:latest ."
                    }
                }
            }
        }

        stage('Container Smoke Test') {
            steps {
                echo "🔍 Running container smoke test on test port 5055..."
                script {
                    if (isUnix()) {
                        sh '''
                            docker run -d --name amazon-smoke-test -p 5055:5000 ${APP_NAME}:${IMAGE_TAG}
                            sleep 5
                            curl --fail http://localhost:5055/api/health || (docker logs amazon-smoke-test && exit 1)
                            docker stop amazon-smoke-test
                            docker rm amazon-smoke-test
                        '''
                    } else {
                        bat """
                            docker run -d --name amazon-smoke-test -p 5055:5000 ${APP_NAME}:${IMAGE_TAG}
                            timeout /t 5 /nobreak > nul
                            curl -f http://localhost:5055/api/health
                            docker stop amazon-smoke-test
                            docker rm amazon-smoke-test
                        """
                    }
                }
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                echo "🚀 Deploying Amazon Clone container..."
                script {
                    if (isUnix()) {
                        sh 'docker-compose down || true'
                        sh 'docker-compose up -d'
                    } else {
                        bat 'docker-compose down || ver > nul'
                        bat 'docker-compose up -d'
                    }
                }
            }
        }
    }

    post {
        always {
            echo "🧹 Cleaning up intermediate test containers..."
            script {
                if (isUnix()) {
                    sh 'docker rm -f amazon-smoke-test 2>/dev/null || true'
                } else {
                    bat 'docker rm -f amazon-smoke-test 2>nul || ver > nul'
                }
            }
        }
        success {
            echo "==========================================================="
            echo "🎉 Pipeline completed successfully!"
            echo "🌐 Amazon Clone is live at http://localhost:${PORT}"
            echo "==========================================================="
        }
        failure {
            echo "❌ Pipeline failed! Check the console output above for error logs."
        }
    }
}
