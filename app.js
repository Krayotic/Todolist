
const express = require("express");
const mongoose = require('mongoose');
const app = express();
const _ = require("lodash");

//tells our app to use ejs as our view engine
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

////
main().catch(err => console.log(err));

//local Mongod server:
// async function main() {
//   await mongoose.connect('mongodb://127.0.0.1:27017/todolistDB', {useNewUrlParser:true});
// }

//MongoDB Atlas free server:
async function main() {
  await mongoose.connect('mongodb+srv://admin:abc-123@cluster0.2riwpgg.mongodb.net/todolistDB', {useNewUrlParser:true});
}

//here we create new blueprint of our database(Schema)
const itemsSchema = new mongoose.Schema ({
  name: String
});

//create a MODEL
const Item = mongoose.model('Item', itemsSchema);

//create a DOCUMENT
const item1 = new Item ({
  name: "Welcome to your todolist!"
});

const item2 = new Item ({
  name: "Hit the + button to add a new item."
});

const item3 = new Item ({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3]


//here we create new blueprint of our database(Schema)
const listSchema = new mongoose.Schema ({
  name: String,
  items: [itemsSchema]    //so this automatically links to the names I guess..
});

//create a MODEL
const List = mongoose.model('List', listSchema);

////

app.get("/", function(req, res){

  Item.find({}).then(function(foundItems){

    if (foundItems.length === 0) {
      //create a DOCUMENT
      Item.insertMany(defaultItems) 
      .then(function(){
        console.log("Successfully saved all the itmes to DB.");
      })
      .catch(function(err){
        console.log(err);
      });
      res.redirect("/");  //this will take us to the else statement
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
  })
  .catch(function(err){
    console.log(err);
  });

});

app.post("/", function(req, res){  //adding a new note
  
  const itemName = req.body.newItem;
  const listName = req.body.list;  //list corresponds to the name in the HTML and the value of it corresponds to the value tag

  //create a DOCUMENT
  const newItem = new Item ({
    name: itemName
  });

  if (listName === "Today"){    //today is the default("/") list/page
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName})
    .then(function(foundList){
      foundList.items.push(newItem);       //name(foundList) in listSchema is basically the id of each object in lists DB
      foundList.save();
      res.redirect("/" + listName);
    })
    .catch(function(err){
      console.log(err);
    });
    };

});

app.post("/delete", function(req, res){
  const checkItemId = req.body.deleteItem;
  const listName = req.body.listName;

  if (listName === "Today"){    //today is the default("/") list/page
    Item.findByIdAndRemove({_id: checkItemId})
    .then(function(){
      console.log("Successfully deleted " + checkItemId);
    })
    .catch(function(err){
      console.log(err);
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkItemId}}})
    .then(function(foundList){
      console.log("Successfully deleted " + foundList.name);
      res.redirect("/" + listName)
    })
    .catch(function(err){
      console.log(err);
    });
  };

});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName})
  .then(function(result){
    if (!result){
      console.log("Doesn't exist")

      //Creat a new list
      const list = new List ({
        name: customListName,
        items: defaultItems
      });
    
      list.save(); 
      res.redirect("/" + customListName) 
      } else {
        //Show an existing list
        res.render("list", {listTitle: result.name, newListItems: result.items })
      }
  })
  .catch(function(err){
    console.log(err);
  });

});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function(){
  console.log("Server started on port 3000.");
});


