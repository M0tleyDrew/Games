#!/usr/bin/env python3
import argparse
import json
from pathlib import Path
from urllib.parse import quote
from zipfile import ZIP_DEFLATED, ZipFile

DEFAULT_BRANCH = "main"
CATALOG_BRANCH = "games-catalog"


def q(value: str) -> str:
    return quote(str(value), safe="-._~")


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_json(path: Path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def package_game(folder: Path, manifest: dict, repo: str, out: Path):
    module_id = str(manifest.get("id") or folder.name)
    version = str(manifest.get("version") or "0.0.0")
    folder_url = f"https://github.com/{repo}/tree/{DEFAULT_BRANCH}/{q(folder.name)}"
    manifest_url = f"https://raw.githubusercontent.com/{repo}/{CATALOG_BRANCH}/manifests/{q(module_id)}.json"
    download_url = f"https://raw.githubusercontent.com/{repo}/{CATALOG_BRANCH}/packages/{q(module_id)}-v{q(version)}.zip"

    published_manifest = json.loads(json.dumps(manifest))
    published_manifest["url"] = folder_url
    published_manifest["manifest"] = manifest_url
    published_manifest["download"] = download_url
    write_json(out / "manifests" / f"{module_id}.json", published_manifest)

    package_path = out / "packages" / f"{module_id}-v{version}.zip"
    package_path.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(package_path, "w", compression=ZIP_DEFLATED, compresslevel=9) as zf:
        for source in sorted(folder.rglob("*")):
            if not source.is_file():
                continue
            relative = source.relative_to(folder)
            arcname = (Path(folder.name) / relative).as_posix()
            if relative.as_posix() == "module.json":
                zf.writestr(arcname, json.dumps(published_manifest, indent=2, ensure_ascii=False) + "\n")
            else:
                zf.write(source, arcname)

    return {
        "id": module_id,
        "title": str(manifest.get("title") or module_id),
        "version": version,
        "folderName": folder.name,
        "manifestUrl": manifest_url,
        "downloadUrl": download_url,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", required=True, help="owner/name")
    parser.add_argument("--root", default=".")
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    root = Path(args.root).resolve()
    out = Path(args.out).resolve()
    out.mkdir(parents=True, exist_ok=True)

    games = []
    for folder in sorted(p for p in root.iterdir() if p.is_dir() and not p.name.startswith(".")):
        manifest_path = folder / "module.json"
        if not manifest_path.is_file():
            continue
        try:
            manifest = load_json(manifest_path)
        except Exception as exc:
            print(f"Skipping invalid {manifest_path}: {exc}")
            continue
        if not isinstance(manifest, dict) or not manifest.get("id"):
            print(f"Skipping {manifest_path}: no module id")
            continue
        games.append(package_game(folder, manifest, args.repo, out))

    games.sort(key=lambda x: x["title"].lower())
    write_json(out / "catalog.json", {
        "repositoryUrl": f"https://github.com/{args.repo}",
        "sourceBranch": DEFAULT_BRANCH,
        "catalogBranch": CATALOG_BRANCH,
        "games": games,
    })
    (out / ".nojekyll").write_text("", encoding="utf-8")
    print(f"Built {len(games)} Foundry game package(s) into {out}")


if __name__ == "__main__":
    main()
