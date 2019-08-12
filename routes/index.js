var express = require("express");
var router = express.Router();
var models = require("../models/models");
var Contact = models.Contact;
var User = models.User;
var Message = models.Message;

// SET UP FOR TIWLIO //
var accountSid = process.env.TWILIO_SID; // Your Account SID from www.twilio.com/console
var authToken = process.env.TWILIO_AUTH_TOKEN; // Your Auth Token from www.twilio.com/console
var fromNumber = process.env.MY_TWILIO_NUMBER; // Your custom Twilio number
var twilio = require("twilio");
var client = new twilio(accountSid, authToken);

/* GET home page. */

router.get("/contacts", (req, res, next) => {
  if (!req.user) return res.redirect("/login"); //if not logeed in redirect to login page
  var user = req.user._id;

  Contact.find({ owner: user }, function(err, contacts) {
    // "find" the contact
    if (err) {
      return next(err);
    }
    res.render("contacts", {
      Contacts: contacts,
      user: user // need to pass the user into the contacts page
    });
  });
});

/// --- GET AND POST ROUTES FOR NEW CONTACT ---///
router.get("/contacts/new", (req, res, next) => {
  let newContactForm = true;
  res.render("editContact", {
    isNewContact: newContactForm // boolean will determine if to render the new contact or edit contact//they r on th same form
  });
});

router.post("/contacts/new", (req, res, next) => {
  if (!req.user) return res.redirect("/login");
  var contact = new Contact({
    name: req.body.name,
    phone: req.body.phone,
    owner: req.user._id
  });
  contact.save(function(err, contact) {
    //save the contact to the database
    if (err) return next(err);
    console.log(contact);
    res.redirect("/contacts");
  });
});
/// ----- END OF NEW CONTACT ROUTES ----////

// ||||||| GET AND POST ROUTES FOR EDIT ROUTES |||||| /////
router.get("/contacts/:id", (req, res, next) => {
  let newContactForm = false; ///can i declare this AGAIN
  let editID = req.params.id;
  Contact.findById(editID, (err, data) => {
    // data is the information we get back form the database
    if (err) return res.send("There was an error: ", err);
    res.render("editContact", {
      contact: data,
      isNewContact: newContactForm // boolean will determine if to render the new contact or edit contact//they r on th same form
    });
  });
});

router.post("/contacts/:id", (req, res, next) => {
  let editContact = req.params.id;
  Contact.findById(editContact, (err, contact) => {
    if (err) return res.send("There was an error on the post route", err);
    contact.name = req.body.name;
    contact.phone = req.body.phone;
    contact.save();
    res.redirect("/contacts");
  });
});
/// |||||| END OF ROUTES |||||| /////

///// ***** SETTING UP ROUTES FOR TWILIO AND SENDING MESSAGES ***** /////
router.get("/messages", (req, res) => {
  //get all messages from mongoose that belon to the user
  Message.find({ user: req.user._id })
    .populate("contact")
    .exec((err, data) => {
      //DATA IS ALL THE MESSAGES
      if (err) return res.send("There were errors getting YOUR MESSAGES:", err);
      res.render("messages", {
        Messages: data,
        allMessages: true
      });
    });
});
///figure out where to input #isFrom
router.get("/messages/:contactId", (req, res) => {
  Message.find({ user: req.user._id, contact: req.params.contactId })
    .populate("contact")
    .exec((err, messages) => {
      if (err) return res.render("THERE WAS AN ERROR GETTING MESSAGES FOR CONTACT ID:", err);
      if (!messages.toString()) return res.send("THERE ARE NO MESSAGES");
      res.render("messages", {
        //pass in data for handle bars
        Messages: messages,
        name: messages[0].contact.name,
        allMessages: false
      });
    });
});

router.get("/messages/send/:contactId", (req, res) => {
  /////////////////\\\\\\\\\\\\\\\\\\\\\\
  Contact.findById(req.params.contactId, (err, contact) => {
    res.render("newMessage", { contact: contact });
  });
});

router.post("/messages/send/:contactId", (req, res) => {
  let m = new Message({
    created: new Date(),
    content: req.body.message,
    user: req.user._id, //from
    contact: req.params.contactId, //to
    channel: "SMS",
    status: req.body.SmsStatus
  });
  m.save((err, message) => {
    if (err) return res.send("THERE WAS A PROBLEM SAVING THE MESSAGE POST ROUTE :", err);
    Contact.findById(req.params.contactId, (err, contact) => {
      // We can send a Twilio message using client.messages.create
      // We first create an object data with the key body, to, and from.
      var data = {
        body: req.body.message,
        to: "+1" + contact.phone, // a 10-digit number
        from: "+1" + req.user.phone
      };

      client.messages.create(data, function(err, msg) {
        console.log(err, msg);

        // save our Message object and redirect the user here
      });
      res.redirect("/messages");
    });
  });
});

///// ***** End of ROUTES FOR TWILIO AND SENDING MESSAGES ***** /////

// ???? set up for RECEIVE ROUTES ???? ////
router.post("/messages/receive", (req, res) => {
  Contact.findOne({ phone: req.body.From.substring(2) })
    .populate("owner")
    .exec((err, contact) => {
      var m = new Message({
        created: new Date(),
        content: req.body.Body,
        user: contact.owner._id,
        contact: contact._id,
        channel: "SMS",
        status: req.body.SmsStatus,
        from: req.body.From.substring(2)
      });

      m.save((err, message) => {
        if (err) return res.send("THERE WAS A PROBLEM SAVING THE MESSAGE USING WEBHOOKS");
      });
    });
});
/// ???? end of webHooks receive routes ??? ///
module.exports = router;
