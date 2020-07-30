//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname + "/date.js");
const mongoose= require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-lucas:test123@cluster0.wkj0u.mongodb.net/todolistDB",{useNewUrlParser: true, useUnifiedTopology: true});

const itemSchema = new mongoose.Schema({
  name: String
});

const Item = new mongoose.model("Item", itemSchema);

// database items
const listItem1 = new Item({
  name: "Welcome to your todolist!"
});
const listItem2 = new Item({
  name: "Hit the + button to add a new item."
});
const listItem3 = new Item({
  name: "<-- Hit this to delete an item."
});

let defaultItems = [listItem1, listItem2, listItem3];

// custom list
const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);





// home page list
app.get("/", function(req, res) {

Item.find({},function(err,items){
  if(err){
    console.log(err);
  } else {
    if(items.length === 0){
      // empty database so insert default items
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Successfully inserted todolist items into DB");
        }
      });
      res.redirect("/");
    }else{
      res.render("list", {listTitle: /*day*/"Today", newListItems: items});
    }
  }
});


// custom lists
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName},function(err,list){
    if(err){
      console.log(err);
    } else {
      if(!list){
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListName);
      }else {
        res.render("list", {listTitle: customListName, newListItems: list.items});
      }
    }
  });




});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if(listName === "Today"){
    newItem.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err, list){
      list.items.push(newItem);
      list.save();
    });
    res.redirect("/"+listName);
  }

});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(err){
        console.log(err);
      }else{
        console.log("Successfully deleted selected item.");
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: checkedItemId}}},
      function(err, result){
        if(!err){
          //success
          res.redirect("/"+listName);
        }
      }
    );
  }


});





});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
