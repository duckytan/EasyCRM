const { registerCustomerRoutes } = require('./customers');
const { registerVisitRoutes } = require('./visits');
const { registerProductRoutes } = require('./products');
const { registerDashboardRoutes } = require('./dashboard');
const { registerMaintenanceRoutes } = require('./maintenance');
const { registerCustomerCategoryRoutes } = require('./customerCategories');
const { registerCustomerIntentionRoutes } = require('./customerIntentions');
const { registerAuthRoutes } = require('./auth');
const { registerRegionRoutes } = require('./regions');
const { registerBudgetRangeRoutes } = require('./budgetRanges');
const { registerContactRoutes } = require('./contacts');
const { registerUserSettingsRoutes } = require('./userSettings');
const { registerVisitMethodRoutes } = require('./visitMethods');
const { registerPresetProductRoutes } = require('./presetProducts');
const { registerVisitTypeRoutes } = require('./visitTypes');
const { registerNavigationModeRoutes } = require('./navigationModes');
const { registerReminderCycleRoutes } = require('./reminderCycles');

function registerAllRoutes(app, db) {
  registerCustomerRoutes(app, db);
  registerVisitRoutes(app, db);
  registerProductRoutes(app, db);
  registerDashboardRoutes(app, db);
  registerMaintenanceRoutes(app, db);
  registerCustomerCategoryRoutes(app, db);
  registerCustomerIntentionRoutes(app, db);
  registerAuthRoutes(app, db);
  registerRegionRoutes(app, db);
  registerBudgetRangeRoutes(app, db);
  registerContactRoutes(app, db);
  registerUserSettingsRoutes(app, db);
  registerVisitMethodRoutes(app, db);
  registerPresetProductRoutes(app, db);
  registerVisitTypeRoutes(app, db);
  registerNavigationModeRoutes(app, db);
  registerReminderCycleRoutes(app, db);
}

module.exports = {
  registerAllRoutes,
};
