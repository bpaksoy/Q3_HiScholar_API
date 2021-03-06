var fs = require("fs");
const env = process.env.NODE_ENV || "development";
const config = require('./knexfile.js')[env];
const knex = require('knex')(config);
const express = require('express');
const port = process.env.PORT || 5050;
const app = express();
const bodyParser= require("body-parser");
const bcrypt = require("bcrypt-as-promised");

const ejs = require("ejs");
app.set("view engine", "ejs")

app.use( express.static( "public" ));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(function (req, res, next) {

      // Website you wish to allow to connect
      res.header('Access-Control-Allow-Origin', "*")

      // Request methods you wish to allow
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

      // Request headers you wish to allow
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

      // Set to true if you need the website to include cookies in the requests sent
      // to the API (e.g. in case you use sessions)
      res.setHeader('Access-Control-Allow-Credentials', true);

      // Pass to next layer of middleware
      next();
  });

app.get("/sign_up", function(req,res, next){
  //res.send("hello");
 res.render("signup");
});

app.get("/sign_in", function(req, res, next){
  res.render("signin");
});

app.get("/sign_out", function(req, res, next){
  res.render("signout");
});

app.get("/forgot_password", function(req, res, next){
  res.render("error");
});

// app.get("/profile", function(req, res, next){
//   res.render("profile");
// });


app.get("/users/:id/newsfeed", function(req, res, next){
  const id = req.params.id;
  knex("users")
   .where("id", id)
   .first()
   .then(function(user){
     knex("students")
      .where("user_id", id)
      .first()
      .then(function(student){
        knex("university_selection")
        .where("user_id", id)
        .first()
        .then(function(schools){
          console.log("user", user, "schools: ", schools);
          res.render("newsfeed", {user, student, schools});
        }).catch(function(err){
        console.log(err);
        });
      })
  })
})

function isValid(id){
  return !isNaN(id);
}

app.get("/users/:id/profile", function(req, res, next){
  const id = req.params.id;
  knex("users")
   .where("id", id)
   .first()
   .then(function(user){
     knex("students")
      .where("user_id", id)
      .first()
      .then(function(profile){
        knex("statement")
         .where("user_id", id)
         .first()
         .then(function(post){
           knex("university_selection")
           .where("user_id", id)
           .first()
            .then(function(schools){
              knex("programs")
              .where("user_id", id)
              .then(function(programs){
                knex("universities")
                .then(function(data){
                  //console.log("this is data ", data, "this is schools: ", schools)
                  res.json({user, profile, post, schools, programs, data});
                  }).catch(function(err){
                  console.log(err);
                });
                })
              //console.log("this is programs", programs);
           })
        });
    });
  });
});

app.get("/users", function(req, res, next){
   knex("users")
    .then(function(result){
         console.log("List of result", result);
         res.json(result);
   }).catch(function(err){
     console.log(err);
   });
});

app.get("/students_info", function(req, res, next){
   knex("students_info")
    .then(function(result){
         console.log("List of result", result);
         res.json(result);
   }).catch(function(err){
     console.log(err);
   });
});

app.get("/users/:id", function(req, res, next){
   const id = req.params.id;
   knex("users")
    .where("id", id)
    .first()
    .then(function(user){
         console.log("user", user);
         res.render("user", {user});
   }).catch(function(err){
     console.log(err);
   });
});

//to create and post a personal statement
// app.post("/users/:id/profile/statement", function(req, res, next){
//   const id = req.params.id;
//   const {title, post} = req.body;
//   knex("users")
//    .where("id", id)
//    .first()
//    .then(function(user){
//       knex("statement")
//       .insert({
//         title: title,
//         post: post,
//         user_id: id
//      }).then(function(){
//     res.redirect("/users/" + id + "/profile" )
//    });
//  });
// });

// current Personal Statement POST requests
// needs to be refactored to reflect user_id
// see above commented out function ^
app.post("/users/statement", function(req, res, next) {
  const {title, post} = req.body;
  knex("statement")
  .insert({
    title: title,
    post: post
  })
  .catch(err => next(err))
})

app.post("/users/:id/newsfeed", function(req, res, next){
  const id = req.params.id;
  knex("users")
   .where("id", id)
   .first()
    .then(function(){
    res.redirect("/users/" + id + "/newsfeed" );
   });
});

app.delete("/users/:id/schools/:school_id", function(req, res, next){
  const id = parseInt(req.params.id);
  const school_id = parseInt(req.params.school_id);
  let school;
  knex("universities")
    .where("school_id", id)
    .first()
    .then(function(row){
      school = row;
       return knex("universities")
        .del()
        .where("school_id", id);
     })
    .then(function(){
      res.redirect("users/" + id + "/profile");
    });
});

//to post schools of choice
app.post("/users/:id/profile/schools", function(req, res, next){
  const id = req.params.id;
  const {school_name} = req.body;
  knex("users")
   .where("id", id)
   .first()
   .then(function(user){
      knex("university_selection")
      .insert({
        school_name: school_name,
        user_id: id
     }).then(function(){
    res.redirect("/users/" + id + "/profile" );
   });
 });
});


//to post programs of choice
app.post("/users/:id/profile/programs", function(req, res, next){
  const id = req.params.id;
  const { program_name } = req.body;
  knex("users")
   .where("id", id)
   .first()
   .then(function(user){
      knex("programs")
      .insert({
        program_name: program_name,
        user_id: id
     }).then(function(){
    res.redirect("/users/" + id + "/profile" );
   });
 });
});

//create and post personal information to students table
app.post("/users/:id", function(req, res, next){
  const id = req.params.id;
  const {first_name, last_name, country, city, state, alma_mater, gpa, toefl, ielts, sat} = req.body;
     knex("students_info")
     .insert({
       first_name: first_name,
       last_name: last_name,
       country: country,
       city: city,
       state: state,
       alma_mater: alma_mater,
       gpa: gpa,
       toefl: toefl,
       ielts: ielts,
       sat:sat
     }).catch(err => next(err));
});



//compare sign in information with users table
app.post("/sign_in", function(req, res, next){
 const {username, password} = req.body;
  knex("users")
  .where("username", username)
  .first()
  .then(function(user){
      bcrypt.compare(password, user.hashed_password)
      .then(function(){
        knex("students")
        .where("name", undefined)
        .then(function(){
          res.redirect("/users/" + user.id);
        })
        .catch(function(){
          res.redirect("/users/" + user.id + "/profile");
        })
      });
   })
  .catch(function(err){
    res.redirect("/sign_in");
  });

});

// create a user
// sign up to the page and insert information to
// users table
app.post('/sign_up', (req, res, next) => {
  const { username, email, hashed_password } = req.body;
  knex('users')
  .insert({
    username,
    email,
    hashed_password
  })
  .then(() => {
    knex('users')
    .where('username', username)
    .first()
    .then((username) => {
      console.log(req.body);
      res.redirect("/users")
    })
  }).catch((err) => next(err));
})

// POST personal profile data
app.post("/profile", function(req, res, next) {
    const id = req.params.id;
    const { first_name, last_name, country, city, state, alma_mater, gpa, toefl, ielts, sat } = req.body;
    knex("students_info")
    .insert({
      first_name,
      last_name,
      country,
      city,
      state,
      alma_mater,
      gpa,
      toefl,
      ielts,
      sat
    })
    .catch(err => next(err));
})

app.listen(port, function(){
  console.log("Listening on ", port);
});
