/**
 * Zod validation middleware factory for body, query, and params
 */
export const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    const formattedErrors = error.errors
      ? error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message
        }))
      : [{ message: error.message }];

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
};

export const validateQuery = (schema) => (req, res, next) => {
  try {
    req.query = schema.parse(req.query);
    next();
  } catch (error) {
    const formattedErrors = error.errors
      ? error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message
        }))
      : [{ message: error.message }];

    return res.status(400).json({
      success: false,
      message: 'Query parameter validation failed',
      errors: formattedErrors
    });
  }
};

export const validateParams = (schema) => (req, res, next) => {
  try {
    req.params = schema.parse(req.params);
    next();
  } catch (error) {
    const formattedErrors = error.errors
      ? error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message
        }))
      : [{ message: error.message }];

    return res.status(400).json({
      success: false,
      message: 'URL parameter validation failed',
      errors: formattedErrors
    });
  }
};
