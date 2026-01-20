#!/bin/bash

# Test Woohoo API connectivity from AWS server
# Run this on your AWS server (13.127.174.248)

echo "=== Testing Woohoo API Connectivity ==="
echo "Date: $(date)"
echo "Server IP: $(curl -s ifconfig.me)"
echo ""

echo "=== Test 1: Basic HTTPS connectivity ==="
curl -s -o /dev/null -w "HTTP Status: %{http_code}\nTime: %{time_total}s\n" https://sandbox.woohoo.in

echo ""
echo "=== Test 2: OAuth2 Verify Endpoint ==="
curl -v -X POST https://sandbox.woohoo.in/oauth2/verify \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "8af50260ae5444bdc34665c2b6e6daa9",
    "username": "FINPAGESAPISANDBOX@WOOHOO.IN",
    "password": "FINPAGESAPISANDBOX@1234"
  }' 2>&1

echo ""
echo "=== Test Complete ==="
