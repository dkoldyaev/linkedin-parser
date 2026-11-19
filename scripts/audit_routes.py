import re
import subprocess
import json
import ast

res = subprocess.run(["php", "bin/console", "debug:router", "--format=json"], cwd="backend-symfony", capture_output=True, text=True)
sf_data = json.loads(res.stdout)
sf_routes = set()
for name, data in sf_data.items():
    if name.startswith("_profiler") or name.startswith("_wdt") or name.startswith("_error"):
        continue
    path = data.get("path", "")
    path = re.sub(r"\.\{_format\}", "", path)
    norm_path = re.sub(r"\{[^}]+\}", "{param}", path)
    method_str = data.get("method", "")
    if method_str == "ANY":
        methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]
    elif method_str:
        methods = [m.strip().upper() for m in method_str.split("|")]
    else:
        methods = [m.upper() for m in data.get("methods", [])]
    if not methods:
        methods = ["GET", "POST", "PUT", "PATCH", "DELETE"]
    for m in methods:
        sf_routes.add((m.upper(), norm_path))

def get_routes(filepath):
    with open(filepath) as f:
        tree = ast.parse(f.read())
    routes = []
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            for dec in node.decorator_list:
                if isinstance(dec, ast.Call) and isinstance(dec.func, ast.Attribute):
                    router_name = ""
                    if isinstance(dec.func.value, ast.Name):
                        router_name = dec.func.value.id
                    method = dec.func.attr
                    if method in ["get", "post", "put", "patch", "delete", "options", "head"]:
                        path = None
                        if dec.args and isinstance(dec.args[0], ast.Constant):
                            path = dec.args[0].value
                        routes.append((router_name, method.upper(), path, node.name))
    return routes

r_main = get_routes("backend/main.py")
r_pub = get_routes("backend/public_api.py")

all_endpoints = []
for router_name, method, path, func_name in r_main:
    if not path:
        continue
    prefix = ""
    if router_name == "api_v2":
        prefix = "/api/v2"
    elif router_name == "legacy_api":
        prefix = "/api"
    elif router_name == "public_app":
        prefix = "/api/v1"
    elif router_name == "app":
        prefix = ""
    full_path = prefix + path
    norm_path = re.sub(r"\{[^}]+\}", "{param}", full_path)
    all_endpoints.append((method, norm_path, full_path, func_name))

for router_name, method, path, func_name in r_pub:
    if not path:
        continue
    full_path = "/api/v1" + path
    norm_path = re.sub(r"\{[^}]+\}", "{param}", full_path)
    all_endpoints.append((method, norm_path, full_path, func_name))

missing = []
for m, norm_p, full_p, func in sorted(all_endpoints, key=lambda x: (x[2], x[0])):
    if norm_p in ["/openapi.json", "/docs", "/{param}", "/api/v1/openapi.json", "/api/v1/docs", "/api/v2/openapi.json", "/api/v2/docs"]:
        continue
    if (m, norm_p) not in sf_routes:
        missing.append((m, full_p, norm_p, func))

print(f"Total endpoints defined in Python: {len(all_endpoints)}")
print(f"Symfony routes registered: {len(sf_routes)}")
print(f"Missing in Symfony: {len(missing)}")
for m, full_p, norm_p, func in missing:
    print(f"  {m:6} {full_p:45} (handler: {func})")
