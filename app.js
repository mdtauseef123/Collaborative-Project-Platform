const express = require("express");
const bodyParser = require("body-parser");
const lodash = require("lodash");

//Setting up the server and ejs
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


//Setting up the cookies and session
const session=require("express-session");
const passport = require("passport");
const passportLocalMongoose=require("passport-local-mongoose");


//Setting up the Sessions from the express-session package
app.use(session({
    secret: "secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {}
}));

//Initializing the passport
app.use(passport.initialize());
app.use(passport.session());


//Setting up the Project DB
const mongoose = require("mongoose");
let db = "";
async function main(){
    try{
        db = mongoose.connect("mongodb://127.0.0.1:27017/projectDB", {useNewUrlParser: true});
        console.log("successfully connected to the database");
    } catch(err) {
        console.log(err);
    }
}
main();
const project_schema = new mongoose.Schema({
    project_author: String,
    project_domain: String,
    project_title: String,
    project_content: String,
    project_number: String,
    project_visibility: String
});
const Project = mongoose.model("projects",project_schema);


//Getting the landing page
app.get("/", function(req, res){
    res.render("starters");
});

app.get("/starters", function(req, res){
    res.render("starters");
});


//Rendering the register page
app.get("/register", function(req, res){
    res.render("register");
});


//Rendering the login page
app.get("/login", function(req, res){
    res.render("login");
});


//Setting up the User DB and passport js
const user_schema = new mongoose.Schema({
    email: String,
    password: String
});
user_schema.plugin(passportLocalMongoose);
const User = mongoose.model("users",user_schema);
passport.use(User.createStrategy()); 
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//Setting up the User-Details collections
const user_details_schema = new mongoose.Schema({
    user_full_name: String,
    user_email: String
});
const UserDetails = mongoose.model("usersdetails", user_details_schema);

//Rendering the home screen
var user_full_starter_name = "null";
app.get("/home", function(req, res) {
    res.set('Cache-Control','no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0');
      if (req.isAuthenticated()) {
        Project.find({project_visibility: "public"}).then(function(project_list){
            res.render("home",{
              user_full_name: user_full_starter_name,
              projects: project_list
            });
        });
      } else {
        res.redirect("/login");
      }
});


//Rendering the "My-Project" Screen
app.get("/myprojects", function(req, res){
    res.set('Cache-Control','no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0');
      if (req.isAuthenticated()) {
        Project.find({project_author: user_full_starter_name}).then(function(project_list){
            res.render("myproject",{
              user_full_name: user_full_starter_name,
              projects: project_list
            });
        });
      } else {
        res.redirect("/login");
      }
})


//De-Authenticating the user.
app.get("/logout", function(req, res){
    //logout() comes from passport
    req.logout(function(err) {
      if(err){
        console.log(err);
      }
    });
    res.redirect("/");
});


//Rendering the post screen
app.get("/post", function(req, res){
    res.set('Cache-Control','no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0');
    if (req.isAuthenticated()) {
        res.render("post");
    }
    else{
        res.render("login");
    }
});


//Running python script from js
function pialgirism(){
    let pyshell = new PythonShell('main.py');
    pyshell.on('message', function (message) {
        // received a message sent from the Python script (a simple "print" statement)
        console.log(message);
    });

    // end the input stream and allow the process to exit
    pyshell.end(function (err,code,signal) {
        if (err) throw err;
        console.log('The exit code was: ' + code);
        console.log('The exit signal was: ' + signal);
        console.log('finished');
    });
}

//This module checks for uniqueness of the project
function check_unique(new_project){
    return true;
}


//Listening to About Us Page
app.get("/about", function(req, res){
    res.render("about");
});

//Listening to the post request for the user
app.post("/post", function(req, res){
    var project_name = req.body.post_title;
    var project_description = req.body.post_content;
    var project_number = "PR"+String(Math.floor(Math.random() * (99999 - 11111 + 1)) + 11111);
    const new_project=new Project({
        project_domain: req.body.post_domain,
        project_author: user_full_starter_name,
        project_title: project_name,
        project_content: project_description,
        project_number: project_number,
        project_visibility: req.body.visibility
    });
    var result = check_unique(new_project);
    if(result){
        new_project.save();
        res.redirect("/home");
    }
    else{
        res.send("Similar project already exits");
    }
});


//Routing each and every project with project-title
var flag = 0;
app.get("/projects/:project_name", function(req,res){
    res.set('Cache-Control','no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0');
    if (req.isAuthenticated()) {
        var val = req.params.project_name;
        Project.find().then(function(project_list){
            project_list.forEach(function(each_project){
            if(lodash.lowerCase(each_project.project_title) === lodash.lowerCase(val)){
                flag=1;
                res.render("project",{
                    project_title: each_project.project_title,
                    project_number: each_project.project_number,
                    project_content: each_project.project_content
                });
            }
        });
        if(flag === 0){
            res.render("error");
        }
        if(flag === 1){
            flag = 0;
        }
        });
    }
    else{
        res.redirect("/login");
    }
});


//Handling POST request from login page
app.post("/login",passport.authenticate("local", {failureRedirect: "/"}), function(req,res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function(err){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            console.log("Succesfully login");
            UserDetails.findOne({user_email: req.body.username}).then((doc) => {
                user_full_starter_name = doc.user_full_name;
            });
            res.redirect("/home");
        }
    });
});


//Handling POST request from register page
app.post("/register", function(req, res){
    const username = req.body.user_full_name;
    const useremail = req.body.username;
    User.register({username: req.body.username}, req.body.password, function(err, user) {
      if(err){
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function() {
            const new_user = new UserDetails({
                user_full_name: username,
                user_email: useremail
            });
            new_user.save();
            user_full_starter_name = username;
            console.log("Data Saved Succesfully");
            res.redirect("/home");
        });
      }
    });  
});


//Handling GET request for colaborate
app.get("/colaborate", function(req, res){
    Project.find({project_visibility: "public"}).then(function(project_list){
        res.render("colaborate",{
          projects: project_list
        });
    });
});


//Setting up the collaborate collections
const collaborate_details_schema = new mongoose.Schema({
    original_author: String,
    collaboarated_user: String,
    project_title: String,
    addon_content: String
});
const CollaborateUser = mongoose.model("collaborateusers", collaborate_details_schema);


/*Project.findOne({project_title: project_name}).then((doc) => {
    var original_author = doc.original_author;
    UserDetails.findOne({user_full_name: original_author}).then((res) => {
        User.findOne({})
    });
});*/
//Handling POST request for colaborate
app.post("/colaborate", function(req, res){
    var project_name = req.body.project_title;
    var project_content = req.body.project_content;
    res.render("sentnotify",{
        project_title: project_name,
        project_content: project_content
    });
});

//Handling POST request for sent
app.post("/sentnotify", function(req, res){
    Project.findOne({project_title: req.body.project_title}).then((doc) => {
        var original_author = doc.project_author;
        console.log(req.body.project_title);
        const new_request = new CollaborateUser({
            original_author: original_author,
            collaboarated_user: user_full_starter_name,
            project_title: req.body.project_title,
            addon_content: req.body.addon_content
        });
        new_request.save();
        res.render("sent");
    });
});


//Setting up the message collections
const message_schema = new mongoose.Schema({
    sender: String,
    message: String
});
const Message = mongoose.model("messages", message_schema);

//Getting the POST request for the accept request
app.post("/accept", function(req, res){
    //windows.alert("Your response has been sent successfully");
    const receiver = req.body.original_author;
    const sender = req.body.collaboarated_user;
    const project_title = req.body.project_title;
    const message = receiver + " has accepted your proposal for Project: "+project_title;
    const addon = req.body.addon_content;
    const new_message = new Message({
        sender: sender,
        message: message
    });
    Project.findOne({project_title: project_title}).then(async (doc) => {
        var old_content = doc.project_content;
        old_content += "Project Contribution by " + sender;
        old_content += addon;
        const filter = { project_title: project_title };
        const update = { project_content: old_content };
        await Project.updateOne(filter, update);
        Project.find().then(function(project_list){
            res.render("home",{
                projects: project_list
            });
        });
    });
    new_message.save();
    res.redirect("/home");
});


app.post("/reject", function(req, res){
    const receiver = req.body.original_author;
    const sender = req.body.collaboarated_user;
    const project_title = req.body.project_title;
    const message = receiver + " has rejected your proposal for Project: "+project_title;
    const new_message = new Message({
        sender: sender,
        message: message
    });
    console.log(message);
    new_message.save();
    res.redirect("/notifications");
});


//Getting request from messages section
app.get("/messages", function(req, res){
    Message.find({sender : user_full_starter_name}).then(function(message_list){
        res.render("confirm_message",{
          projects: message_list
        });
    });
});

//Handling GET request for the notifications
app.get("/notifications", function(req,res){
    CollaborateUser.find({original_author : user_full_starter_name}).then(function(collaborate_list){
        res.render("notification",{
          projects: collaborate_list
        });
    });
})


//Handling GET request from the edit
app.get("/edit", function(req, res){
    //res.render("edit");
    Project.find({project_author : user_full_starter_name}).then(function(project_list){
        res.render("edit",{
          projects: project_list
        });
    });
});


//Handling POST request from the edit
app.post("/edit", function(req, res){
    var project_name = req.body.project_title;
    var project_content = req.body.project_content;
    console.log(project_content);
    res.render("update",{
        project_title: project_name,
        project_number: req.body.project_number,
        project_content: project_content
    });
});


//Handling POST request for update
app.post("/update", async function(req, res){
    const filter = { project_title: req.body.project_title };
    const update = { project_content: req.body.project_content };
    await Project.updateOne(filter, update);
    Project.find({project_author : user_full_starter_name}).then(function(project_list){
        res.render("home",{
            user_full_name : user_full_starter_name,
          projects: project_list
        });
    });
});

//Listening to the port 3000
app.listen(3000, function(){
    console.log("Server started on port 3000");
});
