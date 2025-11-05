/**
 * Storage API Polyfill
 * 替换已弃用的window.webkitStorageInfo API
 */

// 检查是否使用了已弃用的API
// 使用in运算符检查属性是否存在，而不是直接访问属性值
if ('webkitStorageInfo' in window) {
    // 使用info级别消息而不是警告，减少对用户的干扰
    console.info('[Storage Polyfill] 已加载替代方案以处理已弃用的webkitStorageInfo API');
    
    // 创建兼容对象
    const storageInfoPolyfill = {
        // 替代旧API的方法
        queryUsageAndQuota: function(type, usageCallback, errorCallback) {
            try {
                if (navigator.webkitTemporaryStorage) {
                    navigator.webkitTemporaryStorage.queryUsageAndQuota(usageCallback, errorCallback);
                } else if (navigator.webkitPersistentStorage) {
                    navigator.webkitPersistentStorage.queryUsageAndQuota(usageCallback, errorCallback);
                } else {
                    // 如果新API也不可用，返回一个合理的默认值
                    usageCallback(0, 50 * 1024 * 1024); // 默认配额50MB
                }
            } catch (e) {
                if (errorCallback) {
                    errorCallback(e);
                } else {
                    console.error('Storage API错误:', e);
                }
            }
        },
        
        // 其他可能需要的属性和方法
        TEMPORARY: 0,
        PERSISTENT: 1
    };
    
    // 替换已弃用的API
    try {
        // 静默替换
        Object.defineProperty(window, 'webkitStorageInfo', {
            get: function() {
                return storageInfoPolyfill;
            },
            configurable: true
        });
    } catch (e) {
        console.error('无法替换webkitStorageInfo:', e);
    }
} 