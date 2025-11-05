const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Firebase Admin initialization with better error handling
let db;
try {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  db = admin.firestore();
  console.log('✅ Firebase connected successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
}

// TMDB API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Debug middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    tmdb: TMDB_API_KEY ? 'Configured' : 'Missing API Key',
    firebase: db ? 'Connected' : 'Not Connected'
  });
});

// Routes

// Get popular movies from TMDB
app.get('/api/movies/popular', async (req, res) => {
  try {
    console.log('Fetching popular movies from TMDB...');
    const response = await axios.get(
      `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching popular movies:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch movies',
      details: error.response?.data?.status_message || error.message 
    });
  }
});

// Search movies
app.get('/api/movies/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    console.log(`Searching movies for: ${query}`);
    const response = await axios.get(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error searching movies:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to search movies',
      details: error.response?.data?.status_message || error.message 
    });
  }
});

// Get movie details
app.get('/api/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Valid movie ID is required' });
    }

    console.log(`Fetching movie details for ID: ${id}`);
    
    const response = await axios.get(
      `${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&language=en-US`
    );
    
    console.log(`✅ Successfully fetched movie: ${response.data.title}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching movie details:', {
      movieId: req.params.id,
      error: error.response?.data || error.message,
      status: error.response?.status
    });
    
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    if (error.response?.status === 401) {
      return res.status(500).json({ error: 'Invalid TMDB API key' });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch movie details',
      details: error.response?.data?.status_message || error.message 
    });
  }
});

// Create a review - UPDATED WITH BETTER DEBUGGING
app.post('/api/reviews', async (req, res) => {
  try {
    const { movieId, userId, userName, rating, comment, movieTitle, moviePoster } = req.body;
    
    console.log('📝 Creating review with data:', {
      movieId, userId, userName, rating, comment: comment?.substring(0, 50) + '...'
    });
    
    if (!movieId || !userId || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const review = {
      movieId: movieId.toString(), // Ensure it's a string
      userId: userId.toString(),   // Ensure it's a string
      userName: userName || 'Anonymous',
      rating: parseInt(rating),
      comment: comment || '',
      movieTitle: movieTitle || 'Unknown Movie',
      moviePoster: moviePoster || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('💾 Saving review to Firebase...');
    const docRef = await db.collection('reviews').add(review);
    console.log(`✅ Review created with ID: ${docRef.id}`);
    
    // Verify the review was saved by reading it back
    const savedDoc = await db.collection('reviews').doc(docRef.id).get();
    console.log(`🔍 Verified saved review:`, savedDoc.data());
    
    res.json({ id: docRef.id, ...review });
  } catch (error) {
    console.error('❌ Error creating review:', error);
    console.error('❌ Error details:', error.message);
    res.status(500).json({ 
      error: 'Failed to create review',
      details: error.message 
    });
  }
});

// Get reviews for a movie
app.get('/api/reviews/movie/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    const snapshot = await db.collection('reviews')
      .where('movieId', '==', movieId)
      .orderBy('createdAt', 'desc')
      .get();

    const reviews = [];
    snapshot.forEach(doc => {
      reviews.push({ id: doc.id, ...doc.data() });
    });

    console.log(`✅ Fetched ${reviews.length} reviews for movie ${movieId}`);
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get user's reviews - UPDATED WITH BETTER ERROR HANDLING
app.get('/api/reviews/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔍 Fetching reviews for user: ${userId}`);
    
    // First, let's test without ordering to see if we can get any reviews
    let snapshot;
    try {
      // Try with ordering first
      snapshot = await db.collection('reviews')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
    } catch (orderError) {
      console.log('⚠️ Ordering failed, trying without orderBy...');
      // If ordering fails, try without it
      snapshot = await db.collection('reviews')
        .where('userId', '==', userId)
        .get();
    }

    const reviews = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`📝 Found review:`, {
        id: doc.id,
        movieId: data.movieId,
        userId: data.userId,
        rating: data.rating,
        createdAt: data.createdAt
      });
      reviews.push({ id: doc.id, ...data });
    });

    console.log(`✅ Found ${reviews.length} reviews for user ${userId}`);
    res.json(reviews);
  } catch (error) {
    console.error('❌ Error fetching user reviews:', error);
    console.error('❌ Error details:', error.message);
    
    // Check if it's an index error
    if (error.message && error.message.includes('index')) {
      res.status(500).json({ 
        error: 'Firebase index required. Please create a composite index for reviews collection.',
        details: error.message 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch user reviews',
        details: error.message 
      });
    }
  }
});

// Update a review
app.put('/api/reviews/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    await db.collection('reviews').doc(id).update({
      rating: parseInt(rating),
      comment,
      updatedAt: new Date().toISOString()
    });

    res.json({ message: 'Review updated successfully' });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete a review
app.delete('/api/reviews/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('reviews').doc(id).delete();
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🎬 Movie Review Platform Backend running on port ${PORT}`);
  console.log(`🔑 TMDB API Key: ${TMDB_API_KEY ? 'Present' : 'MISSING!'}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});