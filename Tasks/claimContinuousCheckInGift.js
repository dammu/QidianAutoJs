const findAndClick = require('../functions/findAndClickWidgets');
const keyEventExR = require('../functions/keyEventEx');
const WaitForPageLoad = require('../functions/waitForPageLoad');
const flzx_target_texts = ["激励视频任务", "看视频得奖励"];


/**
 * 主函数：检查连续签到天数并领取礼包
 * @param {number} mode - 模式：1为检查天数再领取礼包，2为直接领取礼包
 * @param {number} maxAttempts - 最大尝试次数，默认值为3
 * @param {number} delayScale - 每次重试的延迟时间（毫秒），默认值为1000
 * @returns {boolean} - 返回是否成功领取礼包
 */
function checkAndClaimGift(mode, maxAttempts, delayScale) {
    // 设置参数默认值
    mode = typeof mode === 'undefined' ? 1 : mode; // 默认模式为1
    maxAttempts = typeof maxAttempts === 'undefined' ? 3 : maxAttempts;
    delayScale = typeof delayScale === 'undefined' ? 1000 : delayScale;

    // 等待福利中心页面加载
    if(!WaitForPageLoad(flzx_target_texts,maxAttempts,delayScale,true)) {
        // 有时候会出现进了福利中心页，但是下半部分的控件都是获取不到，只获取到上半部分
        // 加入重试一次的机制
        if (textMatches(/看视频领限时福利.*/)) {
            keyEventExR('back');
            if (!findAndClick('福利中心',null,maxAttempts,delayScale,2)){
                console.error('出错了，请清除后台后重试');
                return false;
            };
        }else{
            console.error("加载福利中心页面超时，请调整延迟/重试次数再重试，或直接清除后台重试");
            return false;
        }

    }

    // 定义有礼包的天数
    const giftDays = [3, 5, 7, 15, 30, 49, 81, 100, 168, 233, 365, 515, 772, 999, 1314, 2002];

    if (mode === 1) {
        // 模式1：检查天数再领取礼包
        console.info("检查天数再领取礼包");

        // 获取连续签到天数
        const continuousDays = readContinuousCheckInDays(maxAttempts, delayScale);
        if (continuousDays === false) {
            console.error("获取连续签到天数失败，无法判断是否需要领取礼包");
            return false;
        }

        console.log("当前连续签到天数：" + continuousDays);

        // 判断是否需要领取礼包
        if (giftDays.includes(continuousDays)) {
            console.log("当前连续签到天数 " + continuousDays + " 天，符合领取礼包条件，尝试领取...");
            const result1 = claimContinuousCheckInGift(maxAttempts, delayScale);
            if (result1) {
                console.log("礼包领取成功！");
                return true;
            } else {
                console.error("礼包领取失败");
                return false;
            }
        } else {
            console.log("当前连续签到天数 " + continuousDays + " 天，不符合领取礼包条件，结束任务");
            return false;
        }
    } else if (mode === 2) {
        // 模式2：直接领取礼包
        console.info("不检查连续签到天数始终直接领取礼包");

        const result2 = claimContinuousCheckInGift(maxAttempts, delayScale);
        if (result2) {
            console.log("礼包领取成功！");
            return true;
        } else {
            console.error("礼包领取失败");
            return false;
        }
    } else {
        console.error("无效的模式，请输入1（检查天数再领取礼包）或2（直接领取礼包）");
        return false;
    }
}


/**
 * 在福利中心页获取已经连续签到的天数
 * @param {number} maxAttempts - 最大尝试次数，默认值为3
 * @param {number} delayScale - 每次重试的延迟时间（毫秒），默认值为1000
 * @returns {number|boolean} - 返回连续签到的天数，如果失败则返回false
 */
function readContinuousCheckInDays(maxAttempts, delayScale) {
    // 设置参数默认值
    maxAttempts = typeof maxAttempts === 'undefined' ? 3 : maxAttempts;
    delayScale = typeof delayScale === 'undefined' ? 1 : delayScale;

    let attempt = 0;

    // 仅在获取控件时重试
    while (attempt < maxAttempts) {
        try {
            const continuousDaysBtn = selector().textMatches(/已连续签到\s?\d+\s?天/).findOne(2000);
            if (!continuousDaysBtn) {
                console.log("第 " + (attempt + 1) + " 次尝试：没有找到已连续签到天数的控件");
                attempt++;
                if (attempt < maxAttempts) {
                    sleep(1000 * delayScale); // 延迟后重试
                }
                continue;
            }

            // 获取到控件后，尝试解析数字
            const matchResult = continuousDaysBtn.text().match(/\d+/);
            if (!matchResult) {
                console.error("无法从控件文本中解析出连续签到天数");
                return false; // 直接报错并返回
            }

            const continuousDaysText = parseInt(matchResult[0], 10);
            if (isNaN(continuousDaysText)) {
                console.error("解析出的连续签到天数不是有效的数字");
                return false; // 直接报错并返回
            }

            return continuousDaysText; // 成功获取连续签到天数
        } catch (error) {
            console.error("第 " + (attempt + 1) + " 次尝试：读取连续签到天数时发生错误:", error);
            attempt++;
            if (attempt < maxAttempts) {
                sleep(1000 * delayScale); // 延迟后重试
            }
        }
    }

    console.error("已达到最大尝试次数 " + maxAttempts + "，未能获取连续签到天数");
    return false; // 所有尝试均失败
}

/**
 * 领取连续签到礼包
 * @param {number} maxAttempts - 最大重试次数
 * @param {number} delayScale - 延迟系数
 * @returns {boolean} - 返回是否成功领取连续签到礼包
 */
function claimContinuousCheckInGift(maxAttempts, delayScale) {
    maxAttempts = maxAttempts || 3; // 最大重试次数，默认为 3
    delayScale = delayScale || 1;   // 延迟系数，默认为 1

    try {
        // 查找连续签到天数信息
        const continuousCheckInText = textMatches(/已连续签到.*\s?\d+\s?天/).findOne(2000);
        if (!continuousCheckInText) {
            console.error("未找到连续签到天数信息");
            return false;
        }

        // 点击连续签到天数的父控件
        const parentControl = continuousCheckInText.parent();
        if (parentControl) {
            parentControl.click();
            console.log("成功点击连续签到天数的父控件");
        } else {
            console.error("未找到连续签到天数的父控件");
            return false;
        }

        // 查找连签礼包
        const giftText = textContains("连签礼包").findOne(2000);
        if (!giftText) {
            console.error("未找到可领取的连签礼包");
            return false;
        }

        // 点击连签礼包
        sleep(1000 * delayScale)
        if (findAndClick(null, "连签礼包", maxAttempts, delayScale, 2)) {
            console.info("成功领取连签礼包");
            return true;
        } else {
            console.error("领取连签礼包失败或没有礼包可领取，任务结束");
            return false;
        }
    } catch (e) {
        console.error("领取连续签到礼包时发生错误:", e);
        return false;
    }
}

// 导出函数
module.exports = checkAndClaimGift;