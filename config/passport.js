const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const initialize = (passport) => {
	passport.use(
		new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
			try {
				const user = await prisma.user.findUnique({ where: { email } });

				if (!user) {
					return done(null, false, { message: "No user with that email." });
				}

				const match = await bcrypt.compare(password, user.password);

				if (match) {
					return done(null, user);
				} else {
					return done(null, false, { message: "Incorrect password." });
				}
			} catch (error) {
				return done(error);
			}
		})
	);
	
	passport.serializeUser((user, done) => done(null, user.id));
	
	passport.deserializeUser(async (id, done) => {
		try {
			const user = await prisma.user.findUnique({ where: { id } });
			done(null, user);
		} catch (error) {
			done(error);
		}
	});
};

module.exports = initialize;
