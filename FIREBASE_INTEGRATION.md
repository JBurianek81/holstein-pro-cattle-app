# Firebase Integration Documentation

## Overview
This document describes the complete Firebase integration for the Cattle Management App, including authentication, Firestore database structure, and security rules.

## Firebase Configuration

### Project Details
- **Project ID**: `cattle-management-app-ae01b`
- **Hosting URL**: https://cattle-management-app-ae01b.web.app
- **Firebase Console**: https://console.firebase.google.com/project/cattle-management-app-ae01b

### Configuration Files
- `src/firebase/config.js` - Main Firebase configuration
- `src/utils/firestoreService.js` - Complete Firestore service layer
- `firestore.rules` - Security rules for data access

## Database Structure

### Collections

#### 1. `users` Collection
Stores user profiles and authentication data.

**Document Structure:**
```javascript
{
  uid: "user_uid",
  email: "user@example.com",
  name: "User Name",
  role: "owner" | "member",
  farmCode: "ABC123",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 2. `farms` Collection
Stores farm information and member management.

**Document Structure:**
```javascript
{
  farmCode: "ABC123",
  name: "Farm Name",
  ownerName: "Owner Name",
  ownerEmail: "owner@example.com",
  members: ["member1@example.com", "member2@example.com"],
  settings: {
    operationType: "Dairy",
    herdSize: "100-500",
    yearsInOperation: "15"
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 3. `farmData` Collection
Stores all cattle and farm-specific data.

**Document Structure:**
```javascript
{
  cows: [
    {
      id: "cow-123",
      tagNumber: "12345",
      name: "Cow Name",
      dateOfBirth: "2020-01-01",
      category: "Cow",
      breed: "Holstein",
      productionStatus: "Milking",
      reproductiveStatus: "Open",
      healthRecords: [...],
      breedingRecords: [...],
      createdAt: Timestamp,
      updatedAt: Timestamp
    }
  ],
  bullInventory: [
    {
      id: "bull-123",
      name: "Bull Name",
      naabCode: "NAAB123",
      breed: "Holstein",
      straws: 25,
      cost: 25.00,
      description: "Description"
    }
  ],
  profileData: {
    farmName: "Farm Name",
    ownerName: "Owner Name",
    farmAddress: "Address",
    phone: "Phone",
    email: "Email",
    operationType: "Dairy",
    herdSize: "100-500",
    yearsInOperation: "15",
    farmLogo: null
  },
  updatedAt: Timestamp
}
```

## Authentication Flow

### 1. User Registration
```javascript
import { firebaseAuth } from '../utils/firestoreService';

const result = await firebaseAuth.createUser(email, password, {
  name: "User Name",
  role: "owner",
  farmCode: "ABC123"
});
```

### 2. User Login
```javascript
const result = await firebaseAuth.signIn(email, password);
```

### 3. Farm Creation
```javascript
import { farmService } from '../utils/firestoreService';

const result = await farmService.createFarm({
  farmCode: "ABC123",
  name: "Farm Name",
  ownerName: "Owner Name",
  ownerEmail: "owner@example.com",
  members: ["owner@example.com"]
});
```

### 4. Adding Farm Members
```javascript
const result = await farmService.addMemberToFarm(farmCode, userEmail);
```

## Data Management

### 1. Getting Farm Data
```javascript
import { farmDataService } from '../utils/firestoreService';

const result = await farmDataService.getFarmData(farmCode);
```

### 2. Updating Farm Data
```javascript
const result = await farmDataService.updateFarmData(farmCode, {
  cows: updatedCows,
  bullInventory: updatedBullInventory,
  profileData: updatedProfileData
});
```

### 3. Adding Cattle
```javascript
const result = await farmDataService.addCowToFarm(farmCode, cowData);
```

### 4. Updating Cattle
```javascript
const result = await farmDataService.updateCowInFarm(farmCode, cowId, updatedCowData);
```

## Security Rules

### User Access
- Users can only read/write their own user document
- Authentication required for all operations

### Farm Access
- Farm members can read farm information
- Only farm owners can modify farm settings
- Authentication required for all operations

### Farm Data Access
- Farm members can read/write farm data
- Access verified through farm membership
- Authentication required for all operations

## Utility Functions

### Farm Code Generation
```javascript
import { utils } from '../utils/firestoreService';

const farmCode = utils.generateFarmCode(); // Returns 6-character code
```

### Validation Functions
```javascript
const isValidEmail = utils.validateEmail(email);
const isValidPassword = utils.validatePassword(password);
const isValidFarmCode = utils.validateFarmCode(farmCode);
```

### ID Generation
```javascript
const uniqueId = utils.generateId('cow'); // Returns "cow-timestamp-random"
```

## Batch Operations

### Batch Updates
```javascript
import { batchService } from '../utils/firestoreService';

const result = await batchService.batchUpdate([
  { collection: 'farmData', docId: farmCode, data: { cows: updatedCows } },
  { collection: 'farms', docId: farmCode, data: { members: updatedMembers } }
]);
```

### Batch Sets
```javascript
const result = await batchService.batchSet([
  { collection: 'users', docId: userId, data: userData },
  { collection: 'farms', docId: farmCode, data: farmData }
]);
```

## Error Handling

All service functions return a consistent response format:
```javascript
{
  success: boolean,
  data?: any,
  error?: string
}
```

## Deployment

### 1. Build the Application
```bash
npm run build
```

### 2. Deploy to Firebase
```bash
npx firebase-tools deploy
```

### 3. Verify Deployment
- Check Firebase Console for successful deployment
- Test authentication flows
- Verify data persistence

## Best Practices

1. **Always check authentication state** before accessing data
2. **Use batch operations** for multiple document updates
3. **Implement proper error handling** for all Firebase operations
4. **Validate data** before writing to Firestore
5. **Use security rules** to enforce access control
6. **Monitor usage** through Firebase Console

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify Firebase configuration
   - Check if user is properly authenticated
   - Ensure email/password are correct

2. **Permission Denied**
   - Verify security rules
   - Check if user has proper access to farm
   - Ensure user is a member of the farm

3. **Data Not Persisting**
   - Check network connectivity
   - Verify Firestore rules allow write operations
   - Check for JavaScript errors in console

### Debug Mode
Enable debug logging by checking browser console for detailed error messages from the Firestore service. 