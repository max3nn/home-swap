// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to the homeswap database
db = db.getSiblingDB('homeswap');

// Create a user for the application
db.createUser({
  user: 'homeswap_user',
  pwd: 'homeswap_password',
  roles: [
    {
      role: 'readWrite',
      db: 'homeswap'
    }
  ]
});

// Create initial collections with validation (optional)
db.createCollection('users');
db.createCollection('items');
db.createCollection('swaprequests');
db.createCollection('messages');
db.createCollection('reports');
db.createCollection('logs');

print('Database initialization completed for homeswap database');