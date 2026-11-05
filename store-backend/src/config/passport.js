import passport from "passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { User } from "../models/index.js";

export const COOKIES = { admin: "admin_token", customer: "shop_token" };
const fromCookie = (name) => (req) => req?.cookies?.[name] || null;

// Two strategies, two cookies: an admin session can never act as a shop customer or vice-versa.
for (const role of ["admin", "customer"]) {
  passport.use(`jwt-${role}`, new Strategy(
    { jwtFromRequest: fromCookie(COOKIES[role]), secretOrKey: process.env.JWT_SECRET },
    async (payload, done) => {
      try {
        const user = await User.findById(payload.id);
        done(null, user && user.role === role ? user : false);
      } catch (e) { done(e); }
    }
  ));
}
export default passport;
