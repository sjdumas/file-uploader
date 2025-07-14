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

// Display the sign up form
router.get("/signup", (req, res) => {
	res.render("signup", {
		title: "Signup",
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
router.get("/dashboard", checkAuthenticated, async (req, res) => {
	try {
		const user = req.user;

		const [userFolders, userFiles, recentFolders, recentFiles] = await Promise.all([
			prisma.folder.findMany({ where: { userId: user.id } }),
			prisma.file.findMany({ where: { userId: user.id } }),
			prisma.folder.findMany({
				where: { userId: user.id },
				orderBy: { createdAt: "desc" },
				take: 5,
			}),
			prisma.file.findMany({
				where: { userId: user.id },
				orderBy: { createdAt: "desc" },
				take: 5,
			}),
		]);

		res.render("dashboard", {
			title: "Dashboard",
			user,
			userFolders,
			userFiles,
			recentFolders,
			recentFiles,
		});
	} catch (error) {
		console.error("Dashboard error:", error);
		res.status(500).send("Error loading dashboard.");
	}
});

// Register the user
router.post("/signup", async (req, res) => {
	const { name, email, password } = req.body;
	const hashedPassword = await bcrypt.hash(password, 10);

	try {
		await prisma.user.create({
			data: {
				name,
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
router.post("/login", (req, res, next) => {
	passport.authenticate("local", async (err, user, info) => {
		if (err || !user) {
			return res.redirect("/login");
		}
		req.logIn(user, async (err) => {
			if (err) return next(err);

			await prisma.user.update({
				where: { id: user.id },
				data: { lastLogin: new Date() },
			});

			res.redirect("/dashboard");
		});
	})(req, res, next);
});

// Logout the user
router.post("/logout", (req, res, next) => {
	if (typeof req.logout === "function") {
		req.logout(err => {
			if (err) return next(err);
			res.render("logout", {
				title: "Logged Out",
				showCta: false,
				user: null
			});
		});
	} else {
		res.redirect("/login");
	}
});

module.exports = router;
