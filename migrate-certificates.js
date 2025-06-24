// Certificate Migration Script
// This script moves certificates from the legacy 'certificates' collection to the new 'credentials' collection

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  getDoc,
  doc,
  setDoc,
  deleteDoc
} = require('firebase/firestore');

// Initialize Firebase (will use .env in project root)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateCertificates() {
  console.log('Starting certificate migration...');
  
  // Get all certificates from legacy collection
  const certificatesRef = collection(db, 'certificates');
  const certificatesSnapshot = await getDocs(certificatesRef);
  
  if (certificatesSnapshot.empty) {
    console.log('No certificates found in legacy collection');
    return;
  }
  
  console.log(`Found ${certificatesSnapshot.size} certificates to migrate`);
  
  // Process each certificate
  const migrated = [];
  const failed = [];
  
  for (const oldCertDoc of certificatesSnapshot.docs) {
    try {
      const certData = oldCertDoc.data();
      
      // Check if this has all required fields
      if (!certData.userId || !certData.courseId) {
        console.log(`Certificate ${oldCertDoc.id} missing required fields, skipping`);
        failed.push({id: oldCertDoc.id, reason: 'Missing required fields'});
        continue;
      }
      
      // First check if the certificate already exists in the new collection
      const newCertRef = doc(db, 'credentials', oldCertDoc.id);
      const newCertSnapshot = await getDoc(newCertRef);
      
      if (newCertSnapshot.exists()) {
        console.log(`Certificate ${oldCertDoc.id} already exists in new collection, skipping`);
        migrated.push(oldCertDoc.id);
        continue;
      }
      
      // Create the new certificate document
      const newCertData = {
        id: oldCertDoc.id,
        userId: certData.userId,
        courseId: certData.courseId,
        courseName: certData.courseName || 'Unknown Course',
        issueDate: certData.issueDate || new Date(),
        skills: certData.skills || [],
        blockchainVerified: certData.blockchainVerified || false,
        blockchainTxHash: certData.blockchainTxHash || '',
        issuer: certData.issuer || 'CrediLink+',
        issuerId: certData.issuerId || 'credilink-system'
      };
      
      // Save to new collection
      await setDoc(newCertRef, newCertData);
      
      // Update user document to reference the certificate
      if (certData.userId) {
        const userRef = doc(db, 'users', certData.userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const credentials = userData.credentials || [];
          
          // Check if the certificate ID is already in the user's credentials
          if (!credentials.includes(oldCertDoc.id)) {
            credentials.push(oldCertDoc.id);
            
            await setDoc(userRef, {
              ...userData,
              credentials
            }, { merge: true });
          }
        }
      }
      
      // We don't delete the old certificate for safety, but you could uncomment this
      // await deleteDoc(doc(db, 'certificates', oldCertDoc.id));
      
      console.log(`Successfully migrated certificate ${oldCertDoc.id}`);
      migrated.push(oldCertDoc.id);
      
    } catch (error) {
      console.error(`Error migrating certificate ${oldCertDoc.id}:`, error);
      failed.push({id: oldCertDoc.id, error});
    }
  }
  
  console.log(`Migration complete. Successfully migrated: ${migrated.length}, Failed: ${failed.length}`);
  
  if (failed.length > 0) {
    console.log('Failed certificates:');
    failed.forEach(f => console.log(`- ${f.id}: ${f.reason || f.error}`));
  }
}

// Run the migration
migrateCertificates().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
}); 