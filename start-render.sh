#!/bin/sh
# Render start script for Scrum Poker App
# Uses PORT environment variable set by Render

PORT=${PORT:-5000} node server.js
