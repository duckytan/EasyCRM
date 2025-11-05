const { CustomerService } = require('../services/customerService');
const { logger } = require('../middlewares/logger');
const { parsePagination, buildPagination } = require('../utils/pagination');

class CustomerController {
  constructor() {
    this.service = new CustomerService();
  }

  async getAllCustomers(req, res) {
    try {
      const pagination = parsePagination(req.query);
      const filters = {
        search: typeof req.query.search === 'string' ? req.query.search.trim() : '',
        category: typeof req.query.category === 'string' ? req.query.category.trim() : '',
        intention: typeof req.query.intention === 'string' ? req.query.intention.trim() : '',
        region: typeof req.query.region === 'string' ? req.query.region.trim() : '',
      };

      const result = await this.service.getAllCustomers({
        ...pagination,
        filters,
      });

      if (pagination.usePagination) {
        res.json({
          data: result.rows,
          pagination: buildPagination(pagination.page, pagination.limit, result.total),
        });
        return;
      }

      res.json(result.rows);
    } catch (error) {
      logger.error('获取客户列表失败', { error: error.message });
      res.status(500).json({ error: '获取客户列表失败' });
    }
  }

  async getCustomerById(req, res) {
    try {
      const { id } = req.params;
      const customer = await this.service.getCustomerById(id);

      if (!customer) {
        return res.status(404).json({ error: '客户不存在' });
      }

      // 解析 subordinateContactIds
      if (customer.subordinateContactIds) {
        try {
          customer.subordinateContactIds = JSON.parse(customer.subordinateContactIds);
        } catch (parseErr) {
          logger.warn('解析下级联系人ID失败', { customerId: id, error: parseErr.message });
          customer.subordinateContactIds = [];
        }
      } else {
        customer.subordinateContactIds = [];
      }

      res.json(customer);
    } catch (error) {
      logger.error('获取客户详情失败', { customerId: req.params.id, error: error.message });
      res.status(500).json({ error: '获取客户信息失败' });
    }
  }

  async createCustomer(req, res) {
    try {
      if (!req.body.name) {
        return res.status(400).json({ error: '客户姓名不能为空' });
      }

      const result = await this.service.createCustomer(req.body);
      res.status(201).json(result);
    } catch (error) {
      logger.error('创建客户失败', { error: error.message, body: req.body });
      res.status(500).json({ error: '创建客户失败' });
    }
  }

  async updateCustomer(req, res) {
    try {
      const { id } = req.params;

      if (!req.body.name) {
        return res.status(400).json({ error: '客户姓名不能为空' });
      }

      const result = await this.service.updateCustomer(id, req.body);

      if (!result) {
        return res.status(404).json({ error: '客户不存在' });
      }

      res.json({ ...result, message: '客户信息更新成功' });
    } catch (error) {
      logger.error('更新客户失败', { customerId: req.params.id, error: error.message });
      res.status(500).json({ error: '更新客户信息失败' });
    }
  }

  async deleteCustomer(req, res) {
    try {
      const { id } = req.params;
      const result = await this.service.deleteCustomer(id);

      if (!result) {
        return res.status(404).json({ error: '客户不存在' });
      }

      res.json({
        success: true,
        message: '客户及其相关数据已被成功删除',
      });
    } catch (error) {
      logger.error('删除客户失败', { customerId: req.params.id, error: error.message });
      res.status(500).json({ error: '删除客户失败' });
    }
  }
}

module.exports = {
  CustomerController,
};
