const { logger } = require('./logger');

/**
 * 验证规则定义
 */
const ValidationRules = {
  required: (value) => value !== undefined && value !== null && value !== '',
  minLength: (min) => (value) => !value || value.length >= min,
  maxLength: (max) => (value) => !value || value.length <= max,
  email: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  phone: (value) => !value || /^1[3-9]\d{9}$/.test(value),
  number: (value) => !value || !isNaN(Number(value)),
  integer: (value) => !value || Number.isInteger(Number(value)),
  positive: (value) => !value || Number(value) > 0,
  min: (min) => (value) => !value || Number(value) >= min,
  max: (max) => (value) => !value || Number(value) <= max,
  in: (allowedValues) => (value) => !value || allowedValues.includes(value),
  match: (regex) => (value) => !value || regex.test(value),
};

/**
 * 验证器类
 */
class Validator {
  constructor(schema) {
    this.schema = schema;
    this.errors = {};
  }

  validate(data) {
    this.errors = {};

    for (const [field, rules] of Object.entries(this.schema)) {
      const value = data[field];
      
      for (const rule of rules) {
        const { type, message, ...options } = rule;
        
        let isValid = true;
        
        if (type === 'required') {
          isValid = ValidationRules.required(value);
        } else if (type === 'minLength') {
          isValid = ValidationRules.minLength(options.min)(value);
        } else if (type === 'maxLength') {
          isValid = ValidationRules.maxLength(options.max)(value);
        } else if (type === 'email') {
          isValid = ValidationRules.email(value);
        } else if (type === 'phone') {
          isValid = ValidationRules.phone(value);
        } else if (type === 'number') {
          isValid = ValidationRules.number(value);
        } else if (type === 'integer') {
          isValid = ValidationRules.integer(value);
        } else if (type === 'positive') {
          isValid = ValidationRules.positive(value);
        } else if (type === 'min') {
          isValid = ValidationRules.min(options.min)(value);
        } else if (type === 'max') {
          isValid = ValidationRules.max(options.max)(value);
        } else if (type === 'in') {
          isValid = ValidationRules.in(options.values)(value);
        } else if (type === 'match') {
          isValid = ValidationRules.match(options.regex)(value);
        } else if (typeof rule.validator === 'function') {
          isValid = rule.validator(value, data);
        }

        if (!isValid) {
          if (!this.errors[field]) {
            this.errors[field] = [];
          }
          this.errors[field].push(message || `${field} 验证失败`);
          break; // 一个字段遇到第一个错误就停止验证
        }
      }
    }

    return Object.keys(this.errors).length === 0;
  }

  getErrors() {
    return this.errors;
  }

  getFirstError() {
    const firstField = Object.keys(this.errors)[0];
    return firstField ? this.errors[firstField][0] : null;
  }
}

/**
 * Express 中间件工厂函数
 */
function validate(schema) {
  return (req, res, next) => {
    const validator = new Validator(schema);
    const isValid = validator.validate(req.body);

    if (!isValid) {
      const errors = validator.getErrors();
      logger.warn('输入验证失败', {
        path: req.path,
        errors,
      });

      return res.status(400).json({
        error: '输入数据验证失败',
        message: validator.getFirstError(),
        details: errors,
      });
    }

    next();
  };
}

/**
 * 预定义的验证规则集
 */
const CommonSchemas = {
  // 客户验证
  customer: {
    name: [
      { type: 'required', message: '客户姓名不能为空' },
      { type: 'minLength', min: 2, message: '客户姓名至少2个字符' },
      { type: 'maxLength', max: 50, message: '客户姓名最多50个字符' },
    ],
    phone: [
      { type: 'phone', message: '手机号格式不正确' },
    ],
    email: [
      { type: 'email', message: '邮箱格式不正确' },
    ],
    age: [
      { type: 'integer', message: '年龄必须是整数' },
      { type: 'min', min: 0, message: '年龄不能小于0' },
      { type: 'max', max: 150, message: '年龄不能大于150' },
    ],
  },

  // 产品验证
  product: {
    productName: [
      { type: 'required', message: '产品名称不能为空' },
      { type: 'minLength', min: 2, message: '产品名称至少2个字符' },
    ],
    customerId: [
      { type: 'required', message: '客户ID不能为空' },
      { type: 'integer', message: '客户ID必须是整数' },
      { type: 'positive', message: '客户ID必须大于0' },
    ],
    price: [
      { type: 'number', message: '价格必须是数字' },
      { type: 'min', min: 0, message: '价格不能小于0' },
    ],
    quantity: [
      { type: 'integer', message: '数量必须是整数' },
      { type: 'positive', message: '数量必须大于0' },
    ],
  },

  // 回访验证
  visit: {
    customerId: [
      { type: 'required', message: '客户ID不能为空' },
      { type: 'integer', message: '客户ID必须是整数' },
    ],
    visitTime: [
      { type: 'required', message: '回访时间不能为空' },
    ],
    content: [
      { type: 'required', message: '回访内容不能为空' },
      { type: 'minLength', min: 5, message: '回访内容至少5个字符' },
    ],
  },

  // 登录验证
  login: {
    username: [
      { type: 'required', message: '用户名不能为空' },
      { type: 'minLength', min: 3, message: '用户名至少3个字符' },
    ],
    password: [
      { type: 'required', message: '密码不能为空' },
      { type: 'minLength', min: 6, message: '密码至少6个字符' },
    ],
  },

  // 修改密码
  changePassword: {
    oldPassword: [
      { type: 'required', message: '旧密码不能为空' },
      { type: 'minLength', min: 6, message: '旧密码至少6个字符' },
    ],
    newPassword: [
      { type: 'required', message: '新密码不能为空' },
      { type: 'minLength', min: 6, message: '新密码至少6个字符' },
    ],
  },
};

module.exports = {
  Validator,
  validate,
  ValidationRules,
  CommonSchemas,
};
