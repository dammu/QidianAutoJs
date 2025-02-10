const Config = require('../config');
const keyEventExR = require('../functions/keyEventEx');
const WaitForPageLoaded = require('../functions/waitForPageLoad')
const FLZX_TARGET_TEXT_USEINPLAYVIDEOAD = ['知道了', '激励视频任务', '积分商城']

// 公共参数记录
let lastAdLeft = Config.AdExitCorX || null;
let lastAdCenterY = Config.AdExitCorY || null;
let exitFinderThread = null;

// 主入口函数
function handleVideoAd() {
    try {
        // 初始化坐标
        if (Config.AdExitCorX && Config.AdExitCorY) {
            lastAdLeft = Config.AdExitCorX;
            lastAdCenterY = Config.AdExitCorY;
            console.log(`使用历史坐标：(${lastAdLeft}, ${lastAdCenterY})`);
        }
        
        let rewardWidget = safelyFindRewardWidget();
        if (rewardWidget) {
            console.log("检测到可领取奖励型广告");
            startExitFinderThread(rewardWidget);

            if (isLongTypeAd(rewardWidget)) {
                handleLongAd(rewardWidget);
            } else {
                handleShortAd();
            }
        } else {
            console.log("非常规广告，按兜底方案处理");
            handleUnknownAd();
        }
    } catch (e) {
        console.error("处理异常:", e);
        // emergencyExit();
    } finally {
        stopExitFinderThread();
    }
}

// 启动退出坐标查找线程
function startExitFinderThread(initialWidget) {
    exitFinderThread = threads.start(function () {
        let lastX = null;
        let lastY = null;
        let stableCount = 0; // 坐标稳定计数器
        const STABLE_THRESHOLD = 3; // 连续3次相同认为稳定
        
        while (true) {
            try {
                let widget = textContains("可获得奖励").findOne(500);
                if (!widget) {
                    console.log('未找到倒计时控件');
                    continue;
                }
                
                let bounds = widget.bounds();
                let currentX = bounds.left;
                let currentY = bounds.centerY();
                
                // 判断坐标是否变化
                if (currentX === lastX && currentY === lastY) {
                    stableCount++;
                } else {
                    stableCount = 0; // 重置计数器
                }
                
                // 更新记录值
                lastX = currentX;
                lastY = currentY;
                
                // 如果坐标稳定
                if (stableCount >= STABLE_THRESHOLD) {
                    console.log(`坐标已稳定：(${currentX}, ${currentY})`);
                    lastAdLeft = Config.AdExitCorX = currentX;
                    lastAdCenterY = Config.AdExitCorY = currentY;
                    
                    // 更新内存配置
                    Config.AdExitCorX = lastAdLeft;
                    Config.AdExitCorY = lastAdCenterY;
                    
                    // 更新配置文件
                    updateConfig(lastAdLeft, lastAdCenterY);
                    break;
                }
                
                // 调试信息
                console.log(`当前坐标：(${currentX}, ${currentY}) 稳定次数：${stableCount}`);
                
            } catch (e) {
                // 忽略查找超时异常
            }
            sleep(800);
        }
        
        console.log('坐标采集线程退出');
    });
}

// 停止坐标查找线程
function stopExitFinderThread() {
    if (exitFinderThread && exitFinderThread.isAlive()) {
        exitFinderThread.interrupt();
    }
}

// 处理长广告（>15s）
function handleLongAd(initialWidget) {
    const countdownRegex = /(\d+)秒/;
    let timeout = 30; // 最大等待秒数

    while (timeout-- > 0) {
        try {
            let currentWidget = textContains("可获得奖励").findOne(1000);
            let match = currentWidget.text().match(countdownRegex);

            if (match && parseInt(match[1]) === 0) {
                console.log("倒计时结束");
                sleep(1000); // 等待奖励生效
                break;
            }
            console.log(`还有${match[1]}秒`)
        } catch (e) {
            break;
        }
        sleep(1000);
    }

    smartClickExit();
}

// 处理短广告（<=15s）
function handleShortAd() {
    console.log("等待短广告播放完毕...");
    let waited = 0;
    while (waited < 30) {
        // 检测原控件是否消失
        if (!textContains("观看完视频").exists()) {
            break;
        }
        sleep(1000);
        waited++;
    }
    smartClickExit();
}

// 智能点击退出（多策略）
function smartClickExit() {
    // 优先使用记录的坐标
    if (lastAdLeft !== null && lastAdCenterY !== null) {
        let x = lastAdLeft / 2;
        let y = lastAdCenterY;
        console.log(`尝试坐标点击: (${x}, ${y})`);
        performClick(x, y);
    }

    // 二次检测跳过按钮
    if (isStillInAd()) {
        let skipBtn = findSkipButton();
        if (skipBtn) {
            console.log("找到跳过按钮");
            skipBtn.click();
            sleep(1000);
        }
    }

    // 最终保障机制
    if (isStillInAd()) {
        console.log("使用组合退出策略");
        if (!keyEventExR('back')) {
            performClick(152, 252);
        }
    }
}

// 查找跳过按钮
function findSkipButton() {
    return textMatches(/跳过(广告|视频)/).findOne(1000);
}

// 增强型点击方法
function performClick(x, y) {
    if (Config.UseShizukuClick) {
        runtimeLog("使用Shizuku点击");
        $shizuku(`input tap ${x} ${y}`);
    } else {
        click(x, y);
    }
    sleep(500); // 等待点击生效
}

// 处理未知类型广告
function handleUnknownAd() {
    const FIXED_WAIT = 20000; // 固定等待20秒
    console.log(`等待${FIXED_WAIT / 1000}秒...`);
    sleep(FIXED_WAIT);

    // 尝试所有退出方式
    [
        () => {
            var btn = findSkipButton();
            if (btn) { btn.click(); }
        },
        () => keyEventExR('back'),
        () => performClick(device.width - 152, 252)
    ].some(fn => {
        try {
            fn();
            return !isStillInAd();
        } catch (e) {
            return false;
        }
    });

}

// 安全查找奖励控件
function safelyFindRewardWidget() {
    return textContains("可获得奖励").findOne(2000);
}

// 判断广告类型
function isLongTypeAd(widget) {
    return widget.text().includes("秒后");
}

function isStillInAd() {
    if (WaitForPageLoaded(FLZX_TARGET_TEXT_USEINPLAYVIDEOAD, Config.MaxAttempts, Config.DelayScale, false)) {
        return false;
    }
    return true;
}

const configPath = './config.js';

// 配置文件写入函数
function updateConfig(newX, newY) {
    try {
        // 读取现有配置
        let configContent = files.read(configPath, 'utf-8');
        
        // 更新坐标值
        configContent = configContent.replace(
            /AdExitCorX:\s*\d+/,
            `AdExitCorX:  ${newX}`
        ).replace(
            /AdExitCorY:\s*\d+/,
            `AdExitCorY:  ${newY}`
        );
        
        // 写入更新后的配置
        files.write(configPath, configContent, 'utf-8');
        console.log(`配置文件已更新：AdExitCorX=${newX}, AdExitCorY=${newY}`);
    } catch (e) {
        console.error('更新配置文件失败:', e);
    }
}

module.exports = handleVideoAd;