const fail = (res, message, status = 400) => res.status(status).json({ message });
exports.requireAdmin = (req, res, next) => (req.session?.admin ? next() : fail(res, 'Administrator login required.', 401));
exports.requireCustomer = (req, res, next) => (req.session?.customer ? next() : fail(res, 'Please sign in.', 401));
exports.ok = (res, data, status = 200) => res.status(status).json({ data });
exports.fail = fail;
