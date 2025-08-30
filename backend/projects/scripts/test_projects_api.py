"""
Simple test script for Projects API.

Usage:
  - Install: pip install requests
  - Set environment variables or pass inline:
      ACCESS_TOKEN  - JWT access token to use (preferred)
      OR
      API_USER and API_PASS - credentials to try to obtain a token
  - Optionally set BASE_URL (default http://127.0.0.1:8000)

Runs the following flows:
  - GET /api/projects/
  - POST /api/projects/ (JSON)
  - POST /api/projects/ (multipart with up to 3 images if sample images exist)
  - GET /api/projects/{id}/
  - PATCH /api/projects/{id}/ (update title)
  - DELETE /api/projects/{id}/

The script is tolerant: it will skip steps if prerequisites missing (no token, no sample images).
"""

import os
import sys
import json
import requests
from pathlib import Path

BASE_URL = os.environ.get('BASE_URL', 'http://127.0.0.1:8000').rstrip('/')
HEADERS = {'Accept': 'application/json'}


def obtain_token():
    token = os.environ.get('ACCESS_TOKEN')
    if token:
        print('Using ACCESS_TOKEN from environment')
        return token

    user = os.environ.get('API_USER')
    pwd = os.environ.get('API_PASS')
    if not user or not pwd:
        print('No ACCESS_TOKEN and no API_USER/API_PASS found; some endpoints will be skipped')
        return None

    # Try standard simplejwt endpoint
    token_url = f"{BASE_URL}/api/token/"
    try:
        r = requests.post(token_url, json={'username': user, 'password': pwd}, timeout=10)
        if r.ok:
            data = r.json()
            if 'access' in data:
                print('Obtained token from /api/token/')
                return data['access']
    except Exception:
        pass

    # Try users login endpoint
    try:
        r = requests.post(f"{BASE_URL}/api/users/login/", json={'username': user, 'password': pwd}, timeout=10)
        if r.ok:
            data = r.json()
            # common shapes: {'access': '...'} or {'token': '...'} or {'auth_token': '...'}
            for key in ('access', 'token', 'auth_token'):
                if key in data:
                    print('Obtained token from /api/users/login/')
                    return data[key]
            # fallback: sometimes login returns user with token field nested
            if isinstance(data, dict):
                for v in data.values():
                    if isinstance(v, str) and '.' in v:
                        return v
    except Exception:
        pass

    print('Unable to obtain token using provided credentials')
    return None


def pretty(resp):
    try:
        return json.dumps(resp.json(), indent=2, ensure_ascii=False)
    except Exception:
        return resp.text[:1000]


def main():
    token = obtain_token()
    auth_headers = HEADERS.copy()
    if token:
        auth_headers['Authorization'] = f'Bearer {token}'

    session = requests.Session()

    print('\n1) LIST projects (public)')
    r = session.get(f"{BASE_URL}/api/projects/", headers=HEADERS)
    print(r.status_code)
    print(pretty(r))

    created_id = None

    if token:
        print('\n2) CREATE project (JSON, no images)')
        payload = {
            'title': 'Scripted Project',
            'description': 'Created by test script',
            'github_url': 'https://example.com/repo',
            'live_url': 'https://example.com',
            'skills': ['Python', 'Django']
        }
        r = session.post(f"{BASE_URL}/api/projects/", headers={**auth_headers, 'Content-Type': 'application/json'}, json=payload)
        print(r.status_code)
        print(pretty(r))
        if r.ok and isinstance(r.json(), dict):
            created_id = r.json().get('id')

        # try multipart upload with sample images if available
        samples_dir = Path(__file__).parent
        sample1 = samples_dir / 'sample1.jpg'
        sample2 = samples_dir / 'sample2.jpg'
        images = []
        if sample1.exists():
            images.append(sample1)
        if sample2.exists():
            images.append(sample2)

        if images:
            print('\n3) CREATE project (multipart with images)')
            files = []
            for p in images[:3]:
                files.append(('media_files', (p.name, open(p, 'rb'), 'image/jpeg')))
            data = {'title': 'Scripted With Images', 'description': 'Has images', 'skills[]': ['JS']}
            r = session.post(f"{BASE_URL}/api/projects/", headers={'Authorization': auth_headers.get('Authorization')}, files=files, data=data)
            print(r.status_code)
            print(pretty(r))
            if r.ok and isinstance(r.json(), dict) and not created_id:
                created_id = r.json().get('id')

    else:
        print('\nSkipping protected endpoints because no token available')

    # If a project was created, exercise retrieve/update/delete
    if created_id:
        print(f"\n4) RETRIEVE project {created_id}")
        r = session.get(f"{BASE_URL}/api/projects/{created_id}/", headers=HEADERS)
        print(r.status_code)
        print(pretty(r))

        if token:
            print(f"\n5) PATCH project {created_id} (update title)")
            r = session.patch(f"{BASE_URL}/api/projects/{created_id}/", headers={**auth_headers}, json={'title': 'Updated by script'})
            print(r.status_code)
            print(pretty(r))

            print(f"\n6) DELETE project {created_id}")
            r = session.delete(f"{BASE_URL}/api/projects/{created_id}/", headers={**auth_headers})
            print(r.status_code)
            if r.content:
                print(pretty(r))

    print('\nDone')


if __name__ == '__main__':
    main()
