"""Create an offline, single-file viewer from the same checked static sources."""
import json
from pathlib import Path
import re

project = Path(__file__).resolve().parent
dist = project / "dist"
html = (dist / "index.html").read_text(encoding="utf-8")
css = (dist / "styles.css").read_text(encoding="utf-8")
payload = (dist / "design-data.json").read_text(encoding="utf-8")
json.loads(payload)
parts = []
worker_bundle = None
for name in ("model.js", "gpu.js", "renderer.js", "scene-store.js", "app.js"):
    code = (dist / name).read_text(encoding="utf-8")
    code = re.sub(r"^import .*?;\s*$", "", code, flags=re.MULTILINE)
    code = re.sub(r"\bexport (?=(?:const|function|class)\b)", "", code)
    if name == "scene-store.js":
        model_code = (dist / "model.js").read_text(encoding="utf-8")
        model_code = re.sub(r"\bexport (?=(?:const|function|class)\b)", "", model_code)
        worker_code = re.sub(r"^import .*?;\s*$", "", (dist / "scene-worker.js").read_text(encoding="utf-8"), flags=re.MULTILINE)
        gpu_code = re.sub(r"^import .*?;\s*$", "", (dist / "gpu.js").read_text(encoding="utf-8"), flags=re.MULTILINE)
        gpu_code = re.sub(r"\bexport (?=(?:const|function|class)\b)", "", gpu_code)
        worker_bundle = model_code + "\n" + gpu_code + "\n" + worker_code
        worker_source = json.dumps(worker_bundle)
        code = code.replace("new URL('./scene-worker.js',import.meta.url)", "URL.createObjectURL(new Blob([" + worker_source + "],{type:'text/javascript'}))")
    if name == "app.js":
        online = "const response=await fetch('design-data.json');if(!response.ok)throw Error('Design data could not be loaded. Serve this directory over HTTP.');data=await response.json();"
        if online not in code:
            raise RuntimeError("Data-loading source changed; update the offline packer")
        code = code.replace(online, "data=JSON.parse(document.getElementById('design-payload').textContent);")
    parts.append(code)
bundle = "\n".join(parts)
if "</script" in bundle.lower():
    raise RuntimeError("Script terminator must be escaped before embedding")
html = html.replace('<link rel="stylesheet" href="styles.css">', '<style>' + css + '</style>')
html = html.replace('<link rel="stylesheet" href="detail.css">', '<style>' + (dist / 'detail.css').read_text(encoding='utf-8') + '</style>')
html = html.replace('<script type="module" src="app.js"></script>',
    '<script type="application/json" id="design-payload">' + payload.replace('</', '<\\/') + '</script>\n<script type="module">' + bundle + '</script>')
html = html.replace('href="./"', 'href="#"')
output = project.parent / "proxima-design-viewer.html"
output.write_text(html, encoding="utf-8")
# Syntax-check the actual concatenated offline module, not only its source files.
temporary = project / ".offline-check.mjs"
temporary.write_text(bundle, encoding="utf-8")
import subprocess
try:
    subprocess.run(["node", "--check", str(temporary)], check=True)
    temporary.write_text(worker_bundle, encoding="utf-8")
    subprocess.run(["node", "--check", str(temporary)], check=True)
finally:
    temporary.unlink()
print(f"Offline viewer built: {output.name} ({output.stat().st_size:,} bytes)")
