const WaitForPageLoad = require("./waitForPageLoad");

/**
 * 启动指定应用并等待页面加载完成
 * @param {string} packageName - 应用的包名
 * @param {string[]} [targetTexts] - 需要检查的目标文本数组
 * @param {number} [maxAttempts] - 最大重试次数，默认为 3
 * @param {number} [delayScale] - 延迟系数，默认为 1
 * @param {boolean} [requireAll] - 是否要求所有目标文本都存在，默认为 true
 * @param {string} [activityName] - 需要启动的 Activity 名称
 * @param {object} [intent] - 动态构建的 Intent 对象
 * @returns {boolean} - 返回是否成功启动应用并加载页面
 */
function startApp(
    packageName,
    targetTexts,
    maxAttempts,
    delayScale,
    requireAll,
    activityName,
    intent
) {
    // 设置默认值
    maxAttempts = maxAttempts || 3; // 如果未传入 maxAttempts，默认为 3
    delayScale = delayScale || 1; // 如果未传入 delayScale，默认为 1
    requireAll = requireAll !== undefined ? requireAll : true; // 如果未传入 requireAll，默认为 true

    // 参数校验
    if (!packageName) {
        console.error("包名不能为空");
        return false;
    }
    if (targetTexts && (!Array.isArray(targetTexts) || targetTexts.length === 0)) {
        console.error("目标文本必须是一个非空数组");
        return false;
    }

    try {
        if (activityName) {
            // 如果传入了 activityName，则直接使用 app.startActivity 启动
            console.log(`正在尝试使用 startActivity 启动应用: ${packageName}, Activity: ${activityName}`);
            app.startActivity({
                action: "VIEW",
                className: activityName,
                packageName: packageName,
            });
        } else if (intent) {
            // 如果传入了 intent 对象，则使用构建的 intent 启动
            console.log(`正在尝试使用动态 Intent 启动应用: ${packageName}`);
            app.startActivity(intent);
        } else {
            // 否则使用 launch 启动
            console.log(`正在尝试使用 launch 启动应用: ${packageName}`);
            launch(packageName);
        }
        console.log("应用启动成功");
    } catch (e) {
        console.error("启动应用失败:", e);
        return false;
    }

    // 如果未传入 targetTexts，则直接返回成功
    if (!targetTexts) {
        console.log("未传入目标文本，跳过页面加载检查");
        return true;
    }

    // 等待页面加载
    console.log("等待页面加载...");
    const isPageLoaded = WaitForPageLoad(targetTexts, maxAttempts, delayScale, requireAll);

    if (isPageLoaded) {
        console.log("页面加载成功");
        return true;
    } else {
        console.error("页面加载失败");
        return false;
    }
}

module.exports = startApp;