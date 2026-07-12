# Firebase Setup (HAI Website)

## 1) Create Firebase web app
- Open Firebase Console
- Select your project
- Add a **Web App**
- Copy config values into `firebase-config.js`

## 2) Enable services
- Authentication -> Sign-in method -> enable **Email/Password**
- Firestore Database -> create database
- Storage -> create bucket

## 3) Create admin user
- Firebase Console -> Authentication -> Users -> Add user
- Add your admin email and password (for example: your own password)
- Do **not** hardcode passwords in code.

## 4) Deploy rules and hosting
Run these commands in project folder:

```bash
firebase login
firebase init
firebase deploy
```

If you already initialized Firebase in this folder, run:

```bash
firebase deploy --only hosting,firestore:rules,storage
```

## 5) Use the admin page
- Open `/admin.html`
- Sign in with Firebase admin email/password
- Edit sections, apps, links, videos
- Upload logo/hero image directly to Firebase Storage
- Click **Save Changes** to write to Firestore
