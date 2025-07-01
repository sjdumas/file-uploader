const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();

const prisma = new PrismaClient();

// Middleware to protect routes
const checkAuthenticated = (req, res, next) => {
	if (req.isAuthenticated()) return next();
	res.redirect("/login");
};

// Display the register form
router.get("/register", (req, res) => {
	res.render("register", {
		title: "Register",
		user: req.user,
	});
});

// Display the login form
router.get("/login", (req, res) => {
	res.render("login", {
		title: "Login",
		user: req.user,
	});
});

// Dashboard (protected route)
router.get("/dashboard", checkAuthenticated, (req, res) => {
	res.send(`Welcome, ${req.user.email}!`);
});

// Register the user
router.post("/register", async (req, res) => {
	const { email, password } = req.body;
	const hashedPassword = await bcrypt.hash(password, 10);

	try {
		await prisma.user.create({
			data: {
				email,
				password: hashedPassword,
			},
		});

		res.redirect("/login");
	} catch (error) {
		console.error(error);
		res.send("Error creating user.");
	}
});

// Login the user
router.post("/login",
	passport.authenticate("local", {
		successRedirect: "/dashboard",
		failureRedirect: "/login",
	})
);

// Logout the user
router.post("/logout", (req, res, next) => {
	if (typeof req.logout === "function") {
		req.logout(err => {
			if (err) return next(err);
			res.redirect("/login");
		});
	} else {
		res.redirect("/login");
	}
});

module.exports = router;
