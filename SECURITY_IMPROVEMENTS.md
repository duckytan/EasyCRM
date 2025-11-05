# 安全改进文档

**更新日期**: 2024年11月5日  
**版本**: 1.1.0  
**状态**: ✅ 已完成基础安全加固

---

## 已完成的安全改进

### 1. ✅ JWT 认证系统

**改进内容**:
- 替换简单的内存Token为标准JWT（JSON Web Token）
- Token包含用户信息和过期时间
- 支持Token过期自动失效

**影响文件**:
- `src/middlewares/auth.js` - 实现JWT签发和验证
- `src/config/index.js` - 添加JWT配置
- `src/routes/auth.js` - 更新登录接口
- `.env.example` - 添加JWT配置示例

**使用方式**:
```javascript
// 登录返回JWT Token
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}

// 响应
{
  "success": true,
  "user": { "id": 1, "name": "admin" },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// 使用Token访问受保护的API
GET /api/customers
Headers: { "Authorization": "Bearer <token>" }
```

**配置说明**:
```env
# .env 文件
JWT_SECRET=your-very-secure-secret-key-change-in-production
JWT_EXPIRES_IN=24h  # 可设置为: 1h, 7d, 30d 等
```

---

### 2. ✅ 密码加密

**改进内容**:
- 使用 bcryptjs 对所有密码进行哈希加密
- 采用 bcrypt 算法（10轮加盐）
- 支持旧密码自动迁移（首次登录时自动加密）

**影响文件**:
- `src/routes/auth.js` - 登录时验证和自动加密
- `src/routes/manager.js` - 改密时加密新密码

**工作原理**:
1. **新用户**: 密码直接加密存储
2. **旧用户**: 首次登录时，系统检测到明文密码，验证通过后自动加密并更新数据库
3. **改密**: 新密码自动加密后存储

**密码存储格式**:
```
# 明文（旧版，已废弃）
admin123

# 加密（新版）
$2a$10$xK1J2vF3mN4oP5qR6sT7uOvWxYzA8bC9dE0fG1hI2jK3lM4nO5pQ6
```

**兼容性说明**:
- ✅ 向后兼容：仍可使用旧密码登录（会自动升级为加密）
- ✅ 无需手动迁移数据库
- ✅ 不影响现有用户

---

### 3. ✅ 安全配置

**新增配置项**:
```javascript
// src/config/index.js
const JWT_SECRET = process.env.JWT_SECRET || 'ai-crm-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
```

**生产环境建议**:
```env
# 生产环境 .env 配置
NODE_ENV=production
JWT_SECRET=<使用强随机字符串，至少32位>
JWT_EXPIRES_IN=12h
```

---

## 安全改进对比

| 项目 | 改进前 | 改进后 |
|------|--------|--------|
| **密码存储** | ❌ 明文存储 | ✅ bcrypt加密（10轮加盐） |
| **认证机制** | ❌ 内存Token（重启失效） | ✅ JWT（标准化、有过期时间） |
| **Token安全** | ❌ 简单随机字符串 | ✅ 签名验证、防篡改 |
| **密码迁移** | ⚠️ 需手动迁移 | ✅ 自动升级 |
| **Token过期** | ❌ 无过期机制 | ✅ 可配置过期时间 |

---

## 使用指南

### 1. 环境配置

**首次部署**:
```bash
# 1. 复制环境变量示例
cp .env.example .env

# 2. 编辑 .env 文件，设置强密码
vim .env

# 3. 重要：修改JWT_SECRET为强随机字符串！
JWT_SECRET=<生成32位以上的随机字符串>
```

**生成安全的JWT_SECRET**:
```bash
# 方法1：使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 方法2：使用 OpenSSL
openssl rand -hex 32
```

### 2. 现有用户迁移

**无需手动操作！** 系统会自动处理：

1. 用户使用旧密码登录
2. 系统验证通过后，自动将密码加密
3. 下次登录使用新加密验证

### 3. 测试新功能

```bash
# 1. 启动服务器
npm start

# 2. 测试登录（会返回JWT）
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 3. 使用Token访问API
curl http://localhost:3001/api/customers \
  -H "Authorization: Bearer <从登录返回的token>"

# 4. 测试修改密码（密码会被自动加密）
curl -X POST http://localhost:3001/api/managers/change-password \
  -H "Content-Type: application/json" \
  -d '{"oldPassword":"admin123","newPassword":"newpass456"}'
```

---

## 技术细节

### JWT Payload 结构

```json
{
  "id": 1,
  "name": "admin",
  "iat": 1699180800,  // 签发时间
  "exp": 1699267200   // 过期时间
}
```

### bcrypt 加密流程

```
输入密码 → bcrypt.hashSync(password, 10)
                     ↓
           生成随机盐 + 10轮哈希
                     ↓
    $2a$10$<盐><哈希结果>
```

### 密码验证流程

```
1. 用户输入密码
2. 从数据库获取存储的密码哈希
3. 检查是否已加密（以$2开头）
   ├─ 是：使用 bcrypt.compareSync(input, hash)
   └─ 否：直接字符串比较（并在验证通过后升级为加密）
4. 返回验证结果
```

---

## 性能影响

### bcrypt 性能

- **加密时间**: ~100-200ms（10轮加盐）
- **验证时间**: ~100-200ms
- **影响**: 仅在登录/改密时执行，对系统整体性能影响可忽略

### JWT 性能

- **生成时间**: <1ms
- **验证时间**: <1ms
- **影响**: 极小，可高并发处理

---

## 安全最佳实践

### ✅ 已实现

1. **密码加密存储** - 使用bcrypt，10轮加盐
2. **JWT标准认证** - 支持过期时间
3. **自动密码升级** - 无缝迁移旧密码
4. **配置外部化** - 敏感信息在.env中
5. **错误日志记录** - 审计登录失败

### ⚠️ 建议进一步改进

1. **生产环境配置**
   - 使用强随机JWT_SECRET（至少32位）
   - 缩短Token过期时间（建议6-12小时）
   - 启用HTTPS

2. **增强安全措施**
   - 实施登录失败次数限制
   - 添加IP黑名单
   - 实施双因素认证（2FA）
   - 添加Token刷新机制（Refresh Token）

3. **密码策略**
   - 强制密码复杂度（大小写+数字+特殊字符）
   - 定期密码过期提醒
   - 密码历史记录（防止重用）

---

## 向后兼容性

### ✅ 完全兼容

- 现有前端代码无需修改（仍使用Bearer Token）
- 旧密码可正常登录（会自动升级）
- API接口保持不变

### ⚠️ 注意事项

1. **Token格式变化**: 从简单字符串变为JWT，但使用方式相同
2. **Token有过期时间**: 24小时后需重新登录（可配置）
3. **密码存储变化**: 数据库中密码从明文变为加密（自动）

---

## 故障排查

### 问题1：登录后提示"登录状态已失效"

**原因**: Token过期或JWT_SECRET不匹配

**解决**:
```bash
# 检查 .env 配置
cat .env | grep JWT

# 确保JWT_SECRET一致，重启服务器
npm start
```

### 问题2：旧密码无法登录

**原因**: 可能密码已被自动加密

**解决**:
1. 检查数据库中的密码是否以`$2`开头（已加密）
2. 如果已加密，使用新密码登录
3. 如果忘记密码，重置数据库

### 问题3：性能下降

**原因**: bcrypt加密需要时间

**说明**: 
- 这是正常的，安全性和性能需要权衡
- 仅影响登录/改密操作（~200ms）
- 不影响正常API调用

---

## 依赖包版本

```json
{
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2"
}
```

---

## 相关文档

- [JWT官方文档](https://jwt.io/)
- [bcrypt算法说明](https://en.wikipedia.org/wiki/Bcrypt)
- [OWASP密码存储指南](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

---

## 下一步安全改进建议

### 高优先级
1. 实施HTTPS（生产环境必须）
2. 添加登录失败次数限制
3. 实施CSRF保护

### 中优先级
4. 添加Token刷新机制
5. 实施IP白名单
6. 添加审计日志

### 低优先级
7. 双因素认证（2FA）
8. 单点登录（SSO）
9. OAuth2支持

---

**更新人**: AI Assistant  
**审核状态**: ✅ 已测试  
**生产就绪**: ⚠️ 需配置强JWT_SECRET

---

## 快速检查清单

部署前检查：

- [ ] 已修改 `.env` 中的 `JWT_SECRET` 为强随机字符串
- [ ] 已创建 `data/`、`backups/`、`logs/` 目录
- [ ] 已测试登录功能正常
- [ ] 已测试改密功能正常
- [ ] 已设置合理的 `JWT_EXPIRES_IN`
- [ ] 生产环境已启用HTTPS
- [ ] 已备份原数据库（如有）

全部完成后即可部署到生产环境！✅
