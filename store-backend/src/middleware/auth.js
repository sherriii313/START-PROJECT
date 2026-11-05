import passport from "../config/passport.js";

// Protected-route middleware: returns JSON 401 instead of Passport's plain text.
export const guard = (role) => (req, res, next) =>
  passport.authenticate(`jwt-${role}`, { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: "Please sign in to continue" });
    req.user = user;
    next();
  })(req, res, next);
