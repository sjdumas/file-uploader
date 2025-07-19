const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { checkAuthenticated } = require("../middleware");
const router = express.Router();
const prisma = new PrismaClient();

// GET /drive - Show user's folders and files (not inside folders)
router.get("/", checkAuthenticated, async (req, res) => {
	try {
		const folders = await prisma.folder.findMany({
			where: { userId: req.user.id },
			include: { files: true },
			orderBy: { createdAt: "desc" },
		});

		const files = await prisma.file.findMany({
			where: {
				userId: req.user.id,
				folderId: null,
			},
			orderBy: { uploadedAt: "desc" },
		});

		res.render("drive", {
			title: "My Drive",
			user: req.user,
			folders,
			files,
			success_msg: req.flash("success_msg"),
			error_msg: req.flash("error_msg"),
		});
	} catch (error) {
		console.error("Error loading drive:", error);
		res.status(500).send("Server error");
	}
});

// GET /drive/new-folder - Show create form
router.get("/new-folder", checkAuthenticated, (req, res) => {
	res.render("new-folder", {
		title: "Create Folder",
		user: req.user,
	});
});

// POST /drive - Create a new folder
router.post("/", checkAuthenticated, async (req, res) => {
	const { name } = req.body;

	if (!name || name.trim() === "") {
		req.flash("error_msg", "Folder name is required.");
		return res.redirect("/drive");
	}

	try {
		await prisma.folder.create({
			data: {
				name: name.trim(),
				user: { connect: { id: req.user.id } },
			},
		});
		req.flash("success_msg", "Folder created.");
		res.redirect("/drive");
	} catch (error) {
		console.error("Error creating folder:", error);
		req.flash("error_msg", "Could not create folder.");
		res.redirect("/drive");
	}
});

// GET /drive/:id - View a specific folder and its files
router.get("/:id", checkAuthenticated, async (req, res) => {
	try {
		const folder = await prisma.folder.findUnique({
			where: { id: req.params.id },
			include: { files: true },
		});

		if (!folder || folder.userId !== req.user.id) {
			return res.status(403).send("Access denied.");
		}

		res.render("folder-details", {
			title: folder.name,
			user: req.user,
			folder,
			files: folder.files,
			success_msg: req.flash("success_msg"),
			error_msg: req.flash("error_msg"),
		});
	} catch (error) {
		console.error("Error loading folder:", error);
		res.status(500).send("Server error");
	}
});

// GET /drive/:id/edit - Show edit form
router.get("/:id/edit", checkAuthenticated, async (req, res) => {
	try {
		const folder = await prisma.folder.findUnique({ 
			where: { id: req.params.id } 
		});

		if (!folder || folder.userId !== req.user.id) {
			return res.status(403).send("Access denied.");
		}

		res.render("edit-folder", {
			title: "Edit Folder",
			user: req.user,
			folder,
		});
	} catch (error) {
		console.error("Error loading edit form:", error);
		res.status(500).send("Server error");
	}
});

// POST /drive/:id/edit - Update folder
router.post("/:id/edit", checkAuthenticated, async (req, res) => {
	const { name } = req.body;

	if (!name || name.trim() === "") {
		req.flash("error_msg", "Folder name is required.");
		return res.redirect(`/drive/${req.params.id}/edit`);
	}

	try {
		const folder = await prisma.folder.findUnique({ 
			where: { id: req.params.id } 
		});

		if (!folder || folder.userId !== req.user.id) {
			return res.status(403).send("Access denied.");
		}

		await prisma.folder.update({
			where: { id: req.params.id },
			data: { name: name.trim() },
		});

		req.flash("success_msg", "Folder updated.");
		res.redirect("/drive");
	} catch (error) {
		console.error("Error updating folder:", error);
		req.flash("error_msg", "Could not update folder.");
		res.redirect(`/drive/${req.params.id}/edit`);
	}
});

// POST /drive/:id/delete - Delete folder
router.post("/:id/delete", checkAuthenticated, async (req, res) => {
	try {
		const folder = await prisma.folder.findUnique({
			where: { id: req.params.id },
			include: { files: true },
		});

		if (!folder || folder.userId !== req.user.id) {
			return res.status(403).send("Access denied.");
		}

		// Optional: Delete all files in the folder before deleting the folder
		await prisma.file.deleteMany({ 
			where: { folderId: req.params.id } 
		});

		await prisma.folder.delete({ 
			where: { id: req.params.id } 
		});

		req.flash("success_msg", "Folder deleted.");
		res.redirect("/drive");
	} catch (error) {
		console.error("Error deleting folder:", error);
		req.flash("error_msg", "Could not delete folder.");
		res.redirect("/drive");
	}
});

module.exports = router;
