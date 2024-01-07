const nodeCache = require('node-cache');
const myCache = new nodeCache();

// Function to set a value in the cache
function store(key, value) {
  let ttl = 120 // time-to-live for the cache entry in seconds
  try {
    myCache.set(key, value, ttl);
    console.log(`Data stored successfully for token: ${key}`);
  } catch (err) {
    console.error('Error storing data in cache:', err);
    throw new Error('Failed to persist user verification data');
  }
}

// Function to get a value from the cache
function retrieve(key) {
  try {
    let value = myCache.get(key);
    if (value) {
      console.log(`Data retrieved successfully for token: ${key}`);
      return value;
    } else {
      console.log(`No data found for token: ${key}`);
      return null;
    }
  } catch (error) {
    console.error('Error retrieving data from cache:', error);
    throw new Error('Failed to retrieve user verification data');
  }
}

// Export the functions for external use
module.exports = {
  store,
  retrieve
};