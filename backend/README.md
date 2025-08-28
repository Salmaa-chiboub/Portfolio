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
```

API endpoints (examples):
- POST /api/users/register/  -> register
- POST /api/users/token/ -> obtain JWT (email as username)
- POST /api/users/token/refresh/ -> refresh token
 - POST /api/users/login/ -> obtain JWT (email + password)
 - POST /api/users/token/refresh/ -> refresh token
- GET/PUT /api/users/me/ -> profile retrieve / update (requires Bearer token)
- POST /api/users/change-password/ -> change password (authenticated)
- POST /api/users/password-reset/ -> request reset link
- POST /api/users/password-reset-confirm/?uid=<id>&token=<token> -> confirm reset

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

- Register (création utilisateur)
	- POST {{baseUrl}}/api/users/register/
	- Body JSON:
		{
			"first_name": "Jean",
			"last_name": "Dupont",
			"email": "jean@example.com",
			"password": "Str0ngP@ssw0rd"
		}

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


