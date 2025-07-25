// Protect route middleware
const checkAuthenticated = (req, res, next) => {
	if (req.isAuthenticated()) return next();
	res.redirect("/login");
}

module.exports = { checkAuthenticated };
