var express = require("express");
var router = express.Router();
var models = require("../models/models");
var User = models.User;

module.exports = function(passport) {
  // Add Passport-related auth routes here, to the router!
  // YOUR CODE HERE
  router.get("/", (req, res) => {
    if (!req.user) {
      //if there is no username to a user
      res.redirect("/login"); //redirect them to the login page
    } else {
      res.redirect("/contacts"); // otherwise bring them to the contacts page
    }
  });

  router.get("/signup", (req, res) => {
    res.render("signup");
  });

  router.post("/signup", (req, res) => {
    if (req.body.password === req.body.passwordRepeat) {
      //make the bew user and save to the database
      let newUser = new User({
        username: req.body.username,
        password: req.body.password,
        phone: req.body.phoneNumber
      }).save((err, user) => {
        if (err) {
          res.redirect("/signup");
        } else {
          console.log("USER WAS SUCCESFFULY MADE AND SAVED", user);
          res.redirect("/login");
        }
      });
      // return newUser;
    }
  });

  router.get("/login", (req, res) => {
    /// this redirects to the login page
    res.render("login");
  });

  router.post(
    "/login",
    passport.authenticate("local", {
      successRedirect: "/contacts",
      failureRedirect: "/login"
    })
  );

  router.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/login");
  });

  return router;
};
