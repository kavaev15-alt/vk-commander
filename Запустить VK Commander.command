#!/bin/zsh
cd "$(dirname "$0")"
# Убиваем старый сервер, если он завис и работает в фоне
lsof -t -i:8000 | xargs kill -9 2>/dev/null
python3 server.py &
server_pid=$!
sleep 1
# Открываем сайт со случайным параметром, чтобы сбросить кэш браузера для index.html
open "http://localhost:8000/?nocache=$RANDOM"
wait $server_pid
