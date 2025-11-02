# TODO: Move Movie Fetching to Backend

## Backend Changes
- [x] Add axios dependency to backend/package.json
- [x] Create backend/controllers/moviesController.js with TMDB API functions (searchMovies, getPopularMovies, getMovieDetails)
- [x] Create backend/routes/movies.js to define movie endpoints (/search, /popular, /:id)
- [x] Update backend/server.js to register movies routes
- [ ] Add TMDB_API_KEY to backend/.env

## Frontend Changes
- [x] Update frontend/src/services/api.js to call backend endpoints instead of TMDB directly
- [ ] Remove REACT_APP_TMDB_API_KEY from frontend environment variables

## Testing
- [ ] Test backend movie endpoints
- [ ] Run the full app and verify movies load correctly
