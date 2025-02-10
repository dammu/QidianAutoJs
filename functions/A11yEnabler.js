function a11yEnabler() {
    const TARGET_SERVICE = "com.taobao.idlefish.x/com.taobao.idlefish.AccessibilityService";
    const SETTINGS_CMD = "settings get secure enabled_accessibility_services";

    function _shizukuShell(cmd) {
        try {
            const result = $shizuku(cmd);
            console.log(`[CMD] ${cmd} => CODE: ${result.code}${result.error ? ` | ERROR: ${result.error}` : ''}`);
            return result;
        } catch (e) {
            console.error(`[ERR] 命令执行异常: ${e}`);
            return { code: -1, error: e.message, result: "" };
        }
    }

    function _validateConfiguration() {
        console.log("[INFO] 正在验证无障碍服务配置...");
        const getResult = _shizukuShell(SETTINGS_CMD);

        // 同时判断错误码和错误信息
        if (getResult.code !== 0 || getResult.error) {
            console.error("[ERR] 获取服务配置失败");
            return { valid: false, services: [] };
        }

        const services = (getResult.result || "").trim().split(':').filter(Boolean);
        const isValid = services.includes(TARGET_SERVICE);
        console.log(`[INFO] 目标服务${isValid ? '已' : '未'}启用`);
        return { valid: isValid, services };
    }

    function enableA11y() {
        console.log("[INFO] 开始启用无障碍服务流程");
        
        // 初始配置检查
        const { valid, services } = _validateConfiguration();
        if (valid) {
            console.log("[INFO] 目标服务已存在，跳过操作");
            return { code: 0, result: "Service already enabled" };
        }

        // 使用 concat 构建新服务列表
        const newServices = services.concat(TARGET_SERVICE).join(':');
        console.log(`[DEBUG] 新服务列表: ${newServices}`);

        // 更新系统设置（去掉双引号）
        const putResult = _shizukuShell(
            `settings put secure enabled_accessibility_services "${newServices}"`
        );
        
        // 同时判断错误码和错误信息
        if (putResult.code !== 0 || putResult.error) {
            console.error("[ERR] 服务配置更新失败");
            return { 
                code: putResult.code || -1,
                error: `更新失败: ${putResult.error || '未知错误'}`,
                result: putResult.result
            };
        }

        // 二次配置验证
        console.log("[INFO] 正在验证更新结果...");
        const updatedValidation = _validateConfiguration();
        if (!updatedValidation.valid) {
            console.error("[ERR] 配置更新后验证失败");
            return {
                code: -2,
                error: "配置更新未生效",
                result: updatedValidation.services
            };
        }

        console.log("[SUCCESS] 无障碍服务已成功启用");
        return { code: 0, result: "Service enabled successfully" };
    }

    return enableA11y();
}

module.exports = a11yEnabler;