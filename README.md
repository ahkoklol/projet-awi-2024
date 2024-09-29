testing tools:
- vitest
- @testing-library/react

safety tools:
firestore rules
  
  ```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null;
      allow read: if true
    }
  }
}
  ```
  

Firebase handles user sessions when a user logs in using Firebase Authentication. Let’s break down how this works:

1. User Session Management in Firebase:
When a user logs in using Firebase Authentication (whether through email/password, Google, or other methods), Firebase creates a session for that user.
This session persists even after the page is refreshed or the app is closed and reopened, as long as the user doesn’t explicitly log out or the session hasn’t expired.

2. Persistent Login (Session Persistence):
By default, Firebase uses persistent session management. This means that after logging in, Firebase saves the user's authentication state (session) in the browser’s local storage or session storage. This session remains active until:
The user logs out.
The session expires (in rare cases, such as token expiration).
The user manually clears the browser's cookies or local storage.

3. How Firebase Auth Session Works During Navigation:
When a user logs in, Firebase generates a JWT (JSON Web Token) for the user, which is used to authenticate requests.
Firebase will keep the user logged in across page reloads or navigations. When navigating between pages (using something like react-router-dom in React), the session will remain active as long as you don’t explicitly log out the user.

4. Is the Session Still Active During Navigation?
Yes, Firebase automatically restores the session when the user navigates between pages or refreshes the app.
You can use the auth.onAuthStateChanged method to check the user's authentication status whenever your app is loaded or the user navigates between routes.