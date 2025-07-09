require("dotenv").config();
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const initializePassport = require("./config/passport");
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const { PrismaClient } = require("@prisma/client");
const authRoutes = require("./routes/auth");
const fileRoutes = require("./routes/file");
const folderRoutes = require("./routes/folder");

const app = express();
const prisma = new PrismaClient();

app.set("view engine", "ejs");
app.set("layout", "layout");
app.use(express.static("public"));
app.use(expressLayouts);
app.use(express.urlencoded({ extended: false }));

// Session config
app.use(session({
	secret: process.env.SESSION_SECRET || "super-secret",
	resave: false,
	saveUninitialized: false,
	store: new PrismaSessionStore(
		prisma,
		{
			checkPeriod: 2 * 60 * 1000, // optional
			dbRecordIdIsSessionId: true,
			dbRecordIdFunction: undefined,
		}
	),
	cookie: {
		maxAge: 1000 * 60 * 60 * 24, // 1 day
	},
}));

// Add flash messages
app.use(flash());

app.use((req, res, next) => {
	res.locals.success_msg = req.flash("success_msg");
	res.locals.error_msg = req.flash("error_msg");
	next();
});

// Passport setup
initializePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/", authRoutes);
app.use("/", fileRoutes);
app.use("/", folderRoutes);

// Homepage route
app.get("/", (req, res) => {
	if (req.isAuthenticated()) {
		return res.redirect("/dashboard");
	}
	res.render("index", {
		title: "MyDrive",
		user: null,
		showCta: true
	});
});

// About page route
app.get("/about", (req, res) => {
	res.render("about", { 
		title: "About",
		user: req.user || null,
	});
});

// Pricing page route
app.get("/pricing", (req, res) => {
	res.render("pricing", {
		title: "Pricing",
		user: req.user || null,
	});
});

// Privacy page route
app.get("/privacy", (req, res) => {
	res.render("privacy", {
		title: "Privacy",
		user: req.user || null,
	});
});

// Terms page route
app.get("/terms", (req, res) => {
	res.render("terms", {
		title: "Terms",
		user: req.user || null,
	});
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
