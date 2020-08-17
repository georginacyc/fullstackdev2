/*
* 'require' is similar to import used in Java and Python. It brings in the libraries required to be used
* in this JS file.
* */
const express = require('express');
const session = require('express-session');
const path = require('path');
const exphbs = require('express-handlebars');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const FlashMessenger = require('flash-messenger');
const mysql = require('mysql');
const MySQLStore = require('express-mysql-session');
const db = require('./config/db');
const monoqloDB = require('./config/DBConnection');
monoqloDB.setUpDB(false);
const passport = require('passport');
const authenticate = require('./config/passport');
authenticate.localStrategy(passport);
const User = require('./models/User');
const bcrypt = require('bcryptjs');


/*
* Loads routes file main.js in routes directory. The main.js determines which function
* will be called based on the HTTP request and URL.
*/
const mainRoute = require('./routes/main');
const formatDate = require('./helpers/hbs');
const radioCheck = require('./helpers/radioCheck');
const discontinueCheck = require('./helpers/discontinueCheck');
const receivedCheck = require('./helpers/receivedCheck')
const { allowedNodeEnvironmentFlags } = require('process');
const StaffNotifs = require('./models/StaffNotifs');

/*
* Creates an Express server - Express is a web application framework for creating web applications
* in Node JS.
*/
const app = express();

// function to constantly supply recent announcements (i.e. latest 3) to the navbar
app.use(function(req, res, next) {
	StaffNotifs.findAll({
		order: [['date', 'DESC']],
		limit: 3
	}).then((announcements) => {
		res.locals.announcements = announcements;
		next();
	}).catch(err => console.log(err))
}); 

// Handlebars Middleware
/*
* 1. Handlebars is a front-end web templating engine that helps to create dynamic web pages using variables
* from Node JS.
*
* 2. Node JS will look at Handlebars files under the views directory
*
* 3. 'defaultLayout' specifies the main.handlebars file under views/layouts as the main template
*
* */


app.engine('handlebars', exphbs({
	helpers: {
		"formatDate": formatDate,
		"radioCheck": radioCheck,
		"discontinueCheck": discontinueCheck,
		"receivedCheck": receivedCheck
	},
	defaultLayout: 'main' // Specify default template views/layout/main.handlebar 
}));
app.set('view engine', 'handlebars');



// Body parser middleware to parse HTTP body in order to read HTTP data
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());

// Creates static folder for publicly accessible HTML, CSS and Javascript files
app.use(express.static(path.join(__dirname, 'public')));

// Method override middleware to use other HTTP methods such as PUT and DELETE
app.use(methodOverride('_method'));

// Enables session to be stored using browser's Cookie ID
app.use(cookieParser());
app.use(session({
	key: 'monoqlo_session',
	secret: 'onom',
	store: new MySQLStore({
		host: db.host,
		port: 3306,
		user: db.username,
		password: db.password,
		database: db.database,
		clearExpired: true,
		checkExpirationInterval: 900000,
		expiration: 900000,
	}),
	resave: false,
	saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// to constantly pass in variables, if available, for the navbars
app.use(function(req, res, next) {
	try {
		// checks if the logged in user is a customer
		if (req.user.type == "User") {
			res.locals.custName = req.user.fname;
			res.locals.customer = "customer";
			
		} else {
			// setting the global variables
			res.locals.staffAdmin = null; // null first so that it does not pass the if condition in the staff navbar by default
			res.locals.staffName = req.user.fname; // retreiving the name to pass into staff navbar
			if (req.user.type == "Admin") {
				res.locals.staffAdmin = "Admin"; // when staffAdmin is passed in, the if condition will be passed
			}
		}
		
	}
	catch (err) {
		
	}
	finally {
		next(); // regardless of the above try/catch, the program continues on
	}
})

app.use(function(req, res, next) {
	User.max('staffId')
	.then(c => {
		if (c == 0) { // if select max(staffId) returns NaN | i.e. if there are no records of staff/admin
			let password = bcrypt.hashSync("12345678", 10);

			// create an admin account with default details
			User.create({'type': "Admin", 'staffId': '000001', 'email': "000001@monoqlo.com", 'fname': "Admin", 'lname': "Account", 'gender': "Male", 'dob': "1991-03-02", 'hp': '65500999', 'address':"31 Charlton Road", 'postalcode': '569830', 'password': password})
			.then(() => {
				console.log("Staple Admin account created! Email: 000001@monoqlo.com Password: 12345678")
			})
			.catch(err => console.log(err))
		}
	})
	.then(next())
	.catch(err => console.log(err))
})

app.use(flash());
app.use(FlashMessenger.middleware);
app.use(function(req, res, next){
	res.locals.success_msg = req.flash('success_msg');
	res.locals.error_msg = req.flash('error_msg');
	res.locals.error = req.flash('error');
	res.locals.user = req.user || null;
	next();
});

// Place to define global variables - not used in practical 1
app.use(function (req, res, next) {
	next();
});


// Use Routes
/*
* Defines that any root URL with '/' that Node JS receives request from, for eg. http://localhost:5000/, will be handled by
* mainRoute which was defined earlier to point to routes/main.js
* */
app.use('/', mainRoute); // mainRoute is declared to point to routes/main.js

// This route maps the root URL to any path defined in main.js

/*
* Creates a unknown port 5000 for express server since we don't want our app to clash with well known
* ports such as 80 or 8080.
* */
const port = 5000;

// Starts the server and listen to port 5000
app.listen(port, () => {
	console.log(`Server started on port ${port}`);
});
