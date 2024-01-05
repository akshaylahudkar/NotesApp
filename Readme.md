# Notes App

Brief description of your application.

## Prerequisites

Make sure you have the following tools installed:

- [Docker](https://www.docker.com/)

## Getting Started

Follow these instructions to set up and run the application.

### 1. Clone the Repository

git clone https://github.com/akshaylahudkar/NotesApp.git
cd NotesApp

### 2. Start docker

docker-compose up --build -d

### 3. Access the Swagger API documentation

http://localhost:3004/api-docs

### 4. Load test the server by running the following command
chmod +x ./load-test.sh && ./load-test.sh

### 5. How to run tests
First stop the 'app' container which is running and keep the MongoDB container running
run tests using 
npm test

