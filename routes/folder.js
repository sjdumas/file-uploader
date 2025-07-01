const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// Protect route middleware
const checkAuthenticated = (req, res, next) => {
	if (req.isAuthenticated()) return next();
	res.redirect("/login");
};

// Show/Display all folders
router.get("/folders", checkAuthenticated, async (req, res) => {
	const folders = await prisma.folder.findMany({
		where: { userId: req.user.id },
		include: { files: true },
	});

	res.render("folders", {
		folders,
		user: req.user,
		title: "My Folders",
		success_msg: req.flash("success_msg"),
	});
});

// Display new folder form
router.get("/folders/new", checkAuthenticated, (req, res) => {
	res.render("new-folder", {
		user: req.user,
		title: "Create New Folder",
	});
});

// Create a new folder
router.post("/folders", checkAuthenticated, async (req, res) => {
	const name = req.body.name?.trim();
	if (!name) return res.status(400).send("Folder name required");

	await prisma.folder.create({
		data: {
			name,
			user: { connect: { id: req.user.id } },
		},
	});
	
	res.redirect("/folders");
});

module.exports = router;
