/**
 * 测试数据生成器
 * 用于生成随机的测试数据，包括客户信息、购买记录和回访记录
 */

// 随机数据生成工具函数
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateTime(date) {
    return formatDate(date) + 'T' + 
           String(date.getHours()).padStart(2, '0') + ':' + 
           String(date.getMinutes()).padStart(2, '0');
}

// 生成随机手机号
function generatePhone() {
    const prefixes = ['133', '138', '139', '151', '152', '157', '158', '159', '182', '183', '187', '188'];
    const prefix = getRandomElement(prefixes);
    let rest = '';
    for (let i = 0; i < 8; i++) {
        rest += getRandomInt(0, 9);
    }
    return prefix + rest;
}

// 生成随机邮箱
function generateEmail(name) {
    const domains = ['gmail.com', 'hotmail.com', 'qq.com', '163.com', 'outlook.com', 'icloud.com', 'foxmail.com'];
    const randomName = name.toLowerCase().replace(/\s/g, '') + getRandomInt(100, 999);
    return randomName + '@' + getRandomElement(domains);
}

// 生成随机地址
function generateAddress(region) {
    const roadNames = ['中山', '长江', '北京', '人民', '和平', '解放', '新华', '建设', '胜利', '青年', '光明', '文化', '友谊', '红星'];
    const roadTypes = ['路', '大道', '街', '巷', '路', '大街'];
    const buildingNames = ['金色家园', '阳光花园', '星河湾', '城市花园', '明珠花园', '翡翠城', '华府', '康城', '世纪城', '御景园'];
    
    const road = getRandomElement(roadNames) + getRandomElement(roadTypes);
    const number = getRandomInt(1, 999) + '号';
    const building = getRandomElement(buildingNames);
    const unit = getRandomInt(1, 9) + '单元';
    const room = getRandomInt(101, 2505);
    
    return `${region} ${road} ${number} ${building} ${unit} ${room}室`;
}

// 生成随机客户数据
function generateCustomer() {
    // 姓名数据
    const lastNames = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '吴', '周', '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '罗', '郑'];
    const firstNamesMale = ['伟', '强', '磊', '军', '杰', '明', '建国', '建军', '建华', '建', '文', '永强', '秀英', '伟明', '国强', '志强', '志军', '丽', '芳', '娜', '静', '敏', '婷', '娟', '文婷', '雪', '琳', '慧', '媛', '飞', '鹏', '浩', '宇', '子豪', '浩然', '皓轩', '梓轩', '梓豪', '雨泽', '宏', '志强', '文', '明'];
    const firstNamesFemale = ['丽', '芳', '娜', '静', '敏', '婷', '娟', '文婷', '雪', '琳', '慧', '媛', '颖', '佳', '思', '莹', '淑华', '淑英', '淑', '雅', '文', '秀英', '婉婷', '诗婷', '馨', '欣', '怡', '莎', '思', '茜', '雅琪', '美琪', '紫琪', '凌', '紫薇', '子怡', '雨涵', '佳怡', '雪华', '雪英', '雪梅', '雪玲', '秀梅', '锦'];
    
    // 性别随机生成
    const gender = Math.random() > 0.5 ? '男' : '女';
    const lastName = getRandomElement(lastNames);
    const firstName = gender === '男' ? getRandomElement(firstNamesMale) : getRandomElement(firstNamesFemale);
    const name = lastName + firstName;
    
    // 生成随机年龄和生日
    const age = getRandomInt(20, 65);
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - age;
    const birthMonth = getRandomInt(1, 12);
    const birthDay = getRandomInt(1, 28);  // 简化处理，避免月份天数问题
    const birthday = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;
    
    // 区域和地址
    const regions = ['北京市', '上海市', '广州市', '深圳市', '杭州市', '南京市', '成都市', '重庆市', '武汉市', '西安市', '天津市', '苏州市', '郑州市', '长沙市', '青岛市', '沈阳市', '厦门市', '大连市', '宁波市', '济南市'];
    const region = getRandomElement(regions);
    const address = generateAddress(region);
    
    // 公司和职位
    const companies = ['阿里巴巴', '腾讯', '百度', '京东', '字节跳动', '华为', '小米', '美团', '中国移动', '中国电信', '中石油', '工商银行', '建设银行', '中国人寿', '中国平安', '万科集团', '恒大集团', '顺丰集团'];
    const positions = ['经理', '主管', '总监', '工程师', '专员', '顾问', '总裁', '首席执行官', '部门总监', '市场总监', '销售总监', '技术总监', '人力资源总监'];
    
    const company = Math.random() > 0.3 ? getRandomElement(companies) : '';
    const position = company ? getRandomElement(positions) : '';
    
    // 客户分类
    const categories = ['潜在客户', '新客户', '普通客户', 'VIP客户', '代理商'];
    const categoryProbabilities = [0.15, 0.2, 0.4, 0.15, 0.1];  // 不同类别的概率分布
    let categoryIndex = 0;
    let randomProb = Math.random();
    let cumulativeProb = 0;
    
    for (let i = 0; i < categoryProbabilities.length; i++) {
        cumulativeProb += categoryProbabilities[i];
        if (randomProb <= cumulativeProb) {
            categoryIndex = i;
            break;
        }
    }
    
    const category = categories[categoryIndex];
    
    // 客户意向
    const intentions = ['H', 'A', 'B', 'C', 'D'];
    const intentionProbabilities = [0.1, 0.2, 0.3, 0.25, 0.15];
    let intentionIndex = 0;
    randomProb = Math.random();
    cumulativeProb = 0;
    
    for (let i = 0; i < intentionProbabilities.length; i++) {
        cumulativeProb += intentionProbabilities[i];
        if (randomProb <= cumulativeProb) {
            intentionIndex = i;
            break;
        }
    }
    
    const intention = intentions[intentionIndex];
    
    // 预算范围
    const budgets = ['10000', '20000', '50000', '100000', '200000'];
    
    // 客户需求
    const demandTypes = [
        '想购买最新款产品', 
        '正在比较不同品牌', 
        '需要产品技术支持', 
        '咨询售后服务政策', 
        '对价格比较敏感，寻找优惠', 
        '需要定制化解决方案', 
        '正在为公司采购寻找供应商', 
        '想了解产品性能和规格',
        '关注产品的可扩展性',
        '需要专业的安装服务',
        '对产品质量保证比较关注'
    ];
    
    // 注册日期：一年内的随机日期
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const registrationDate = formatDate(getRandomDate(oneYearAgo, new Date()));
    
    // 社交媒体
    const wechat = Math.random() > 0.4 ? 'wx_' + lastName.toLowerCase() + firstName.toLowerCase() + getRandomInt(100, 999) : '';
    const whatsapp = Math.random() > 0.8 ? '+86' + generatePhone() : '';
    const facebook = Math.random() > 0.7 ? lastName.toLowerCase() + firstName.toLowerCase() + getRandomInt(100, 999) : '';
    
    return {
        name,
        gender,
        age,
        birthday,
        phone: generatePhone(),
        email: Math.random() > 0.3 ? generateEmail(name) : '',
        address,
        company,
        position,
        region,
        registration_date: registrationDate,
        category,
        intention,
        demand: Math.random() > 0.3 ? getRandomElement(demandTypes) : '',
        wechat,
        whatsapp,
        facebook,
        budget: Math.random() > 0.5 ? getRandomElement(budgets) : '',
        remark: Math.random() > 0.7 ? '这是一条随机备注信息，用于测试显示效果。' : ''
    };
}

// 生成随机产品购买记录
function generateProductPurchase(customerId, customerRegDate) {
    const productNames = [
        'iPhone 15 Pro', 'MacBook Air M2', 'iPad Pro 12.9英寸', 'Apple Watch Series 8', 'AirPods Pro',
        'Samsung Galaxy S23 Ultra', 'Samsung Galaxy Book3', 'Galaxy Tab S9', 'Galaxy Watch6',
        'Dell XPS 15', 'Dell Alienware m17', 'Dell UltraSharp 32英寸显示器',
        'Lenovo ThinkPad X1 Carbon', 'Lenovo Yoga 9i', 'Lenovo Legion Tower 7i',
        'HP Spectre x360', 'HP Omen 45L', 'HP Envy 34 All-in-One',
        'Microsoft Surface Pro 9', 'Microsoft Surface Laptop 5', 'Xbox Series X',
        'Sony PlayStation 5', 'Sony WH-1000XM5', 'Sony Alpha a7 IV',
        'LG OLED evo C3', 'LG Gram 17', 'LG StanbyME',
        'Canon EOS R6 Mark II', 'Canon RF 24-70mm F2.8 L IS USM', 'Canon PIXMA Pro-200',
        'DJI Mavic 3', 'DJI Osmo Mobile 6', 'DJI Ronin 4D',
        'Bose QuietComfort 45', 'Bose Smart Soundbar 600', 'Bose SoundLink Flex',
        'Dyson V15 Detect', 'Dyson Purifier Hot+Cool', 'Dyson Airwrap'
    ];
    
    // 生成购买日期（客户注册日期之后）
    const regDate = new Date(customerRegDate);
    const purchaseDate = getRandomDate(regDate, new Date());
    
    // 生成数量和价格
    const quantity = getRandomInt(1, 3);
    let price;
    const selectedProduct = getRandomElement(productNames);
    
    // 根据产品类型设置合理的价格范围
    if (selectedProduct.includes('iPhone') || selectedProduct.includes('Galaxy S') || 
        selectedProduct.includes('Pro') || selectedProduct.includes('Ultra')) {
        price = getRandomInt(6999, 13999);
    } else if (selectedProduct.includes('MacBook') || selectedProduct.includes('Surface') || 
               selectedProduct.includes('ThinkPad') || selectedProduct.includes('XPS')) {
        price = getRandomInt(7999, 19999);
    } else if (selectedProduct.includes('iPad') || selectedProduct.includes('Tab') || 
               selectedProduct.includes('Watch') || selectedProduct.includes('AirPods')) {
        price = getRandomInt(1599, 5999);
    } else {
        price = getRandomInt(799, 4999);
    }
    
    // 售后服务记录
    const afterSale = Math.random() > 0.7 ? `客户于${formatDate(new Date(purchaseDate.getTime() + getRandomInt(7, 90) * 24 * 60 * 60 * 1000))}联系售后，原因：${getRandomElement(['产品使用问题', '配件损坏', '软件问题', '需要退换货', '咨询保修政策'])}` : '';
    
    // 计算回访日期（购买日期+90天）
    const followUpDate = new Date(purchaseDate);
    followUpDate.setDate(followUpDate.getDate() + 90);
    
    return {
        customerId,
        productName: selectedProduct,
        quantity,
        price,
        purchaseDate: formatDate(purchaseDate),
        afterSale,
        followUpDate: formatDate(followUpDate)
    };
}

// 生成随机回访记录
function generateVisit(customerId, customerRegDate) {
    // 回访内容模板
    const visitContents = [
        '客户表示对产品非常满意，使用过程中没有遇到问题。',
        '客户反馈产品质量良好，但对价格仍有些顾虑。',
        '回访中，客户提出了一些产品使用中的问题，已详细解答。',
        '客户对售后服务表示满意，但希望未来能提供更多的技术支持。',
        '客户表示最近遇到了产品使用问题，已安排技术人员上门处理。',
        '回访中发现客户有新的需求，已安排销售顾问跟进。',
        '客户反馈产品使用良好，并介绍了一位朋友有购买意向，已记录跟进。',
        '客户使用过程中发现产品功能不符合预期，已详细记录并反馈给产品部门。',
        '客户表示对服务很满意，愿意在社交媒体上分享使用体验。',
        '客户反馈购买体验一般，对发货速度不满意，已道歉并解释原因。'
    ];
    
    // 回访效果
    const effects = ['非常满意', '满意', '良好', '一般', '不满意'];
    const effectsProbabilities = [0.25, 0.35, 0.25, 0.1, 0.05];
    
    // 满意度调查
    const satisfactions = [
        '客户对产品功能和质量表示满意，认为使用体验超出预期。',
        '客户对售后服务响应速度很满意，认为解决问题及时高效。',
        '客户满意整体购买体验，但希望能加强产品使用培训。',
        '客户表示产品符合需求，但价格略高于心理预期。',
        '客户满意产品质量，但对包装不够环保有一定意见。',
        '客户对服务态度表示满意，感觉被重视。',
        '客户对产品性价比评价较高，可能会向朋友推荐。',
        '客户满意度一般，认为产品有待改进。',
        '客户对配送速度很满意，但产品说明书不够详细。',
        '客户对整体体验满意，对我们的个性化服务印象深刻。'
    ];
    
    // 后续跟进
    const followUps = [
        '计划一周后再次回访，确认问题是否解决。',
        '安排销售顾问提供更多产品信息和优惠方案。',
        '记录客户新需求，安排专业技术人员对接。',
        '发送新产品宣传资料，保持客户黏性。',
        '标记为高价值客户，纳入VIP服务计划。',
        '建议进行产品升级，已安排专人对接。',
        '暂无需跟进，三个月后常规回访。',
        '客户有新的业务合作意向，已转给相关部门跟进。',
        '发送满意度调查问卷，收集更详细的反馈。',
        '根据客户反馈优化服务流程，下次回访重点关注。'
    ];
    
    // 回访日期（在注册日期之后）
    const regDate = new Date(customerRegDate);
    const visitDate = getRandomDate(regDate, new Date());
    
    // 随机选择回访效果，按照概率分布
    let effectIndex = 0;
    let randomProb = Math.random();
    let cumulativeProb = 0;
    
    for (let i = 0; i < effectsProbabilities.length; i++) {
        cumulativeProb += effectsProbabilities[i];
        if (randomProb <= cumulativeProb) {
            effectIndex = i;
            break;
        }
    }
    
    const effect = effects[effectIndex];
    
    // 基于回访效果调整客户意向
    const intentionMap = {
        '非常满意': ['H', 'A'],
        '满意': ['A', 'B'],
        '良好': ['B'],
        '一般': ['B', 'C'],
        '不满意': ['C', 'D']
    };
    
    const intention = getRandomElement(intentionMap[effect]);
    
    return {
        customerId,
        visitTime: formatDateTime(visitDate),
        content: getRandomElement(visitContents),
        effect,
        satisfaction: Math.random() > 0.3 ? getRandomElement(satisfactions) : '',
        intention,
        followUp: Math.random() > 0.4 ? getRandomElement(followUps) : ''
    };
}

// 主函数：生成测试数据
async function generateTestData(count = 100) {
    try {
        const customers = [];
        const products = [];
        const visits = [];
        
        // 显示进度提示
        showProgressToast(`正在准备生成${count}个客户的测试数据...`);
        
        // 生成客户数据
        for (let i = 0; i < count; i++) {
            const customer = generateCustomer();
            
            // 添加客户
            const customerResponse = await fetch('/api/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(customer)
            });
            
            if (!customerResponse.ok) {
                throw new Error(`创建客户失败: ${customerResponse.statusText}`);
            }
            
            const customerData = await customerResponse.json();
            const customerId = customerData.id;
            
            // 更新进度
            showProgressToast(`已创建 ${i+1}/${count} 个客户，正在生成购买记录和回访记录...`);
            
            // 为每个客户生成10条购买记录
            const customerProducts = [];
            for (let j = 0; j < 10; j++) {
                const product = generateProductPurchase(customerId, customer.registration_date);
                customerProducts.push(product);
                
                // 添加购买记录
                const productResponse = await fetch('/api/products', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(product)
                });
                
                if (!productResponse.ok) {
                    throw new Error(`创建购买记录失败: ${productResponse.statusText}`);
                }
            }
            
            // 为每个客户生成10条回访记录
            const customerVisits = [];
            for (let j = 0; j < 10; j++) {
                const visit = generateVisit(customerId, customer.registration_date);
                customerVisits.push(visit);
                
                // 添加回访记录
                const visitResponse = await fetch('/api/visits', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(visit)
                });
                
                if (!visitResponse.ok) {
                    throw new Error(`创建回访记录失败: ${visitResponse.statusText}`);
                }
            }
            
            customers.push({
                ...customer,
                id: customerId
            });
            products.push(...customerProducts);
            visits.push(...customerVisits);
        }
        
        showProgressToast(`测试数据生成完成！共生成 ${customers.length} 个客户，${products.length} 条购买记录，${visits.length} 条回访记录。`, 'success', 5000);
        return { customers, products, visits };
    } catch (error) {
        showProgressToast(`测试数据生成失败: ${error.message}`, 'error', 5000);
        console.error('测试数据生成失败:', error);
        throw error;
    }
}

// 显示进度提示
function showProgressToast(message, type = 'info', duration = 3000) {
    // 检查是否存在app对象和其showToast方法
    if (typeof app !== 'undefined' && typeof app.showToast === 'function') {
        app.showToast(message, type, duration);
    } else {
        console.log(message);
        // 尝试使用全局showToast函数（如果存在）
        if (typeof showToast === 'function') {
            showToast(message, type, duration);
        }
    }
}

// 导出函数供其他模块使用
window.testDataGenerator = {
    generateTestData
}; 