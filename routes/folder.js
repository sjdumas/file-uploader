const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// Protect route middleware
const checkAuthenticated = (req, res, next) => {
	if (req.isAuthenticated()) return next();
	res.redirect("/login");
};

router.get("/", checkAuthenticated, async (req, res) => {
	try {
		const userId = req.user.id;
		const folders = await prisma.folder.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
		});

		const files = await prisma.file.findMany({
			where: { userId },
			orderBy: { uploadedAt: "asc" },
		});

		res.render("drive", {
			user: req.user,
			folders,
			files,
		})
	} catch (error) {
		console.error("Error loading folders:", error);
		res.status(500).send("Server Error");
	}
});

// Show/Display all folders
router.get("/drive", checkAuthenticated, async (req, res) => {
	const folders = await prisma.folder.findMany({
		where: { userId: req.user.id },
		include: { files: true },
	});

	res.render("drive", {
		folders,
		user: req.user,
		title: "My Drive",
		success_msg: req.flash("success_msg"),
	});
});

// Display new folder form
router.get("/drive/new", checkAuthenticated, (req, res) => {
	res.render("new-folder", {
		user: req.user,
		title: "Create New Folder",
	});
});

// Open/Display specific folder
router.get("/:id", async (req, res) => {
	const folderId = req.params.id;
	const userId = req.user.id;

	try {
		const folder = await prisma.folder.findUnique({
			where: { id: folderId },
			include: { files: true }, // show files in the folder
		});

		if (!folder || folder.userId !== userId) {
			return res.status(403).send("Access denied");
		}

		res.render("folder-details", {
			folder,
			files: folder.files,
			user: req.user,
		});
	} catch (error) {
		console.error("Error loading folder:", error);
		res.status(500).send("Server error");
	}
});

// Create a new folder
router.post("/drive", checkAuthenticated, async (req, res) => {
	const name = req.body.name?.trim();
	if (!name) return res.status(400).send("Folder name required");

	await prisma.folder.create({
		data: {
			name,
			user: { connect: { id: req.user.id } },
		},
	});
	
	res.redirect("/drive");
});

module.exports = router;
