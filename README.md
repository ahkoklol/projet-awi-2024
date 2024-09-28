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
  