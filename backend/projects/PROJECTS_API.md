# Projects API — Test documentation

This document explains how to test the `projects` API endpoints in this Django REST Framework project.

Base URL (local dev)
- http://127.0.0.1:8000/api/projects/

Authentication
- The API uses JWT for protected endpoints (create, update, delete).
- Obtain a token from your auth endpoints (example depends on your `users` app; typically `/api/token/` with `username`/`password`).
- Send the JWT in the Authorization header: `Authorization: Bearer <access_token>`

Endpoints
- GET /api/projects/ — list all projects. Public. Supports search by `?search=` and filter by `?skill=` (case-insensitive match on skill name).
- POST /api/projects/ — create a project. Requires JWT. Accepts JSON or multipart/form-data (for images).
- GET /api/projects/{id}/ — retrieve project details. Public.
- PUT /api/projects/{id}/ — replace project. Requires JWT. Use multipart/form-data to update images.
- PATCH /api/projects/{id}/ — partial update. Requires JWT.
- DELETE /api/projects/{id}/ — delete project. Requires JWT.

Notes on images (media)
- The serializer accepts up to 3 images per project via a write-only field `media_files`.
- When creating or updating and you provide `media_files`, existing media for the project are replaced.
- Each file must be an image (Content-Type image/*).

Example: List projects (curl)

curl:
```
curl -X GET "http://127.0.0.1:8000/api/projects/" -H "Accept: application/json"
```

PowerShell (Invoke-RestMethod):
```
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/projects/" -Method Get -Headers @{"Accept"="application/json"}
```

Filter by skill:
```
curl -X GET "http://127.0.0.1:8000/api/projects/?skill=django" -H "Accept: application/json"
```

Create a project (JSON) — no images
```
curl -X POST "http://127.0.0.1:8000/api/projects/" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title": "My Project", "description": "Desc", "github_url": "https://github.com/me/repo", "live_url": "https://example.com", "skills": ["Django", "React"] }'
```

PowerShell equivalent (JSON):
```
$body = @{ title = 'My Project'; description = 'Desc'; github_url = 'https://github.com/me/repo'; live_url = 'https://example.com'; skills = @('Django','React') } | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/projects/" -Method Post -Headers @{ Authorization = "Bearer $env:ACCESS_TOKEN"; 'Content-Type' = 'application/json' } -Body $body
```

Create a project (multipart with up to 3 images)
- Use multipart/form-data and include each image as `media_files`.

curl example:
```
curl -X POST "http://127.0.0.1:8000/api/projects/" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -F "title=My Project" \
  -F "description=Desc" \
  -F "github_url=https://github.com/me/repo" \
  -F "live_url=https://example.com" \
  -F "skills[]=Django" \
  -F "skills[]=React" \
  -F "media_files=@/path/to/img1.jpg" \
  -F "media_files=@/path/to/img2.jpg"
```

PowerShell (Invoke-RestMethod) multipart is more verbose; use `System.Net.Http.HttpClient` or `curl` binary if available. Example using `curl.exe` shipped with Windows 10+:
```
curl.exe -X POST "http://127.0.0.1:8000/api/projects/" -H "Authorization: Bearer <ACCESS_TOKEN>" -F "title=My Project" -F "description=Desc" -F "skills[]=Django" -F "media_files=@C:\path\to\img1.jpg"
```

Update project (replace media)
- To replace project's images, send `media_files` in the PUT/PATCH payload. If `media_files` is omitted, existing media are kept.

Example PATCH (replace images):
```
curl -X PATCH "http://127.0.0.1:8000/api/projects/1/" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -F "title=Updated title" \
  -F "media_files=@/path/to/new1.jpg" \
  -F "media_files=@/path/to/new2.jpg"
```

Error cases
- Sending more than 3 images in `media_files` will return a 400 with message: "You can upload at most 3 images per project.".
- Invalid image content will be rejected by the image validator.
- Creating/updating without a valid JWT on protected endpoints returns 401.

Example responses
- Successful create (201):
```
{
  "id": 5,
  "title": "My Project",
  "description": "Desc",
  "github_url": "https://github.com/me/repo",
  "live_url": "https://example.com",
  "created_by": 1,
  "created_at": "2025-08-29T12:00:00Z",
  "updated_at": "2025-08-29T12:00:00Z",
  "media": [
    { "id": 1, "image": "http://127.0.0.1:8000/media/projects/1/img1.jpg", "order": 0 },
    { "id": 2, "image": "http://127.0.0.1:8000/media/projects/1/img2.jpg", "order": 1 }
  ],
  "skills_list": ["Django","React"]
}
```

Tips & troubleshooting
- If using the Django dev server, ensure `DEBUG=True` and `MEDIA_URL`/`MEDIA_ROOT` are set so uploaded images are served.
- If you get `413 Payload Too Large`, the file is too big for the server configuration; reduce file size or configure server limits.
- Use `curl` native binary on Windows for multipart uploads (`curl.exe`), or use a small Python script with `requests` to perform multipart uploads.

Python `requests` example (upload with images):
```python
import os
import requests

url = 'http://127.0.0.1:8000/api/projects/'
headers = {'Authorization': 'Bearer ' + os.environ.get('ACCESS_TOKEN')}
files = [
    ('media_files', open('img1.jpg', 'rb')),
    ('media_files', open('img2.jpg', 'rb')),
]
data = {
    'title': 'My Project',
    'description': 'Desc',
    'skills[]': ['Django', 'React'],
}
resp = requests.post(url, headers=headers, files=files, data=data)
print(resp.status_code)
print(resp.json())
```

If you'd like, I can also:
- Add example unit tests for these endpoints in `backend/projects/tests.py`.
- Add a small `scripts/` folder with example Python scripts to call the API.

---
Document created: Projects API test instructions.

## Postman (GUI) — comment tester

Quick plan: créez un Environment Postman avec `BASE_URL` = `http://127.0.0.1:8000` et `ACCESS_TOKEN` (votre JWT). Importez ou créez des requêtes en utilisant `{{BASE_URL}}/api/projects/`.

1) Configuration de l'environnement
- Variables recommandées :
  - `BASE_URL` = `http://127.0.0.1:8000`
  - `ACCESS_TOKEN` = (votre JWT)

2) Auth (Bearer)
- Dans l'onglet `Authorization` de la requête, choisissez `Bearer Token` et mettez `{{ACCESS_TOKEN}}`.
- Ou ajoutez un header `Authorization: Bearer {{ACCESS_TOKEN}}` dans l'onglet `Headers`.

3) GET (liste et filtre)
- Méthode : GET
- URL : `{{BASE_URL}}/api/projects/` (ou `?skill=django` pour filtrer)

4) POST (JSON, sans images)
- Onglet `Body` → `raw` → `JSON` et envoyez un body JSON comme :
  {
    "title": "My Project",
    "description": "Desc",
    "github_url": "https://github.com/me/repo",
    "live_url": "https://example.com",
    "skills": ["Django","React"]
  }

5) POST (multipart/form-data — avec images)
- Onglet `Body` → `form-data`.
- Ajoutez les clés :
  - `title` (Text)
  - `description` (Text)
  - `skills[]` (Text) — répétez la clé pour chaque compétence
  - `media_files` (File) — ajoutez jusqu'à 3 entrées `media_files` (File). Postman acceptera plusieurs champs `media_files` ; le serveur traitera la liste.
- Exemple visuel :
  | Key | Type | Value |
  |-----|------|-------|
  | title | Text | My Project |
  | description | Text | Desc |
  | skills[] | Text | Django |
  | skills[] | Text | React |
  | media_files | File | (choisir image1.jpg) |
  | media_files | File | (choisir image2.jpg) |

6) PUT/PATCH (mise à jour)
- Pour remplacer les images : utilisez `PATCH {{BASE_URL}}/api/projects/{id}/` en `form-data` et fournissez de nouvelles entrées `media_files` — les anciennes seront supprimées.

7) DELETE
- `DELETE {{BASE_URL}}/api/projects/{id}/` avec Bearer token.

8) Astuces Postman
- Si vous testez souvent, créez une Collection et utilisez l'onglet `Pre-request Script` pour rafraîchir le token automatiquement si vous avez un endpoint de refresh.
- Activez l'onglet `Console` pour inspecter les payloads envoyés (utile pour multipart).

Si vous voulez, je peux générer et ajouter un fichier de collection Postman (.json) exportable dans `backend/projects/postman_collection.json` pour importer automatiquement toutes les requêtes (GET/POST/PUT/PATCH/DELETE). Dites-moi si vous préférez cela.
