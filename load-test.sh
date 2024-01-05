#!/bin/bash

get_value() {
  key=$1
  json=$2
  value=$(echo "$json" | grep "\"$key\":\"[^\"]*\"" | cut -d":" -f2 | tr -d "\"")
  echo "${value%%,*}"  # Extract only the part before the comma
}

# Sign up a new user
signup_response=$(curl -s -X POST http://localhost:3004/api/auth/signup -H "Content-Type: application/json" -d '{"username":"loadtester","password":"loadtester","email":"load@tester.com"}')

# Log in and retrieve the access token
login_response=$(curl -s -X POST http://localhost:3004/api/auth/login -H "Content-Type: application/json" -d '{"username":"loadtester","password":"loadtester"}')

# Extract user ID and login
# Corrected: Added "$" to correctly echo the login_response
access_token=$(get_value "accessToken" "$login_response")

# Run the load test with the obtained access token
artillery run load-test.yml

