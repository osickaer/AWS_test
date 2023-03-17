// *********************************
// <!-- Section 1 : Dependencies-->
// *********************************

// importing the dependencies
// Express is a NodeJS framework that, among other features, allows us to create HTML templates.
const express = require('express');
const bodyParser = require('body-parser');
const pgp = require('pg-promise')();
require('dotenv').config();

// ***********************************
// <!-- Section 2 : Initialization-->
// ***********************************

// defining the Express app
const app = express();
// using bodyParser to parse JSON in the request body into JS objects
app.use(bodyParser.json());
// Database connection details
const dbConfig = {
  host: 'db',
  port: 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};
// Connect to database using the above details
const db = pgp(dbConfig);

// ****************************************************
// <!-- Section 3 : Examples Enpoint Implementation-->
// ****************************************************

// <!-- Endpoint 1 :  Default endpoint ("/") -->
const message = 'Hey there!';
app.get('/', (req, res) => {
  res.send(message);
});



// ************************************************
// <!-- Section 4 : TODOs Enpoint Implementation-->
// ************************************************


// <!-- Endpoint 1 -->
app.get('/getTopTrails', function (req, res) {
    // Fetch query parameters from the request object
    // var trail_id = req.query.trail_id;
    // var name = req.query.name;
    // var location =  req.query.location;
    // var avg_rating = req.query.avg_rating


    const query = "SELECT * FROM trails WHERE location = 'California' ORDER BY avg_rating DESC LIMIT 3;";

    db.any(query)
      .then(function (data){
        res.status(200).json({
            status: 'success',
            data: data
        })
      })
      // if query execution fails
      // send error message
      .catch(err => {
        console.log('Uh Oh spaghettio');
        console.log(err);
      });
  });


  // <!-- Endpoint 2 -->
app.post('/addReview', function (req, res) {

  var username = req.body.username;
  var review = req.body.review;
  var rating = req.body.rating;

  var image_url = req.body.image_url;
  var image_caption = req.body.image_caption;

  var reviewQuery = `INSERT INTO reviews (username, review, rating) values ('${username}', '${review}', ${rating}) returning * ;`;
  imageQuery = `INSERT INTO images (image_url, image_caption) values ('${image_url}', '${image_caption}') returning * ;`;

  if(image_caption !== undefined || image_caption !== undefined){
    db.task('get-everything', task => {
      return task.batch([task.any(reviewQuery), task.any(imageQuery)]);
    })
      // if query execution succeeds
      // query results can be obtained
      // as shown below
      .then(function (data){
        var rti_query = `INSERT INTO reviews_to_images (image_id, review_id) values (${data[1][0].image_id}, ${data[0][0].review_id}) returning * ;`
        db.any(rti_query)
        .then(function (data){
          res.status(201).json({
              status: 'success',
              data: data,
              message: 'rti updated successfully',
          })
        })
        // if query execution fails
        // send error message
        .catch(err => {
          console.log('Uh Oh spaghettio');
          console.log(err);
        });

        console.log('Uh Oh spaghettio');
        res.status(201).json({
          status: 'success',
          data: data,
          message: 'data added successfully'
        });

      })
      // if query execution fails
      // send error message
      .catch(err => {
        console.log('Uh Oh spaghettio');
        console.log(err);
        res.status('400').json({
          error: err
        });
      });
  }
  else{
    db.any(reviewQuery)
    .then(data =>{
      res.status(201).json({
        status: "success",
        data: data,
        message: 'data added successfully'
      })
    })
    .catch(err => {
      console.log('Uh Oh spaghettio');
      console.log(err);
      res.status('400').json({
        error: err
      });
    })
  }
});


// <!-- Endpoint 3 -->
app.put('/update', function (req, res) {

  var review_id = req.body.review_id;
  var review = req.body.review;
  var rating = req.body.rating;

  var image_id = req.body.image_id;
  var image_url = req.body.image_url;
  var image_caption = req.body.image_caption;

  var update_review;
  var update_image;

  if(review_id !== null){
    if(review !== null && rating !== null){
      update_review = `UPDATE reviews SET review = '${review}', rating = ${rating} WHERE review_id = ${review_id} returning * ;`;
    }
    else if (review === null){
      update_review = `UPDATE reviews SET rating = ${rating} WHERE review_id = ${review_id} returning * ;`;
    }
    else{
      update_review = `UPDATE reviews SET rating = ${rating} WHERE review_id = ${review_id} returning * ;`;
    }
  }

  if(image_id !== null){
    if(image_url !== null && image_caption !== null){
      update_image = `UPDATE images SET image_url = '${image_url}', image_caption = '${image_caption}' WHERE image_id = ${image_id} returning * ;`;
    }
    else if (image_url === null){
      update_image = `UPDATE images SET image_caption = '${image_caption}' WHERE image_id = ${image_id} returning * ;`;
    }
    else{
      update_image = `UPDATE images SET image_url = '${image_url}' WHERE image_id = ${image_id} returning * ;`;
    }
  }

  db.task('get-everything', task => {
    return task.batch([task.any(update_review), task.any(update_image)]);
  })
    // if query execution succeeds
    // query results can be obtained
    // as shown below
    .then(function (data){
      console.log('Uh Oh spaghettio');
      res.status(200).json({
        status: 'success',
        data: data,
        message: 'data updated successfully'
      });

    })
    // if query execution fails
    // send error message
    .catch(err => {
      console.log('Uh Oh spaghettio');
      console.log(err);
      res.status('400').json({
        error: err
      });
    });

});

app.delete('/delete_review', function (req, res) {
  //Here we are using path parameter
  var review_id = req.query.review_id;
  var username = req.query.username;
  var rating = req.query.rating;

  var query;

  if (review_id) {
    query = `DELETE FROM reviews_to_images WHERE review_id IN (SELECT review_id FROM reviews WHERE review_id = ${review_id} ); DELETE FROM reviews WHERE review_id = ${review_id};`;
  } else if (username) {
    query = `DELETE FROM reviews_to_images WHERE review_id IN (SELECT review_id FROM reviews WHERE username = '${username}'); DELETE FROM reviews WHERE username = '${username}';`;
  } else if (rating) {
    query = `DELETE FROM reviews_to_images WHERE review_id IN (SELECT review_id FROM reviews WHERE rating = ${rating}); DELETE FROM reviews WHERE rating = ${rating};`;
  } else {
    return res.status(400).json({
      status: 'error',
      message: 'No valid parameters provided',
    });
  }

  db.query(query)
    .then(function () {
      res.status(200).json({
        status: 'success',
        message: 'Data deleted successfully',
      });
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).json({
        status: 'error',
        message: 'An error occurred while deleting data',
      });
    });
});


// <!-- Endpoint 4  -->
app.get('/search_trails', function (req, res) {
  // Fetch query parameters from the request object
  var name = req.query.name;
  var location = req.query.location;
  var length = req.query.length;
  var elevation_gain = req.query.elevation_gain;
  var difficulty = req.query.difficulty;
  var avg_rating =req.query.avg_rating;

  var query = `SELECT * FROM trails`;

  var conditions = [];

  if (name) {
    conditions.push(`name = '${name}'`);
  }
  if (location) {
    conditions.push(`location = '${location}'`);
  }
  if (length) {
    conditions.push(`length = ${length}`);
  }
  if (elevation_gain) {
    conditions.push(`elevation_gain = ${elevation_gain}`);
  }
  if (difficulty) {
    conditions.push(`difficulty = '${difficulty}'`);
  }
  if (avg_rating) {
    conditions.push(`avg_rating = ${avg_rating}`);
  }
  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(` AND `);
  }

  db.any(query)
    .then(function (data){
      res.status(200).json({
          status: 'success',
          data: data,
          message: 'data updated successfully',
      })
    })
    // if query execution fails
    // send error message
    .catch(err => {
      console.log('Uh Oh spaghettio');
      console.log(err);
    });
});

// <!-- Endpoint 5  -->
app.get('/search_trail_reviews', function (req, res) {
  // Fetch query parameters from the request object
  var trail_id = req.query.trail_id;

  const query = `SELECT * FROM trails
  INNER JOIN trails_to_reviews ON trails.trail_id = trails_to_reviews.trail_id
  INNER JOIN reviews ON trails_to_reviews.review_id = reviews.review_id WHERE trails.trail_id = ${trail_id};`;

  db.any(query)
  .then(function (data){
    res.status(200).json({
        status: 'success',
        data: data
    })
  })
  // if query execution fails
  // send error message
  .catch(err => {
    console.log('Uh Oh spaghettio');
    console.log(err);
  });
});





// *********************************
// <!-- Section 5 : Start Server-->
// *********************************
// starting the server and keeping the connection open to listen for more requests
app.listen(3000, () => {
  console.log('listening on port 3000');
});



