/**
 * Restricts a route to one or more roles.
 * Must be used AFTER the protect middleware (needs req.user).
 *
 * Usage: router.post("/", protect, authorize("local", "admin"), handler)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error("Not authorized");
    }
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        `Role '${req.user.role}' is not allowed to access this resource`
      );
    }
    next();
  };
};

module.exports = { authorize };
