"""Local VK Commander server. Run: python3 server.py"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from http.cookies import SimpleCookie
from pathlib import Path
from urllib.parse import urlencode, urlparse, parse_qs
from urllib.request import Request, urlopen
import json
import os
import secrets
import base64

ROOT = Path(__file__).parent


def load_local_config():
    """Load only the local .env file. It is intentionally excluded from git."""
    config = {}
    env_file = ROOT / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                key, value = line.split("=", 1)
                config[key.strip()] = value.strip()
    return config


def update_globals():
    global APP_ID, APP_SECRET, REDIRECT_URI
    local_config = load_local_config()
    APP_ID = os.getenv("VK_OAUTH_APP_ID", local_config.get("VK_OAUTH_APP_ID", ""))
    APP_SECRET = os.getenv("VK_OAUTH_CLIENT_SECRET", local_config.get("VK_OAUTH_CLIENT_SECRET", ""))
    REDIRECT_URI = os.getenv("VK_OAUTH_REDIRECT_URI", local_config.get("VK_OAUTH_REDIRECT_URI", ""))

APP_ID = ""
APP_SECRET = ""
REDIRECT_URI = ""
update_globals()
API_VERSION = "5.199"
sessions = {}


def vk_request(method, params):
    query = urlencode({**params, "v": API_VERSION})
    with urlopen(f"https://api.vk.ru/method/{method}?{query}", timeout=15) as response:
        result = json.loads(response.read())
    if "error" in result:
        raise RuntimeError(result["error"].get("error_msg", "VK API error"))
    return result["response"]

def post_multipart(url, file_data):
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    data = []
    data.append(f"--{boundary}")
    data.append('Content-Disposition: form-data; name="photo"; filename="photo.jpg"')
    data.append("Content-Type: image/jpeg")
    data.append("")

    body = b"\r\n".join(x.encode() if isinstance(x, str) else x for x in data)
    body += b"\r\n" + file_data + b"\r\n"
    body += f"--{boundary}--\r\n".encode()

    req = Request(url, data=body, headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    with urlopen(req, timeout=30) as response:
        return json.loads(response.read())


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def add_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.add_cors_headers()
        self.end_headers()

    def send_json(self, code, payload, session_id=None):
        body = json.dumps(payload, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.add_cors_headers()
        if session_id:
            self.send_header("Set-Cookie", f"vk_commander_session={session_id}; HttpOnly; SameSite=Lax")
        self.end_headers()
        self.wfile.write(body)

    def session(self):
        cookie = SimpleCookie(self.headers.get("Cookie"))
        item = cookie.get("vk_commander_session")
        return item.value if item else None

    def do_GET(self):
        # Always bust cache for index.html as well
        if self.path == "/" or self.path.startswith("/?"):
            self.path = "/index.html"

        path = urlparse(self.path)
        if path.path == "/api/health":
            return self.send_json(200, {"ok": True, "connected": bool(self.session() in sessions), "configured": bool(APP_ID and APP_SECRET and REDIRECT_URI)})
        if path.path == "/auth/vk":
            if not APP_ID or not APP_SECRET or not REDIRECT_URI:
                return self.send_json(503, {"error": "OAuth-приложение VK ещё не настроено. Защищённый ключ мини-приложения для этого не используется."})
            state = secrets.token_urlsafe(24)
            sessions[state] = {"state": state}
            params = {"client_id": APP_ID, "redirect_uri": REDIRECT_URI, "display": "page", "scope": "groups,offline", "response_type": "code", "state": state, "v": API_VERSION}
            self.send_response(302)
            self.send_header("Location", "https://oauth.vk.com/authorize?" + urlencode(params))
            self.send_header("Set-Cookie", f"vk_commander_session={state}; HttpOnly; SameSite=Lax")
            self.end_headers()
            return
        if path.path == "/auth/vk/callback":
            query = parse_qs(path.query)
            session_id = self.session()
            if not session_id or query.get("state", [""])[0] != session_id:
                return self.send_json(400, {"error": "OAuth state mismatch. Restart VK connection."})
            if "error" in query:
                return self.send_json(400, {"error": query.get("error_description", ["VK authorization was cancelled"])[0]})
            try:
                payload = urlencode({"client_id": APP_ID, "client_secret": APP_SECRET, "redirect_uri": REDIRECT_URI, "code": query["code"][0]}).encode()
                request = Request("https://oauth.vk.com/access_token", data=payload, method="POST")
                with urlopen(request, timeout=15) as response:
                    token_data = json.loads(response.read())
                if "error" in token_data:
                    raise RuntimeError(token_data.get("error_description", token_data["error"]))
                sessions[session_id]["token"] = token_data["access_token"]
                self.send_response(302)
                self.send_header("Location", "/?connected=1")
                self.end_headers()
            except Exception as error:
                self.send_json(400, {"error": str(error)})
            return
        if path.path == "/api/groups":
            session = sessions.get(self.session(), {})
            if "token" not in session:
                return self.send_json(401, {"error": "VK is not connected"})
            try:
                groups = vk_request("groups.get", {"access_token": session["token"], "filter": "admin,editor", "extended": 1, "fields": "description,cover,status,photo_200"})
                return self.send_json(200, groups)
            except Exception as error:
                return self.send_json(502, {"error": str(error)})
        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path)
        if path.path == "/api/config":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length)
                config = json.loads(body)
                app_id = config.get("app_id", "").strip()
                app_secret = config.get("app_secret", "").strip()
                if not app_id or not app_secret:
                    return self.send_json(400, {"error": "Не заполнены ID или секретный ключ приложения"})

                env_content = f"VK_OAUTH_APP_ID={app_id}\nVK_OAUTH_CLIENT_SECRET={app_secret}\nVK_OAUTH_REDIRECT_URI=http://localhost:8000/auth/vk/callback\n"
                (ROOT / ".env").write_text(env_content, encoding="utf-8")

                update_globals()
                return self.send_json(200, {"success": True})
            except Exception as error:
                return self.send_json(500, {"error": str(error)})

        if path.path == "/api/save":
            session = sessions.get(self.session(), {})
            if "token" not in session:
                return self.send_json(401, {"error": "VK is not connected"})
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length)
                updates = json.loads(body)
                results = []
                for update in updates:
                    group_id = update.get("group_id")
                    if not group_id:
                        continue
                    if "description" in update:
                        vk_request("groups.edit", {"access_token": session["token"], "group_id": group_id, "description": update["description"]})
                    if "status" in update:
                        vk_request("status.set", {"access_token": session["token"], "group_id": group_id, "text": update["status"]})

                    if "avatar" in update and update["avatar"].startswith("data:image"):
                        avatar_data = base64.b64decode(update["avatar"].split(",")[1])
                        upload_info = vk_request("photos.getOwnerPhotoUploadServer", {"access_token": session["token"], "owner_id": -group_id})
                        upload_res = post_multipart(upload_info["upload_url"], avatar_data)
                        if "server" in upload_res and "photo" in upload_res and "hash" in upload_res:
                            vk_request("photos.saveOwnerPhoto", {"access_token": session["token"], "server": upload_res["server"], "photo": upload_res["photo"], "hash": upload_res["hash"]})

                    if "cover" in update and update["cover"].startswith("data:image"):
                        cover_data = base64.b64decode(update["cover"].split(",")[1])
                        upload_info = vk_request("photos.getOwnerCoverPhotoUploadServer", {"access_token": session["token"], "group_id": group_id, "crop_x": 0, "crop_y": 0, "crop_x2": 1590, "crop_y2": 400})
                        upload_res = post_multipart(upload_info["upload_url"], cover_data)
                        if "hash" in upload_res and "photo" in upload_res:
                            vk_request("photos.saveOwnerCoverPhoto", {"access_token": session["token"], "hash": upload_res["hash"], "photo": upload_res["photo"]})

                    results.append({"group_id": group_id, "status": "ok"})
                return self.send_json(200, {"success": True, "results": results})
            except Exception as error:
                return self.send_json(500, {"error": str(error)})

        self.send_response(404)
        self.end_headers()

if __name__ == "__main__":
    print("VK Commander: http://localhost:8000")
    ThreadingHTTPServer(("127.0.0.1", 8000), Handler).serve_forever()
