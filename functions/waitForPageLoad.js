/**
 * 等待页面加载，直到目标文本存在
 * @param {string[]} targetTexts - 需要检查的目标文本数组
 * @param {number} [maxAttempts] - 最大重试次数，默认为 3
 * @param {number} [delayScale] - 延迟系数，默认为 1
 * @param {boolean} [requireAll] - 是否要求所有目标文本都存在，默认为 true
 * @returns {boolean} - 返回是否成功加载页面
 */
function waitForPageLoad(targetTexts, maxAttempts, delayScale, requireAll) {
    // 设置默认值
    maxAttempts = maxAttempts || 3; // 如果未传入 maxAttempts，默认为 3
    delayScale = delayScale || 1; // 如果未传入 delayScale，默认为 1
    requireAll = requireAll !== undefined ? requireAll : true; // 如果未传入 requireAll，默认为 true

    if (!targetTexts || !Array.isArray(targetTexts) || targetTexts.length === 0) {
        console.error("目标文本不能为空，且必须是一个非空数组");
        return false;
    }

    let attempts = 0;
    while (attempts < maxAttempts) {
        console.verbose(`尝试第 ${attempts + 1} 次，检查目标文本: ${targetTexts.join(", ")}`);

        // 根据 requireAll 决定使用 every 还是 some
        let textsExist = requireAll
            ? targetTexts.every((targetText) => checkTextExists(targetText)) // 所有文本都存在
            : targetTexts.some((targetText) => checkTextExists(targetText)); // 任意一个文本存在

        if (textsExist) {
            console.verbose(requireAll ? "所有目标文本都存在，页面加载成功" : "部分目标文本存在，页面加载成功");
            return true;
        }

        attempts++;
        sleep(500 * delayScale); // 每次尝试后延迟，delayScale 可配置
    }

    console.log(`达到最大尝试次数 ${maxAttempts}，页面加载失败`);
    return false; // 达到最大尝试次数仍未加载成功
}

/**
 * 检查目标文本是否存在
 * @param {string} targetText - 目标文本
 * @returns {boolean} - 返回目标文本是否存在
 */
function checkTextExists(targetText) {
    const exists = text(targetText).exists();
    console.verbose(`查找文本: "${targetText}"，结果: ${exists ? "存在" : "不存在"}`);
    return exists;
}

module.exports = waitForPageLoad;