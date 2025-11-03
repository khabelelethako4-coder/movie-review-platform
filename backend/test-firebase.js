const admin = require('firebase-admin');

// Your Firebase service account credentials
const serviceAccount = {
  type: "service_account",
  project_id: "movie-review-platform-9e5b1",
  private_key_id: "50a8003b07a671b0cf41cb74bb8a05f25f884daa",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDMgVR8//QdE/d3\nhxQtTeatXKd5lUfKsV/pMjBFqpZZthXCEZ6pmL50J4o1ztWEtusYFIbpTUKWIsi2\nWnKW5d53yCvUxPMnhsHqyh9nVBu5Ra8eAjXNXKCKe1fxyEIjywdgKA7E4lm1Sre7\nH4yrt3np4J7fdVwdvRpOQZqdGaCTvH+FeN+QkKm8cOsb11bFgi1g4iuNdhAUt1fD\nWch776nqZZixkd0axlDNp36Stg2ZoYEJpWa11BmTMKUY6K7GmRfNJEgsR/gSmneb\nf4UFFxAQgfwa2qbBSrNmsqbpi+CPF3yuhAnU7v8SntRxplSxJPN8Jt7Ea8sAsG50\nXNhpEuVbAgMBAAECggEAMZS1eCzR8W7S047TTHyTjbpl/Cs+IZ1JZI8/dtR56Twl\nIE0HS5T1r9GaR5ti1u9GJitr3gpWN3IteVCKcZ0/h4jnX4l0bkPUpejlHjcdFZkY\ncM0WYDixz4FB/COSLX1ex2hO1FsQZsy7qMloYIV2MEa+He0lLSyYwRpUsvvwm4Br\nafHwgmKCNqJzCC+h7NlF35V7w00F0me1z94DcPXX/Brpk1wKhE3zGawYw5OS9df2\nGW8orezLUo1JN5WFp/XXwRb0tvCrdHT0c8HIvJFoDhWMrpVcN020gbHQeuahWQ3u\nf2UTF5BY7lPfFAmXWNGtBFXQroQP1fFEkfN6fFGnSQKBgQD8e8pAOscDfEDxVGxS\n0sUvpZupQARqWXaZgLyP2NY0G5ou1lGxjbVFuhK7lv6FJgBw/a9gSPWFK5IeNCQ8\noW2B2PRj1Wl6HrHkepjgaoPakanHBq88x2k3aEXBUjscMJ8Bg17Qt5GpUq4XSAVD\ncwkR74R+nSoBDIbe/BvBGYkLTQKBgQDPWnobV5uoIi01uHzhr9KmXBTQj5YS+n/I\n+znGPnHRa5BWNjlTGZHh8v/6flyjSYOkvGWdCWuBYyV/vflzIugU/w0T2slAFN3Y\ngq30LJgAD5lgC/fPqbW6UukNJmsjVj/GX3/cMBRTFJhHWtLg9xJclCUjdHf/1NsB\n3B1AXeRPRwKBgQCJI3/2pTZlyT7JFk8EKaGbQLutEa2USmWl+QvyohevE/MKT7Tt\n2QfGCMyWAezbS4nf1ZtFlDtvivwB1dZ87D270qjj9Q4mm7eKX6Db/F8EACyUgyf5\nvmKDCusgl1at+CbVvpJokdzXeKZA1Qiu2zPo/w0bbKhdC33SbmNw3jrW3QKBgFSn\nV5q6Fa565YI9I57wLUwF4+mR9W8iHfFrv5aT/9vD0lWgJZ8rnUdl8ePOmvt/E+O5\nlrKaGe3lEHYqlSDQa3fG+QvWEru6ySePkn1Rh2ze8Xso5688VhkPqF3aBXuTxs2y\nR30Zk/KnQdQ/3EBEHpb1VIQ5FJS5zf/gYYDZ1FAZAoGBAJ8XDN1H/N8tALWs+unx\nFz1Kaddnh9I1vor80lkwz6Mh/whbWqPfBob4ZwX/bYzINpsHr9dsksj2N0koxDPz\nHi931/BQNyTgbhAOZi+wqGdH1BXpkhdInU7jTFEkeKCOhY5aylTth9UdvpsSpmJJ\ndPswNMmRgMBGY/kICZRDQtn/\n-----END PRIVATE KEY-----",
  client_email: "firebase-adminsdk-fbsvc@movie-review-platform-9e5b1.iam.gserviceaccount.com",
  client_id: "110362907419114867035",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
};

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Test Firebase connection
async function testFirebaseConnection() {
  try {
    console.log('🧪 Testing Firebase connection...');
    
    // Test by listing collections
    const collections = await db.listCollections();
    console.log('✅ Firebase connected successfully!');
    console.log('📁 Available collections:', collections.map(col => col.id));
    
    // Test writing a document
    const testDocRef = db.collection('test').doc('connection-test');
    await testDocRef.set({
      message: 'Firebase connection test',
      timestamp: new Date().toISOString(),
      status: 'success'
    });
    console.log('✅ Test document written successfully!');
    
    // Test reading the document
    const doc = await testDocRef.get();
    if (doc.exists) {
      console.log('✅ Test document read successfully:', doc.data());
    }
    
    // Clean up test document
    await testDocRef.delete();
    console.log('✅ Test document cleaned up successfully!');
    
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
  }
}

// Test TMDB API connection
const axios = require('axios');

async function testTMDBConnection() {
  try {
    console.log('\n🧪 Testing TMDB API connection...');
    
    const TMDB_API_KEY = 'fce2460d0efb47e7d4e680feaa9b43b7';
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`
    );
    
    console.log('✅ TMDB API connected successfully!');
    console.log(`🎬 Found ${response.data.results.length} popular movies`);
    console.log('📽 Sample movie:', response.data.results[0].title);
    
  } catch (error) {
    console.error('❌ TMDB API connection failed:', error.response?.data || error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive connection tests...\n');
  
  await testFirebaseConnection();
  await testTMDBConnection();
  
  console.log('\n✨ All tests completed!');
  process.exit(0);
}

runAllTests();