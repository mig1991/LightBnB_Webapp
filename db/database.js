const properties = require("./json/properties.json");
const users = require("./json/users.json");

const { Pool } = require('pg');

const pool = new Pool({
  user: 'development',       // Your username
  host: 'localhost',         // Database server address
  database: 'lightbnb',  // Database name
  password: 'development',   // Your password
  port: 5432,                // Port number (default: 5432)
});

// Test the connection



// Rest of your database.js file...

// the following assumes that you named your connection variable `pool`
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database', err.stack);
  } else {
    console.log('Connected to the database at', res.rows[0].now);
  }
});
/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  const query = `
    SELECT * FROM users
    WHERE email = $1;
  `;
  return pool.query(query, [email.toLowerCase()])
    .then(res => res.rows[0] || null)
    .catch(err => console.error('query error', err.stack));
};


/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  const query = `
    SELECT * FROM users
    WHERE id = $1;
  `;
  return pool.query(query, [id])
    .then(res => res.rows[0] || null)
    .catch(err => console.error('query error', err.stack));
};


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {
  const query = `
    INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [user.name, user.email.toLowerCase(), user.password];
  return pool.query(query, values)
    .then(res => res.rows[0])
    .catch(err => console.error('query error', err.stack));
};


/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  return getAllProperties(null, 2);
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {
  return pool
    .query(`SELECT * FROM properties LIMIT $1`, [limit])
    .then((result) => {
      console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};
/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};