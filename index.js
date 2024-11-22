// Dallen Schuetzler
// Section 02-15
// Assignment 4
let express = require("express");
let app = express();
let path = require("path");
let security = false;
const port = process.env.PORT || 5000;
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
// links the pokemon table in the assignment 3 database
const knex = require("knex") ({
    client : "pg",
    connection : {
        host : "localhost",
        user : "postgres",
        password : "DallensPostMalazan21",
        database : "assignment3",
        port : 5432
    }
})

// Route to display Pokemon records
app.get('/', (req, res) => {
    knex('pokemon')
      .join('poke_type', 'pokemon.poke_type_id', '=', 'poke_type.id')
      .select(
        'pokemon.id',
        'pokemon.description',
        'pokemon.base_total',
        'pokemon.date_created',
        'pokemon.active_poke',
        'pokemon.gender',
        'pokemon.poke_type_id',
        'poke_type.description as poke_type_description'
      )
      .then(pokemon => {
        // Render the index.ejs template and pass the data
        res.render('index', { pokemon });
      })
      .catch(error => {
        console.error('Error querying database:', error);
        res.status(500).send('Internal Server Error');
      });
  });

app.get('/editPoke/:id', (req, res) => {
    let id = req.params.id;
    // Query the Pokémon by ID first
    knex('pokemon')
      .where('id', id)
      .first()
      .then(pokemon => {
        if (!pokemon) {
          return res.status(404).send('Pokémon not found');
        }
        // Query all Pokémon types after fetching the Pokémon
        knex('poke_type')
          .select('id', 'description')
          .then(poke_types => {
            // Render the edit form and pass both pokemon and poke_types
            res.render('editPoke', { pokemon, poke_types });
          })
          .catch(error => {
            console.error('Error fetching Pokémon types:', error);
            res.status(500).send('Internal Server Error');
          });
      })
      .catch(error => {
        console.error('Error fetching Pokémon for editing:', error);
        res.status(500).send('Internal Server Error');
      });
  });

app.post('/editPoke/:id', (req, res) => {
    const id = req.params.id;
    // Access each value directly from req.body
    const description = req.body.description;
    const base_total = parseInt(req.body.base_total); // Convert to integer
    const date_created = req.body.date_created;
    // Since active_poke is a checkbox, its value is only sent when the checkbox is checked.
    // If it is unchecked, no value is sent to the server.
    // This behavior requires special handling on the server-side to set a default
    // value for active_poke when it is not present in req.body.
    const active_poke = req.body.active_poke === 'true'; // Convert checkbox value to boolean
    const gender = req.body.gender;
    const poke_type_id = parseInt(req.body.poke_type_id); // Convert to integer
    // Update the Pokémon in the database
    knex('pokemon')
      .where('id', id)
      .update({
        description: description,
        base_total: base_total,
        date_created: date_created,
        active_poke: active_poke,
        gender: gender,
        poke_type_id: poke_type_id,
      })
      .then(() => {
        res.redirect('/'); // Redirect to the list of Pokémon after saving
      })
      .catch(error => {
        console.error('Error updating Pokémon:', error);
        res.status(500).send('Internal Server Error');
      });
  });

app.post('/deletePoke/:id', (req, res) => {
    const id = req.params.id;
    knex('pokemon')
      .where('id', id)
      .del() // Deletes the record with the specified ID
      .then(() => {
        res.redirect('/'); // Redirect to the Pokémon list after deletion
      })
      .catch(error => {
        console.error('Error deleting Pokémon:', error);
        res.status(500).send('Internal Server Error');
      });
  });


app.get('/addPoke', (req, res) => {
    // Fetch Pokémon types to populate the dropdown
    knex('poke_type')
        .select('id', 'description')
        .then(poke_types => {
            // Render the add form with the Pokémon types data
            res.render('addPoke', { poke_types });
        })
        .catch(error => {
            console.error('Error fetching Pokémon types:', error);
            res.status(500).send('Internal Server Error');
        });
});

app.post('/addPoke', (req, res) => {
  // Extract form values from req.body
  const description = req.body.description || ''; // Default to empty string if not provided
  const base_total = parseInt(req.body.base_total, 10); // Convert to integer
  const date_created = req.body.date_created || new Date().toISOString().split('T')[0]; // Default to today
  const active_poke = req.body.active_poke === 'true'; // Checkbox returns true or undefined
  const gender = req.body.gender || 'U'; // Default to 'U' for Unknown
  const poke_type_id = parseInt(req.body.poke_type_id, 10); // Convert to integer
  // Insert the new Pokémon into the database
  knex('pokemon')
      .insert({
          description: description.toUpperCase(), // Ensure description is uppercase
          base_total: base_total,
          date_created: date_created,
          active_poke: active_poke,
          gender: gender,
          poke_type_id: poke_type_id,
      })
      .then(() => {
          res.redirect('/'); // Redirect to the Pokémon list page after adding
      })
      .catch(error => {
          console.error('Error adding Pokémon:', error);
          res.status(500).send('Internal Server Error');
      });
});

app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  try {
      // Query the user table to find the record
      const user = knex('user')
          .select('*')
          .where({ username, password }) // Replace with hashed password comparison in production
          .first(); // Returns the first matching record
      if (user) {
          security = true;
      } else {
          security = false;
      }
  } catch (error) {
      res.status(500).send('Database query failed: ' + error.message);
  }
  res.redirect("/")
});

// sets the app to listen
app.listen( port, () => console.log('Listening'));