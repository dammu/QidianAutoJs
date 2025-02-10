/**
 * 使用shizuku结束指定包名的应用
 * @param {string} packageName - 应用的包名
 * @param {number} [maxAttempts] - 最大重试次数，默认为 3
 * @param {boolean} [forceStop] - 是否强制结束应用，默认为 true
 * @returns {boolean} - 返回是否成功结束应用
 */
function killApp(packageName, maxAttempts, forceStop) {
    // 设置默认值
    maxAttempts = maxAttempts || 3; // 如果未传入 maxAttempts，默认为 3
    forceStop = forceStop !== undefined ? forceStop : true; // 如果未传入 forceStop，默认为 true

    if (!packageName) {
        console.error("包名不能为空");
        return false;
    }

    const command = forceStop
        ? `am force-stop ${packageName}` // 强制结束
        : `am kill ${packageName}`; // 普通结束

    let attempts = 0;
    while (attempts < maxAttempts) {
        // 执行命令
        let shellResult = $shizuku(command);

        // 检查执行结果
        if (shellResult.code === 0 && !shellResult.error) {
            console.log(`结束应用 ${packageName} 成功`);
            return true;
        } else {
            attempts++;
            console.error(`结束应用 ${packageName} 失败，重试中... (${attempts}/${maxAttempts})`);
            console.error(`错误码: ${shellResult.code}`);
            console.error(`错误信息: ${shellResult.error || "无"}`);
            console.error(`命令输出: ${shellResult.result || "无"}`);
            sleep(1000); // 延迟 1 秒后重试
        }
    }

    console.error(`结束应用 ${packageName} 失败，已达到最大重试次数`);
    return false;
}

module.exports = killApp;