const properties = require("./json/properties.json");
const users = require("./json/users.json");

const { Pool } = require("pg");

const pool = new Pool({
  user: "development", // Your username
  host: "localhost", // Database server address
  database: "lightbnb", // Database name
  password: "development", // Your password
  port: 5432, // Port number (default: 5432)
});

// Test the connection

// Rest of your database.js file...

// the following assumes that you named your connection variable `pool`
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Error connecting to the database", err.stack);
  } else {
    console.log("Connected to the database at", res.rows[0].now);
  }
});
/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  const query = `
    SELECT * FROM users
    WHERE email = $1;
  `;
  return pool
    .query(query, [email.toLowerCase()])
    .then((res) => res.rows[0] || null)
    .catch((err) => console.error("query error", err.stack));
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  const query = `
    SELECT * FROM users
    WHERE id = $1;
  `;
  return pool
    .query(query, [id])
    .then((res) => res.rows[0] || null)
    .catch((err) => console.error("query error", err.stack));
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  const query = `
    INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [user.name, user.email.toLowerCase(), user.password];
  return pool
    .query(query, values)
    .then((res) => res.rows[0])
    .catch((err) => console.error("query error", err.stack));
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  const query = `
    SELECT reservations.id, properties.title, properties.cost_per_night,
        reservations.start_date, reservations.end_date, avg(property_reviews.rating) as average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date DESC
    LIMIT $2;
  `;
  return pool
    .query(query, [guest_id, limit])
    .then((res) => res.rows)
    .catch((err) => console.error("query error", err.stack));
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
  const queryParams = [];
  let queryString = `
    SELECT properties.*, AVG(property_reviews.rating) as average_rating
    FROM properties
    LEFT JOIN property_reviews ON properties.id = property_reviews.property_id
  `;

  // Initialize the WHERE clause if any filters are provided
  let hasPreviousCondition = false;  // Track if any WHERE condition is added

  // 3. Filter by city
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += ` WHERE city LIKE $${queryParams.length} `;
    hasPreviousCondition = true;
  }

  // filter by owner_id
  if (options.owner_id) {
    queryParams.push(options.owner_id);
    queryString += hasPreviousCondition ? ` AND ` : ` WHERE `;
    queryString += `owner_id = $${queryParams.length}`;
    hasPreviousCondition = true;
  }

  // filter by minimum and maximum price per night
  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100);  // Convert dollars to cents
    queryParams.push(options.maximum_price_per_night * 100);  // Convert dollars to cents
    queryString += hasPreviousCondition ? ` AND ` : ` WHERE `;
    queryString += `cost_per_night BETWEEN $${queryParams.length - 1} AND $${queryParams.length}`;
    hasPreviousCondition = true;
  }

  // filter by minimum rating
  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += ` GROUP BY properties.id HAVING AVG(property_reviews.rating) >= $${queryParams.length}`;
  } else {
    queryString += ` GROUP BY properties.id`;
  }

  queryString += ` ORDER BY cost_per_night LIMIT $${queryParams.length + 1};`;
  queryParams.push(limit);

  // execute the query
  return pool.query(queryString, queryParams).then((res) => res.rows);
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
