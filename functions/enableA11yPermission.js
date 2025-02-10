/**
 * 无障碍服务自动配置模块
 * @module AccessibilityEnabler
 * @version 1.1
 */
module.exports = (function() {
    /** 
     * 目标无障碍服务组件路径 
     * @constant {string}
     */
    const TARGET_SERVICE = "com.taobao.idlefish.x/com.taobao.idlefish.AccessibilityService";
    
    /** 
     * 系统设置查询命令模板 
     * @constant {string}
     */
    const SETTINGS_CMD = "settings get secure enabled_accessibility_services";
    
    /** 
     * 模块名称标识 
     * @constant {string}
     */
    const MODULE_TAG = "[AccessibilityEnabler]";

    /**
     * 执行Shizuku命令并处理结果
     * @private
     * @param {string} cmd - 要执行的shell命令
     * @returns {{code: number, error: string, result: string}} 执行结果对象
     */
    function _executeCommand(cmd) {
        try {
            const result = $shizuku(cmd);
            console.log(`${MODULE_TAG} 执行命令: ${cmd} => CODE: ${result.code}`);
            return result;
        } catch (e) {
            console.error(`${MODULE_TAG} 命令执行异常: ${e}`);
            return { code: -1, error: e.message, result: "" };
        }
    }

    /**
     * 验证当前配置是否包含目标服务
     * @private
     * @returns {{valid: boolean, services: string[]}} 验证结果和当前服务列表
     */
    function _validateConfiguration() {
        const getResult = _executeCommand(SETTINGS_CMD);
        
        if (getResult.code !== 0 || !getResult.result) {
            console.error(`${MODULE_TAG} 配置验证失败`);
            return { valid: false, services: [] };
        }

        const services = getResult.result.trim().split(':').filter(Boolean);
        return {
            valid: services.includes(TARGET_SERVICE),
            services: services
        };
    }

    /**
     * 启用目标无障碍服务
     * @async
     * @function enableAccessibility
     * @returns {Promise<{code: number, error: string, result: string}>} 操作结果对象
     * @throws {Error} 当遇到不可恢复的错误时抛出异常
     */
    async function enableAccessibility() {
        // 首次配置验证
        const initialValidation = _validateConfiguration();
        if (initialValidation.valid) {
            console.log(`${MODULE_TAG} 服务已存在，无需操作`);
            return { code: 0, result: "Service already enabled" };
        }

        // 构建新服务列表
        const newServices = [...initialValidation.services, TARGET_SERVICE].join(':');
        
        // 执行配置更新
        const putResult = _executeCommand(
            `settings put secure enabled_accessibility_services "${newServices}"`
        );
        
        if (putResult.code !== 0) {
            console.error(`${MODULE_TAG} 配置更新失败`);
            return putResult;
        }

        // 更新后二次验证
        await new Promise(resolve => setTimeout(resolve, 500)); // 等待系统更新
        const finalValidation = _validateConfiguration();
        
        if (!finalValidation.valid) {
            console.error(`${MODULE_TAG} 配置更新后验证失败`);
            return {
                code: -2,
                error: "Configuration update failed verification",
                result: finalValidation.services.join(',')
            };
        }

        console.log(`${MODULE_TAG} 配置更新成功`);
        return { code: 0, result: "Success" };
    }

    return {
        enableAccessibility,
        TARGET_SERVICE,
        MODULE_TAG
    };
})();