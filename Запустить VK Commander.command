#!/bin/zsh
cd "$(dirname "$0")"
python3 server.py &
server_pid=$!
sleep 1
open "http://localhost:8000"
wait $server_pid
