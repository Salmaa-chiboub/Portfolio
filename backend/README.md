Backend (Django)
-----------------

Quick local setup (PowerShell):

```powershell
# create venv
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# install deps
pip install -r .\requirements.txt

# copy .env.example to .env and edit values or set env vars directly
copy .env.example .env

# apply migrations and run
python manage.py migrate
python manage.py runserver

Notes for the `core` app (media uploads)
- Install extra dependencies if not present:
	- python-dotenv (loads `.env`) : `pip install python-dotenv`
	- Pillow (image support) : `pip install Pillow`

- Media files (hero images, CVs) are served from `/media/` in development. Ensure `MEDIA_ROOT` exists or Django will create it.

- To create migrations and apply them for the new core models:
	```powershell
	python manage.py makemigrations core
	python manage.py migrate
	```

```

API endpoints (examples):
API endpoints (examples):
- POST /api/users/token/ -> obtain JWT (email as username)
- POST /api/users/token/refresh/ -> refresh token
- POST /api/users/login/ -> obtain JWT (email + password) [superuser-only]
- GET/PUT /api/users/me/ -> profile retrieve / update (requires Bearer token)
- POST /api/users/change-password/ -> change password (authenticated)
- POST /api/users/password-reset/ -> request reset link (superuser-only)
- POST /api/users/password-reset-confirm/?uid=<id>&token=<token> -> confirm reset (superuser-only)

Testing `core` endpoints (public & admin)
---------------------------------------

Prerequisites
- Server running locally at `http://localhost:8000` (see Quick local setup above).
- Create a superuser for admin actions:

```powershell
python manage.py createsuperuser
```

- Obtain an access token (superuser only) using the login endpoint:

```powershell
#$env:ACCESS_JSON = curl.exe -s -X POST http://localhost:8000/api/users/login/ -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"YourPass"}'
#$env:ACCESS_TOKEN = (ConvertFrom-Json $env:ACCESS_JSON).access
# or use Postman to run POST /api/users/login/ and copy the access token into an environment variable
```

Public endpoints (no auth required)
- GET /api/core/hero/  — returns active HeroSection(s).
	Example (PowerShell + curl):

```powershell
curl.exe -s http://localhost:8000/api/core/hero/
```

- GET /api/core/about/  — returns About (singleton).

```powershell
curl.exe -s http://localhost:8000/api/core/about/
```

Admin endpoints (require superuser Bearer token)
All admin endpoints require the HTTP header: `Authorization: Bearer <access_token>`

- List/Create hero (singleton enforcement)
	- GET /api/core/admin/hero/  — list all hero records (usually 0 or 1)
	- POST /api/core/admin/hero/ — create hero (multipart/form-data for image)

	Example (create with image — use Postman for easiest multipart upload):

	Postman: create a new POST to `{{baseUrl}}/api/core/admin/hero/`, set Authorization to Bearer token, choose Body -> form-data and add fields:
		- headline (text)
		- subheadline (text)
		- image (file)

	Quick JSON example (no image):

```powershell
Invoke-RestMethod -Uri http://localhost:8000/api/core/admin/hero/ -Method Post -Headers @{ Authorization = "Bearer $env:ACCESS_TOKEN" } -Body (@{ headline = "Hello"; subheadline = "Subtitle" } | ConvertTo-Json) -ContentType 'application/json'
```

- GET/PUT/DELETE /api/core/admin/hero/<pk>/  — retrieve, update or delete the hero (admin only)

- About (singleton)
	- POST /api/core/admin/about/ — create About (use multipart/form-data for CV file)
	- GET/PUT /api/core/admin/about/<pk>/ — retrieve/update About

	Example update (JSON):

```powershell
Invoke-RestMethod -Uri http://localhost:8000/api/core/admin/about/1/ -Method Put -Headers @{ Authorization = "Bearer $env:ACCESS_TOKEN" } -Body (@{ title = "About Me"; description = "Updated" } | ConvertTo-Json) -ContentType 'application/json'
```

- Contacts (admin)
	- GET /api/core/admin/contacts/ — list contact messages
	- GET/DELETE /api/core/admin/contacts/<pk>/ — retrieve or delete a message

	Example (list):

```powershell
curl.exe -H "Authorization: Bearer $env:ACCESS_TOKEN" http://localhost:8000/api/core/admin/contacts/
```

Notes and edge-cases
- Hero and About are singletons — attempting to create a second instance will return a validation error.
- File uploads (hero image, CV) are best tested via Postman or a simple frontend — PowerShell multipart file uploads are error-prone; prefer Postman for files.
- If you get 403/401 responses for admin endpoints, ensure the token belongs to a superuser (`is_superuser=True`) and include `Authorization: Bearer <access_token>` header.
- Contact creation is restricted to superusers in this API design — if you expect public contact submissions, tell me and I can expose `contact/` as public.

Postman tips
- Import `backend/postman/users.postman_collection.json` (already updated) then add new requests for the core endpoints above. Use the environment variable `access_token` (set after login) for the Authorization header.

Important: admin-only write operations
- Toutes les opérations de modification (POST, PUT, PATCH, DELETE) pour l'app `core` sont réservées aux comptes superuser (`is_superuser=True` dans la table `auth_user`).
- Cela inclut : création / modification / suppression de HeroSection, About, et la création/liste/suppression des messages de contact via les endpoints `admin/*`.
- Pour utiliser ces endpoints admin :
 	1) Créez un superuser : `python manage.py createsuperuser`
 	2) Récupérez un token admin via `/api/users/login/` (email/password)
 	3) Envoyez `Authorization: Bearer <access_token>` dans vos requêtes.

Tester avec Postman
--------------------

1) Préparer l'environnement Postman

- Créez un nouvel "Environment" dans Postman avec ces variables :
	- baseUrl : `http://localhost:8000` (ou l'URL de votre serveur)
	- access_token : (la valeur sera remplie après connexion)
	- refresh_token : (la valeur sera remplie après refresh)

2) Importer la collection

- Vous pouvez importer la collection fournie dans `backend/postman/users.postman_collection.json`.

3) Exemple de flux de test

Note: user registration via API has been disabled. Create users using `createsuperuser` or via your React admin.

- Obtenir token (email)
	- POST {{baseUrl}}/api/users/token-email/
	- Body JSON:
		{
			"email": "jean@example.com",
			"password": "Str0ngP@ssw0rd"
		}
	- Réponse attendue: { "access": "...", "refresh": "..." }
	- Copiez `access` dans la variable d'environnement `access_token`.

- Obtenir token (login par email)
	- POST {{baseUrl}}/api/users/login/
	- Body JSON:
		{
			"email": "jean@example.com",
			"password": "Str0ngP@ssw0rd"
		}
	- Réponse attendue: { "access": "...", "refresh": "..." }
	- Copiez `access` dans la variable d'environnement `access_token`.

- Utiliser l'Authorization Bearer
	- Dans les requêtes suivantes ajoutez l'en-tête `Authorization: Bearer {{access_token}}`.

- Récupérer le profil
	- GET {{baseUrl}}/api/users/me/

- Mettre à jour le profil
	- PUT {{baseUrl}}/api/users/me/
	- Body JSON (ex):
		{
			"first_name": "Jean-Michel",
			"last_name": "Dupont",
			"email": "jean@example.com"
		}

- Changer le mot de passe (auth requis)
	- POST {{baseUrl}}/api/users/change-password/
	- Body JSON:
		{
			"old_password": "Str0ngP@ssw0rd",
			"new_password": "N3wStr0ngP@ss"
		}

- Demander réinitialisation (forgot password)
	- POST {{baseUrl}}/api/users/password-reset/
	- Body JSON: { "email": "jean@example.com" }
	- Le serveur enverra un email (ou affichera en console selon la config). Le lien comprend `uid` et `token`.

- Confirmer réinitialisation
	- POST {{baseUrl}}/api/users/password-reset-confirm/?uid=<id>&token=<token>
	- Body JSON: { "new_password": "AnotherP@ssw0rd" }

Notes
- Le endpoint standard `/api/users/token/` (SimpleJWT) existe encore et attend les credentials par défaut (username/password). Utilisez `/api/users/token-email/` pour auth par email.
- Pour les tests locaux, configurez dans Django un email backend console (ou utilisez `send_mail` configuré) pour lire le lien de reset dans la console.

Tester l'envoi d'emails (password reset)
-------------------------------------

1) Vérifier la configuration dans `.env` (exemples déjà fournis) :

	- Pour envoyer via SMTP (ex: Gmail) :

	  EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
	  EMAIL_HOST=smtp.gmail.com
	  EMAIL_PORT=587
	  EMAIL_USE_TLS=True
	  EMAIL_HOST_USER=you@example.com
	  EMAIL_HOST_PASSWORD=<app-password>
	  DEFAULT_FROM_EMAIL=you@example.com

	- Pour développement (affiche les emails dans la console Django) :

	  # leave EMAIL_BACKEND unset or set to console
	  EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

2) Redémarrer le serveur Django après modification de `.env`.

3) Lancer la requête Postman :
	- POST {{baseUrl}}/api/users/password-reset/ with { "email": "jean@example.com" }

4) Résultats possibles :
	- Si `EMAIL_BACKEND` est `console`, le lien de reset s'affiche dans la console du serveur.
	- Si `EMAIL_BACKEND` est `smtp` et les identifiants sont corrects, le destinataire reçoit l'email.
	- Si l'envoi échoue, l'API renverra maintenant une 500 et le message d'erreur apparaîtra dans la console (nous n'utilisons plus `fail_silently=True`).

Debug rapide si vous ne recevez rien :
 - Vérifiez les logs de votre serveur (erreurs SMTP affichées).
 - Assurez-vous que `EMAIL_HOST_USER` et `EMAIL_HOST_PASSWORD` sont corrects et que le fournisseur autorise l'envoi (Gmail requiert App Passwords).
 - Essayez d'utiliser `console` backend pour confirmer que le workflow côté application fonctionne.


