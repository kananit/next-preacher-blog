#!/usr/bin/env python3
"""
Сравнивает MD5 локальных .html файлов с remote-манифестом.
Загружает только изменившиеся файлы и обновляет манифест.

Usage:
  python3 scripts/sync-manifest.py <build_dir> <bucket> <endpoint> <manifest_key>
"""

import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile


def build_manifest(build_dir: str) -> dict[str, str]:
    manifest: dict[str, str] = {}
    for root, _dirs, files in os.walk(build_dir):
        for f in files:
            if not f.endswith('.html'):
                continue
            path = os.path.join(root, f)
            rel = os.path.relpath(path, build_dir)
            with open(path, 'rb') as fh:
                manifest[rel] = hashlib.md5(fh.read()).hexdigest()
    return manifest


def main():
    build_dir = sys.argv[1]
    bucket = sys.argv[2]
    endpoint = sys.argv[3]
    manifest_key = sys.argv[4]

    # 1. Local manifest
    local = build_manifest(build_dir)
    total = len(local)

    # 2. Remote manifest
    remote = {}
    result = subprocess.run(
        ['aws', 's3', 'cp', f's3://{bucket}/{manifest_key}', '/tmp/_remote-manifest.json',
         '--endpoint-url', endpoint, '--no-progress'],
        capture_output=True,
        check=False,
    )
    if result.returncode == 0:
        try:
            with open('/tmp/_remote-manifest.json') as f:
                remote = json.load(f)
        except (OSError, ValueError) as exc:
            # Без манифеста все файлы считаются изменившимися — заливка будет
            # полной, но деплой не падает.
            sys.stderr.write(f'   ⚠ Манифест не прочитан ({exc}) — заливаю всё\n')

    # 3. Compare — find exactly which files changed
    to_upload = [p for p, md5 in local.items() if remote.get(p) != md5]
    to_delete = [p for p in remote if p not in local]
    total_upload = len(to_upload)
    total_delete = len(to_delete)

    if total_upload == 0 and total_delete == 0:
        sys.stderr.write(f'   ✓ HTML — все актуально ({total} файлов)\n')
        print('0')
        return

    sys.stderr.write(f'   Изменено: {total_upload}, удалено: {total_delete}\n')

    # 4. Upload changed files via temp directory
    if total_upload > 0:
        tmpdir = tempfile.mkdtemp()
        try:
            for path in to_upload:
                src = os.path.join(build_dir, path)
                dst = os.path.join(tmpdir, path)
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.copy2(src, dst)

            proc = subprocess.Popen([
                'aws', 's3', 'sync', tmpdir, f's3://{bucket}',
                '--endpoint-url', endpoint,
                # URL стабилен между деплоями → всегда ревалидируем
                '--cache-control', 'no-cache',
            ], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)

            count = 0
            for line in proc.stdout or []:
                if line.startswith(('upload:', 'copy:')):
                    count += 1
                    pct = int(count * 100 / total_upload)
                    bar_len = 20
                    filled = int(bar_len * count / total_upload)
                    bar = '\u2588' * filled + '\u2591' * (bar_len - filled)
                    sys.stderr.write(f'\033[K\r   {bar} {pct}%  ({count}/{total_upload})')
                    sys.stderr.flush()

            proc.wait()
            if proc.returncode != 0:
                # Молчаливый провал: часть HTML не обновится, а деплой отчитается
                # об успехе. `aws s3 sync` возвращает rc=1, если хоть один файл
                # не залился.
                sys.stderr.write(f'   ❌ aws s3 sync вернул rc={proc.returncode} — часть HTML не залита, повтори деплой\n')
                sys.exit(1)
            sys.stderr.write('\n')
        finally:
            shutil.rmtree(tmpdir)

    # 5. Delete removed files
    failed_delete = 0
    for path in to_delete:
        rc = subprocess.run([
            'aws', 's3', 'rm', f's3://{bucket}/{path}',
            '--endpoint-url', endpoint,
        ], capture_output=True, check=False).returncode
        if rc != 0:
            failed_delete += 1
    if failed_delete:
        sys.stderr.write(f'   ⚠ Не удалось удалить файлов: {failed_delete} — на бакете остались лишние\n')

    # 6. Upload new manifest
    manifest_path = '/tmp/_local-manifest.json'
    with open(manifest_path, 'w') as f:
        json.dump(local, f, sort_keys=True, separators=(',', ':'))
    result = subprocess.run([
        'aws', 's3', 'cp', manifest_path, f's3://{bucket}/{manifest_key}',
        '--endpoint-url', endpoint, '--no-progress',
    ], capture_output=True, text=True, check=False)
    os.remove(manifest_path)
    # Сайт провал не ломает (файлы уже на бакете), но следующий деплой сравнит
    # со старым списком и зальёт изменившееся повторно — поэтому rc проверяем.
    if result.returncode != 0:
        tail = (result.stderr or '').strip().splitlines()
        detail = tail[-1] if tail else 'без вывода'
        sys.stderr.write(f'   ❌ Манифест не залился: {detail} — на бакете остался прошлый список\n')
        sys.exit(1)

    print(str(total))


if __name__ == '__main__':
    main()
