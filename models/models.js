var mongoose = require("mongoose");
var connect = process.env.MONGODB_URI;
var Schema = mongoose.Schema;

// If you're getting an error here, it's probably because
// your connect string is not defined or incorrect.
mongoose.connect(connect);

// Step 1: Write your schemas here!
// Remember: schemas are like your blueprint, and models
// are like your building!

var User = new Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    min: 10,
    max: 10
  }
});

// Step 2: Create all of your models here, as properties.

// THIS IS THE SCHEMA MODEL FOR A NEW CONTACT
var newContact = new Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: "User"
  }
});
// THIS IS THE SCHEMA MODEL FOR A NEW MESSAGE

var Message = new Schema(
  {
    created: {
      type: Date,
      required: true
    },
    content: {
      type: String
    },
    user: {
      // ref to the user that this message belongs to
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true
    },
    contact: {
      // Reference to the Contact that this message was sent to
      type: mongoose.Schema.ObjectId,
      ref: "Contact",
      required: true
    },
    channel: {
      // the channel used to send the message
      type: String,
      required: true
    },
    status: {
      type: String
    },
    from: {
      type: String,
      min: 10,
      max: 10
    }
  },
  {
    toJSON: {
      virtuals: true
    }
  }
);

Message.virtual("isSent").get(function() {
  return this.status !== "received";
});

// Step 3: Export your models object
module.exports = {
  User: mongoose.model("User", User),
  Contact: mongoose.model("Contact", newContact),
  Message: mongoose.model("Message", Message)
};
