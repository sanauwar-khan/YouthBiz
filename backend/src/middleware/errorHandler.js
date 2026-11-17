export function errorHandler(error, _request, response, _next) {
  if (error?.code === "TRANSACTIONS_UNSUPPORTED") {
    return response.status(503).json({ error: "Inventory updates require a MongoDB replica set or sharded deployment." });
  }

  if (error?.code === 11000) {
    return response.status(409).json({
      error: "An account with this email already exists.",
      fieldErrors: { email: "An account with this email already exists." },
    });
  }

  if (error?.name === "ZodError") {
    const fieldErrors = {};
    const allowedFields = new Set(["firstName", "lastName", "email", "ageGroup", "password", "confirmPassword", "title", "description", "name", "category", "materials", "unitCost", "sellingPrice", "initialProductionQuantity", "quantity", "notes", "businessName", "products", "productId", "proposedPrice", "expectedQuantity", "targetCustomers", "uniqueValue", "eventDate", "eventLocation"]);
    for (const issue of error.issues) {
      const field = issue.path[0];
      if (allowedFields.has(field) && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return response.status(400).json({ error: "Please check the submitted fields.", fieldErrors });
  }

  if (error?.name === "ValidationError") {
    return response.status(400).json({ error: "Please check the submitted fields." });
  }

  const status = Number.isInteger(error?.status) && error.status >= 400 && error.status < 500
    ? error.status
    : 500;
  if (status === 500) {
    console.error("API request failed:", error?.name || "Error");
  }
  return response.status(status).json({
    error: status === 500 ? "Internal server error." : error.message,
  });
}