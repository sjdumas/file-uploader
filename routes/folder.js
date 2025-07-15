const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const prisma = new PrismaClient();
const { checkAuthenticated } = require("../middleware");

// GET /drive – Show all folders and files
router.get("/", checkAuthenticated, async (req, res) => {
	try {
		const folders = await prisma.folder.findMany({
			where: { userId: req.user.id },
			include: { files: true },
			orderBy: { createdAt: "desc" },
		});

		const files = await prisma.file.findMany({
			where: { userId: req.user.id, folderId: null },
			orderBy: { uploadedAt: "desc" },
		});

		res.render("drive", {
			user: req.user,
			title: "My Drive",
			folders,
			files,
			success_msg: req.flash("success_msg"),
			error_msg: req.flash("error_msg"),
		});
	} catch (error) {
		console.error("Error loading drive:", error);
		res.status(500).send("Server Error");
	}
});

// GET /drive/new-folder – Display create folder form
router.get("/new-folder", checkAuthenticated, (req, res) => {
	res.render("new-folder", {
		user: req.user,
		title: "Create New Folder",
	});
});

// POST /drive – Create new folder
router.post("/", checkAuthenticated, async (req, res) => {
	try {
		const { name } = req.body;

		if (!name) {
			req.flash("error_msg", "Folder name is required.");
			return res.redirect("/drive");
		}

		await prisma.folder.create({
			data: {
				name,
				user: {
					connect: { id: req.user.id },
				},
			},
		});

		req.flash("success_msg", "Folder created successfully.");
		res.redirect("/drive");
	} catch (error) {
		console.error("Error creating folder:", error);
		req.flash("error_msg", "Something went wrong.");
		res.redirect("/drive");
	}
});

// GET /drive/:id – Display specific folder and its files
router.get("/:id", checkAuthenticated, async (req, res) => {
	const folderId = req.params.id;
	const userId = req.user.id;

	try {
		const folder = await prisma.folder.findUnique({
			where: { id: folderId },
			include: { files: true },
		});

		if (!folder || folder.userId !== userId) {
			return res.status(403).send("Access denied");
		}

		res.render("folder-details", {
			folder,
			files: folder.files,
			user: req.user,
			title: folder.name,
		});
	} catch (error) {
		console.error("Error loading folder:", error);
		res.status(500).send("Server error");
	}
});

module.exports = router;
