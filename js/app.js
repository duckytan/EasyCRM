// 更新状态栏时间
function updateStatusBarTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    document.querySelectorAll('.status-bar-time').forEach(el => {
        el.textContent = timeString;
    });
}

// 预算范围代码转换函数
function getBudgetName(code) {
    if (!code) return '未填写';
    if (budgetCodeMap[code]) {
        return budgetCodeMap[code];
    }
    // 如果没有在映射中找到，返回原始代码
    return code;
}

// 格式化货币金额
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '¥0.00';
    return `¥${parseFloat(amount).toFixed(2)}`;
}

// 格式化日期为YYYY-MM-DD
function formatDateToISO(date) {
    if (!date) return '';
    
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// 格式化日期为本地格式
function formatDateToLocale(date) {
    if (!date) return '';
    
    try {
        // 尝试将日期字符串转换为标准格式
        if (typeof date === 'string') {
            // 如果只是日期没有时间，确保格式正确
            if (date.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
                const parts = date.split('-');
                // 确保月和日是两位数
                const year = parts[0];
                const month = parts[1].padStart(2, '0');
                const day = parts[2].padStart(2, '0');
                date = `${year}-${month}-${day}`;
            }
            // 创建日期对象
            date = new Date(date);
        }
        
        // 检查日期是否有效
        if (isNaN(date.getTime())) {
            console.warn('无效的日期:', date);
            return '日期无效';
        }
        
        return date.toLocaleDateString('zh-CN');
    } catch (e) {
        console.error('日期格式化错误:', e);
        return '日期错误';
    }
}

// 显示提示信息
function showToast(message, type = 'info') {
    // 创建提示元素
    const toast = document.createElement('div');
    toast.className = `ios-toast toast-${type}`;
    toast.textContent = message;
    
    // 添加到页面
    document.body.appendChild(toast);
    
    // 显示提示
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // 自动移除
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// 全局API对象
const api = {
    baseUrl: '/api',
    
    // 获取请求头
    headers() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // 添加认证令牌
        const token = localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    },
    
    // GET请求
    async get(endpoint) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'GET',
            headers: this.headers()
        });
        
        // 检查认证错误
        if (response.status === 401) {
            this.handleAuthError();
            throw new Error('认证失败');
        }
        
        return response.json();
    },
    
    // POST请求
    async post(endpoint, data) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: this.headers(),
            body: JSON.stringify(data)
        });
        
        // 检查认证错误
        if (response.status === 401) {
            this.handleAuthError();
            throw new Error('认证失败');
        }
        
        return response.json();
    },
    
    // PUT请求
    async put(endpoint, data) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'PUT',
            headers: this.headers(),
            body: JSON.stringify(data)
        });
        
        // 检查认证错误
        if (response.status === 401) {
            this.handleAuthError();
            throw new Error('认证失败');
        }
        
        return response.json();
    },
    
    // DELETE请求
    async delete(endpoint) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'DELETE',
            headers: this.headers()
        });
        
        // 检查认证错误
        if (response.status === 401) {
            this.handleAuthError();
            throw new Error('认证失败');
        }
        
        return response.json();
    },
    
    // 处理认证错误
    handleAuthError() {
        // 清除认证信息
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        
        // 跳转到登录页面
        window.location.href = '/pages/login.html';
    }
};

// 检查用户是否已登录
function checkAuth() {
    // 排除登录页面
    if (window.location.pathname.includes('login.html')) {
        return;
    }
    
    // 检查是否有认证令牌
    const token = localStorage.getItem('authToken');
    if (!token) {
        // 没有令牌，重定向到登录页面
        window.location.href = '/pages/login.html';
    }
}

// 在每个页面加载时检查认证状态
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
});

// 获取默认导航模式（排在第一位的导航工具）
async function getDefaultNavigationMode() {
    try {
        // 从服务器获取导航模式列表，按displayOrder排序
        const navigationModes = await api.get('/navigation-modes');
        
        // 返回所有导航模式
        if (navigationModes && navigationModes.length > 0) {
            return navigationModes;
        }
        
        // 如果没有配置导航模式，返回默认的导航模式列表
        return [
            {
                name: '默认导航',
                urlPattern: 'geo:0,0?q={Address}'
            },
            {
                name: 'Google地图(备用)',
                urlPattern: 'https://maps.google.com/maps?q={Address}'
            }
        ];
    } catch (error) {
        console.error('获取导航模式列表失败:', error);
        // 发生错误时返回默认的导航模式列表
        return [
            {
                name: '默认导航',
                urlPattern: 'geo:0,0?q={Address}'
            },
            {
                name: 'Google地图(备用)',
                urlPattern: 'https://maps.google.com/maps?q={Address}'
            }
        ];
    }
}

// 检测是否为移动设备
function isMobileDevice() {
    // 使用 navigator.userAgent 检测移动设备
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // 常见移动设备标识
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
    
    // 也可以通过媒体查询检测屏幕宽度
    const isMobileWidth = window.matchMedia("(max-width: 768px)").matches;
    
    return mobileRegex.test(userAgent) || isMobileWidth;
}

// 使用默认导航模式导航到地址
async function navigateWithDefaultMode(address) {
    if (!address) {
        console.error('地址为空，无法导航');
        return;
    }
    
    try {
        // 获取所有导航模式列表
        const navigationModes = await getDefaultNavigationMode();
        console.log('获取到导航模式列表:', navigationModes.length, '个');
        
        // 检测设备类型
        const isMobile = isMobileDevice();
        console.log('当前设备类型:', isMobile ? '移动设备' : 'PC设备');
        
        // 如果没有导航模式，显示错误
        if (!navigationModes || navigationModes.length === 0) {
            console.error('没有可用的导航模式');
            if (isMobile) {
                window.location.href = `https://maps.google.com/maps?q=${encodeURIComponent(address)}`;
            } else {
                window.open(`https://maps.google.com/maps?q=${encodeURIComponent(address)}`, '_blank');
            }
            return;
        }
        
        // 对地址进行编码
        const encodedAddress = encodeURIComponent(address);
        
        // 按顺序尝试所有导航模式，并传递设备类型信息
        attemptNavigation(navigationModes, 0, encodedAddress, isMobile);
        
    } catch (error) {
        console.error('导航失败:', error);
        // 出错时使用Google地图作为最后的备用
        const encodedAddress = encodeURIComponent(address);
        // 仍然根据设备类型决定打开方式
        if (isMobileDevice()) {
            window.location.href = `https://maps.google.com/maps?q=${encodedAddress}`;
        } else {
            window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank');
        }
    }
}

// 按顺序尝试导航
function attemptNavigation(navigationModes, index, encodedAddress, isMobile) {
    // 如果已经尝试了所有导航模式，使用Google地图作为最后的备用
    if (index >= navigationModes.length) {
        console.log('所有导航模式都已尝试，使用Google地图作为最后备用');
        if (isMobile) {
            window.location.href = `https://maps.google.com/maps?q=${encodedAddress}`;
        } else {
            window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank');
        }
        return;
    }
    
    // 获取当前要尝试的导航模式
    const currentMode = navigationModes[index];
    console.log(`尝试使用导航模式(${index + 1}/${navigationModes.length}): ${currentMode.name}`);
    
    // 替换URL模式中的{Address}占位符
    let navigationUrl = currentMode.urlPattern.replace('{Address}', encodedAddress);
    
    // 根据设备类型决定打开方式
    if (isMobile) {
        // 移动设备：在当前窗口打开
        window.location.href = navigationUrl;
    } else {
        // PC设备：在新窗口打开
        window.open(navigationUrl, '_blank');
        
        // 由于在新窗口打开，无需等待检查是否成功，立即尝试下一个
        attemptNavigation(navigationModes, index + 1, encodedAddress, isMobile);
        return;
    }
    
    // 只有移动设备才需要检查导航是否成功打开
    if (isMobile) {
        // 如果导航打开失败，2秒后尝试下一个导航模式
        setTimeout(function() {
            // 如果页面还在当前应用中，说明导航未成功打开
            if (document.visibilityState !== 'hidden') {
                console.log(`导航模式 ${currentMode.name} 启动失败，尝试下一个`);
                // 尝试下一个导航模式
                attemptNavigation(navigationModes, index + 1, encodedAddress, isMobile);
            }
        }, 2000);
    }
}

// 初始加载时更新时间
document.addEventListener('DOMContentLoaded', function() {
    updateStatusBarTime();
    // 每分钟更新一次时间
    setInterval(updateStatusBarTime, 60000);
    
    // 为所有链接添加点击效果
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
            }
        });
    });
    
    // 为所有底部导航项添加点击处理
    document.querySelectorAll('.ios-tab-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.ios-tab-item').forEach(i => {
                i.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
});

// 初始化主题设置
function initTheme() {
    // 从服务器获取设置
    fetch('/api/user-settings')
        .then(response => response.json())
        .then(settings => {
            if (settings.darkMode) {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
        })
        .catch(error => {
            console.error('加载主题设置失败:', error);
            // 出错时使用默认设置（浅色模式）
            document.documentElement.removeAttribute('data-theme');
        });
}

// 监听主题变化事件
window.addEventListener('themeChange', (event) => {
    if (event.detail.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
});

// 页面加载时初始化主题
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
});

// 加载公共页脚导航栏
function loadFooter() {
    // 获取相对于当前页面的footer.html路径
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop();
    
    let footerPath;
    
    if (currentPath.includes('/pages/')) {
        // 如果当前在pages目录下，使用相对路径
        footerPath = 'footer.html';
    } else {
        // 如果在根目录，使用绝对路径
        footerPath = 'pages/footer.html';
    }
    
    // 加载footer.html
    fetch(footerPath)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load footer');
            }
            return response.text();
        })
        .then(data => {
            // 在页面容器中添加页脚HTML
            const pageContainer = document.querySelector('.ios-page-container');
            if (pageContainer) {
                // 移除现有的导航栏，如果有的话
                const existingNav = document.querySelector('.ios-tab-bar');
                if (existingNav) {
                    existingNav.remove();
                }

                // 添加新的页脚HTML
                pageContainer.insertAdjacentHTML('beforeend', data);
                
                // 为客户详情页做特殊处理
                if (currentPage.includes('customer-detail.html')) {
                    // 调整底部操作按钮的位置
                    const actionButtons = document.querySelector('.bottom-action-buttons');
                    if (actionButtons) {
                        actionButtons.style.bottom = '70px';
                    }
                }
            }
        })
        .catch(error => {
            console.error('加载页脚失败:', error);
        });
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 加载页脚导航栏
    loadFooter();
});

// 全局预设数据对象
window.app = window.app || {};
app.presetData = {
    regions: [],
    budgets: [],
    visitMethods: [],
    loaded: false,
    
    // 加载所有预设数据
    loadAll: async function() {
        if (this.loaded) return Promise.resolve(true);
        
        try {
            // 并行加载所有预设数据
            const results = await Promise.allSettled([
                this.loadRegions(),
                this.loadBudgets(),
                this.loadVisitMethods()
            ]);
            
            // 检查结果
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.warn(`预设数据加载失败 (${index}):`, result.reason);
                }
            });
            
            this.loaded = true;
            console.log('所有预设数据加载完成');
            return true;
        } catch (error) {
            console.error('加载预设数据出错:', error);
            return false;
        }
    },
    
    // 加载地区数据
    loadRegions: async function() {
        try {
            // 从缓存中获取
            const cachedData = localStorage.getItem('regionsData');
            if (cachedData) {
                this.regions = JSON.parse(cachedData);
                console.log('从缓存加载地区数据:', this.regions.length);
            }
            
            // 无论是否有缓存，都尝试从服务器获取最新数据
            const response = await api.get('/regions');
            if (response && Array.isArray(response)) {
                this.regions = response;
                // 更新缓存
                localStorage.setItem('regionsData', JSON.stringify(this.regions));
                console.log('从服务器加载地区数据:', this.regions.length);
            }
            
            return this.regions;
        } catch (error) {
            console.warn('从服务器获取地区数据失败，使用缓存数据:', error);
            // 如果服务器获取失败，但缓存中有数据，则继续使用缓存数据
            if (this.regions.length === 0) {
                // 如果没有缓存数据，创建一个基本的映射
                this.regions = [
                    { code: 'shenzhen', name: '深圳' }
                ];
                
                console.log('使用基本地区数据:', this.regions);
            }
            return this.regions;
        }
    },
    
    // 加载预算范围数据
    loadBudgets: async function() {
        try {
            // 从缓存中获取
            const cachedData = localStorage.getItem('budgetRanges');
            if (cachedData) {
                this.budgets = JSON.parse(cachedData);
                console.log('从缓存加载预算范围数据:', this.budgets.length);
            }
            
            // 无论是否有缓存，都尝试从服务器获取最新数据
            const response = await api.get('/budget-ranges');
            if (response && Array.isArray(response)) {
                this.budgets = response;
                // 更新缓存
                localStorage.setItem('budgetRanges', JSON.stringify(this.budgets));
                console.log('从服务器加载预算范围数据:', this.budgets.length);
            }
            
            // 初始化预算代码映射
            this.initBudgetCodeMap();
            
            return this.budgets;
        } catch (error) {
            console.warn('从服务器获取预算范围数据失败，使用缓存数据:', error);
            // 如果服务器获取失败，但缓存中有数据，则继续使用缓存数据
            if (this.budgets.length === 0) {
                // 如果没有缓存数据，创建一个基本的映射
                this.budgets = [
                    { id: 'budget-1', name: '5万以下' },
                    { id: 'budget-2', name: '5-20万' },
                    { id: 'budget-3', name: '20-50万' },
                    { id: 'budget-4', name: '50万以上' }
                ];
                
                // 初始化预算代码映射
                this.initBudgetCodeMap();
                
                console.log('使用基本预算范围数据:', this.budgets);
            }
            return this.budgets;
        }
    },
    
    // 加载回访方式数据
    loadVisitMethods: async function() {
        try {
            // 从缓存中获取
            const cachedData = localStorage.getItem('visitMethods');
            if (cachedData) {
                this.visitMethods = JSON.parse(cachedData);
                console.log('从缓存加载回访方式数据:', this.visitMethods.length);
            }
            
            // 无论是否有缓存，都尝试从服务器获取最新数据
            const response = await api.get('/visit-methods');
            if (response && Array.isArray(response)) {
                this.visitMethods = response;
                // 更新缓存
                localStorage.setItem('visitMethods', JSON.stringify(this.visitMethods));
                console.log('从服务器加载回访方式数据:', this.visitMethods.length);
            }
            return this.visitMethods;
        } catch (error) {
            console.warn('从服务器获取回访方式数据失败，使用缓存数据:', error);
            // 如果服务器获取失败，但缓存中有数据，则继续使用缓存数据
            if (this.visitMethods.length === 0) {
                // 如果没有缓存数据，创建一个基本的映射
                this.visitMethods = [
                    { name: '电话回访', description: '通过电话与客户沟通' },
                    { name: '上门拜访', description: '亲自到客户所在地拜访' },
                    { name: '视频会议', description: '通过网络视频与客户交流' },
                    { name: '邮件沟通', description: '通过电子邮件与客户沟通' },
                    { name: '微信沟通', description: '通过微信与客户沟通' }
                ];
                console.log('使用基本回访方式数据:', this.visitMethods);
            }
            return this.visitMethods;
        }
    },
    
    // 获取地区名称
    getRegionName: function(regionCode) {
        if (!regionCode) return '未填写';
        
        console.log('尝试获取地区名称，输入:', regionCode);
        console.log('当前可用地区数据:', this.regions);
        
        // 尝试多种匹配方式
        const region = this.regions.find(r => 
            // 匹配 code（不区分大小写）
            (r.code && r.code.toLowerCase() === regionCode.toString().toLowerCase()) ||
            // 匹配 id
            (r.id && r.id.toString() === regionCode.toString()) ||
            // 匹配 name
            (r.name && r.name === regionCode)
        );
        
        if (region) {
            console.log('找到匹配的地区:', region);
            return region.name;
        }
        
        console.log('未找到匹配的地区，返回原始值');
        return regionCode;
    },
    
    // 初始化预算代码映射表
    initBudgetCodeMap: function() {
        window.budgetCodeMap = window.budgetCodeMap || {};
        
        // 将budgets数组中的数据添加到映射中
        this.budgets.forEach(budget => {
            if (budget.id && budget.name) {
                window.budgetCodeMap[budget.id] = budget.name;
            }
        });
        
        console.log('预算代码映射表已初始化:', Object.keys(window.budgetCodeMap).length);
    },
    
    // 获取预算范围名称
    getBudgetName: function(budgetCode) {
        if (!budgetCode) return '未填写';
        
        // 首先尝试使用全局预算映射
        if (window.budgetCodeMap && window.budgetCodeMap[budgetCode]) {
            return window.budgetCodeMap[budgetCode];
        }
        
        // 然后从预设数据中查找对应的名称
        const budget = this.budgets.find(b => b.id === budgetCode);
        if (budget && budget.name) {
            return budget.name;
        }
        
        // 如果在预设数据中找不到，返回原始代码
        return budgetCode;
    },
    
    // 获取回访方式名称
    getVisitMethodName: function(methodCode) {
        if (!methodCode) return '未填写';
        
        // 直接从预设数据中查找对应的方式
        const method = this.visitMethods.find(m => m.name === methodCode);
        if (method) {
            return method.name;
        }
        
        // 如果在预设数据中找不到，返回原始代码
        return methodCode;
    }
};

// 在页面加载时初始化预设数据
document.addEventListener('DOMContentLoaded', function() {
    // 尝试加载所有预设数据
    app.presetData.loadAll()
        .then(success => {
            console.log('预设数据初始化:', success ? '成功' : '失败');
            
            // 在加载完成后触发一个事件，通知其他脚本
            const event = new CustomEvent('presetDataLoaded', { detail: { success } });
            document.dispatchEvent(event);
        })
        .catch(error => {
            console.error('预设数据初始化出错:', error);
        });
});