const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// Protect route middleware
const checkAuthenticated = (req, res, next) => {
	if (req.isAuthenticated()) return next();
	res.redirect("/login");
};

// Set up multer storage config
const upload = multer({ storage: multer.memoryStorage() });

// Display upload form
router.get("/upload", checkAuthenticated, async (req, res) => {
	const folders = await prisma.folder.findMany({
		where: { userId: req.user.id }
	});
	res.render("upload", {
		user: req.user,
		userFolders: folders,
		title: "Upload File",
	});
});

// View the file details
router.get("/files/:id", checkAuthenticated, async (req, res) => {
	const file = await prisma.file.findUnique({
		where: { id: req.params.id },
		include: { folder: true },
	});

	if (!file || file.userId !== req.user.id) {
		return res.status(403).send("Unauthorized or file not found.");
	}

	res.render("file-details", {
		file,
		user: req.user,
		title: `Details for ${file.name}`,
	});
});

// Download a file
router.get("/files/:id/download", checkAuthenticated, async (req, res) => {
	const file = await prisma.file.findUnique({
		where: { id: req.params.id },
	});

	if (!file || file.userId !== req.user.id) {
		return res.status(403).send("Unauthorized or file not found.");
	}
	res.download(file.path, file.name);
});

// Handle file upload
const supabase = require("../supabaseClient");

router.post("/upload", checkAuthenticated, upload.single("file"), async (req, res) => {
	try {
		const file = req.file;
		const { folderId } = req.body;

		if (!file) return res.status(400).send("No file uploaded");

		const filePath = `${req.user.id}/${Date.now()}-${file.originalname}`;

		const { data, error } = await supabase.storage
			.from("user-uploads")
			.upload(filePath, file.buffer, {
				contentType: file.mimetype,
			});

		if (error) {
			console.error("Supabase upload error:", error);
			return res.status(500).send("Failed to upload file");
		}

		const publicURL = `${process.env.SUPABASE_URL}/storage/v1/object/public/user-uploads/${filePath}`;

		await prisma.file.create({
			data: {
				name: file.originalname,
				url: publicURL,
				size: file.size,
				uploadedAt: new Date(),
				path: filePath,
				user: { connect: { id: req.user.id } },
				...(folderId && { folder: { connect: { id: folderId } } }),
			},
		});

		req.flash("success_msg", "File uploaded successfully!");
		res.redirect("/drive");
	} catch (error) {
		console.error(error);
		res.status(500).send("Upload failed.");
	}
});

module.exports = router;
