const { CustomerController } = require('../controllers/customerController');
const { asyncHandler } = require('../middlewares/errorHandler');
const { validate, CommonSchemas } = require('../middlewares/validator');

function registerCustomerRoutesV2(app, db) {
  const controller = new CustomerController();

  // GET /api/v2/customers - 获取所有客户
  app.get(
    '/api/v2/customers',
    asyncHandler(async (req, res) => {
      await controller.getAllCustomers(req, res);
    }),
  );

  // GET /api/v2/customers/:id - 获取单个客户
  app.get(
    '/api/v2/customers/:id',
    asyncHandler(async (req, res) => {
      await controller.getCustomerById(req, res);
    }),
  );

  // POST /api/v2/customers - 创建客户
  app.post(
    '/api/v2/customers',
    validate(CommonSchemas.customer),
    asyncHandler(async (req, res) => {
      await controller.createCustomer(req, res);
    }),
  );

  // PUT /api/v2/customers/:id - 更新客户
  app.put(
    '/api/v2/customers/:id',
    validate(CommonSchemas.customer),
    asyncHandler(async (req, res) => {
      await controller.updateCustomer(req, res);
    }),
  );

  // DELETE /api/v2/customers/:id - 删除客户
  app.delete(
    '/api/v2/customers/:id',
    asyncHandler(async (req, res) => {
      await controller.deleteCustomer(req, res);
    }),
  );
}

module.exports = {
  registerCustomerRoutesV2,
};
