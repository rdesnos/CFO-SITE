"""Targeted deployment; credentials are read from a temporary file and never logged."""
import hashlib
import json
import sys
import urllib.request
from pathlib import Path

credential_path = Path(sys.argv[1])
credentials = json.loads(credential_path.read_text(encoding="utf-8-sig"))
relative = "functions.php" if "--version" in sys.argv else "assets/cfo-observatoire-synthese.html" if "--template" in sys.argv else "assets/js/cfo-observatoire-live.js"
source = Path(__file__).resolve().parents[2] / "wordpress/theme" / relative
destination = "wp-content/themes/cfo/" + relative
data = source.read_bytes()
headers = {"X-Auth": credentials["auth_key"], "X-Auth-Rest": credentials["rest_auth_key"], "Tus-Resumable": "1.0.0"}
try:
    url = credentials["url"].rstrip("/") + "/" + destination + "?override=true"
    request = urllib.request.Request(url, data=b"", method="POST", headers={**headers, "Upload-Length": str(len(data)), "Upload-Offset": "0"})
    with urllib.request.urlopen(request, timeout=45) as response:
        assert response.status == 201
    request = urllib.request.Request(url, data=data, method="PATCH", headers={**headers, "Content-Type": "application/offset+octet-stream", "Upload-Offset": "0"})
    with urllib.request.urlopen(request, timeout=45) as response:
        assert response.status == 204
        assert int(response.headers["Upload-Offset"]) == len(data)
    print(json.dumps({"path": destination, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest(), "uploaded": True}))
finally:
    credential_path.unlink(missing_ok=True)
