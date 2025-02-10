const ConfigR = require("./config.js");
const MAX_ATTEMPTS = ConfigR.MaxAttempts;
const DELAY_SCALE = ConfigR.DelayScale;
const USE_SHIZUKU_KILL_APP = ConfigR.UseShizukuKillApp;
const EXCHANGE_FRAGMENT = ConfigR.ExchangeFragment;
const USE_SHIZUKU_ENABLE_A11Y = ConfigR.UseShizukuEnableA11y;
const MAINGROUP_TARGET_TEXTS = ["书架", "精选", "发现"];
const FLZX_TARGET_TEXTS = ["激励视频任务", "看视频得奖励"];
const CHECKIN_BUTTON_ID = "btnCheckIn"; // 签到按钮的ID
const SIGNED_IN_TEXT = "领福利"; // 已签到的文本
const UNSIGNED_IN_TEXT = "签到"; // 未签到的文本
const TASK_CONSIFG = ConfigR.TaskConfig;



// ===============================================================
// 功能函数导入 starts

// shizuku 启用无障碍
const A11yEnabler = require("./functions/a11yEnabler");

// 结束起点APP
const KillApp = require("./functions/killAppByShizuku");
// killApp("com.qidian.QDReader");

// 启动起点APP
const StartApp = require("./functions/startApp");
// toMainGroup("com.qidian.QDReader",TARGET_TEXTS,MAX_ATTEMPTS,DELAY_SCALE);

// 等待页面加载
const WaitForPageLoadR = require("./functions/waitForPageLoad");

// 查找并点击控件
const FindAndClick = require("./functions/findAndClickWidgets.js");
// checkIn(CHECKIN_BUTTON_ID,MAX_ATTEMPTS,DELAY_SCALE)

// 扩展click函数
const ClickEx = require("./functions/clickEx");

// 按键事件扩展
const KeyEventEx = require("./functions/keyEventEx.js");


// 功能函数导入 ends
// ===============================================================


// ===============================================================
// 主逻辑

console.show();
console.clear();
console.setTitle("1.0")
console.setPosition(0, device.height / 1.6)
console.setSize(device.width / 1.6, device.width / 1.6)

// 启用无障碍权限
if (!auto.service) {
    if (USE_SHIZUKU_ENABLE_A11Y) {
        try {
            const result = A11yEnabler();
            if (result.code !== 0 || result.error) {
                console.error(`启用无障碍出错，错误信息：${result.error}`);
                console.error("请确保shizuku正常，再重新尝试\n脚本将退出")
                engines.stopAll();
                sleep(1000 * DELAY_SCALE);
            };
        } catch (e) {
            console.error(`使用shizuku启用无障碍权限出错，可能是没有shizuku权限，错误信息：${e.message}`);
            engines.stopAll();
            sleep(1000 * DELAY_SCALE);
        }
    } else {
        auto.waitFor();
    }
}

console.log("请在运行脚本前手动结束起点app避免各种问题");
console.log("后台划掉起点app即可，然后关闭再重新运行脚本");
console.log("建议使用shizuku,将自动结束起点app");


function restartQidian() {
    killQidian();
    sleep(500 * DELAY_SCALE);
    toQidianMainGroup();
}

restartQidian();

// 签到
// 先查找签到按钮进行签到，如果没找到则查找签到完成的文本，找到则说明已签到，直接进入福利中心

/**
 * 签到流程
 * 直接进入福利中心，默认会签到，现在不用这部分的首页签到逻辑，直接进入福利中心
 */
function checkInProcess() {
    let checkInBtn = selector().id(CHECKIN_BUTTON_ID).findOne(2000);
    let isSignedIn = true;

    // 1. 通过 ID 查找签到按钮
    if (checkInBtn) {
        console.log("通过 ID 找到签到按钮");
        // 根据按钮文本判断是否已签到
        sleep(1000 * ConfigR.DelayScale);
        const buttonText = checkInBtn.findOne(className("TextView")).text();
        // 查找 TextView 如果 AutoJS 有报错，可改为使用文本控件的id
        // const buttonText = checkInBtn.findOne(id("button_text_id")).text();
        // 进入主页后，签到按钮默认文本为“签到”，获取到服务器信息后才刷新
        // 这里操作太快就会出现获取到默认的“签到”后按钮文本才刷新
        // 又因为只要进入福利中心，就会默认签到，所以点击签到按钮这个环节也没那么有意义
        // 所以不纠结雕琢这一部分，固定延迟一会儿就好，不考虑不同配置不同网速的加速问题
        // 后续考虑直接去掉签到环节，直接进入福利中心
        if (buttonText === UNSIGNED_IN_TEXT) {
            console.log("当前未签到，执行签到操作");
            isSignedIn = false;
        } else if (buttonText === SIGNED_IN_TEXT) {
            console.log("当前已签到");
            isSignedIn = true;
        } else {
            console.error("签到按钮文本未知，无法判断签到状态");
            return false; // 跳过此流程
        }
    } else {
        console.log("未能通过 ID 找到签到按钮，尝试通过文本查找");
        console.info(checkInBtn);
        // 2. 通过文本查找签到状态
        if (selector().text(SIGNED_IN_TEXT).exists()) {
            console.log("通过文本找到已签到状态");
            isSignedIn = true;
        } else if (selector().text(UNSIGNED_IN_TEXT).exists()) {
            console.log("通过文本找到未签到状态");
            isSignedIn = false;
        } else {
            console.error("未找到签到按钮或签到状态文本，跳过此流程");
            return false; // 跳过此流程
        }

    }

    // 3. 根据签到状态执行后续操作
    if (!isSignedIn) {
        console.log("执行签到操作");
        // const bottonCheckIn = checkInBtn;
        if (!ClickEx(checkInBtn)) {
            console.error("点击签到按钮失败")
            return false;
        }
        console.log("签到成功");
        handleCheckInSuccess();
        return true;
    } else {
        console.log("已签到，跳过签到流程，进入福利中心");
        enterWelfareCenterByMe();
        return true;
    }


}

// 处理签到完成弹出窗口
function handleCheckInSuccess() {
    readCheckInInfo();
    // 判断是否是周日（通过查找“周六已签”文本）
    if (text("周六已签").exists() && EXCHANGE_FRAGMENT) {
        console.info("当前是周日，进入兑换章节卡流程");
        // 查找“周日兑换章节”控件
        // const exchangeButton = text("积攒碎片可在本周日兑换").findOne(2000).parent().parent();
        // 这是点击周日兑换章节的地方的，下面是另一种点击“去兑换”的按钮，应该是更稳定的
        // 查找“去兑换”按钮
        console.log("查找点击 去兑换 按钮");
        FindAndClick("btnToExchange", null, MAX_ATTEMPTS, DELAY_SCALE);
        if (!exchangeFragment()) {  // 进入兑换章节卡流程
            console.error("兑换章节卡出错，脚本将退出，请清除后台后重试");
            console.error("如果重复出错请配置关闭章节卡兑换暂时不用这功能");
            engines.stopAll();
            sleep(1000 * DELAY_SCALE);
        };
    } else {
        console.info("当前不是周日，关闭弹窗并进入福利中心");
        if (!closeCheckInPopupAndEnterWelfareCenter()) {  // 关闭弹窗并进入福利中心
            console.error("关闭签到成功弹窗进入福利中心出错，脚本将退出，请清楚后台后重试");
            engines.stopAll();
            sleep(1000 * DELAY_SCALE);
        };
    }
}


// 执行签到流程
// if (!checkInProcess()) {
//     console.info("查找签到按钮失败，将跳过签到，进入福利中心");
//     enterWelfareCenterByMe();
// }

// 直接进入福利中心，是默认触发签到的
if (!enterWelfareCenterByMe()) {
    console.error('进入福利中心失败，脚本将退出，请清除后台后重试');
    engines.stopAll();
    sleep(1000 * DELAY_SCALE);
}


// 查看当前是否是周日
// 直接进入福利中心的检查是否周日是否需要兑换章节卡
function exchangeFragmentIfIsSunday() {
    if (!WaitForPageLoadR(FLZX_TARGET_TEXTS, MAX_ATTEMPTS, DELAY_SCALE, true)) {
        // 有时候会出现进了福利中心页，但是下半部分的控件都是获取不到，只获取到上半部分
        // 加入重试一次的机制
        if (textMatches(/看视频领限时福利.*/)) {
            KeyEventEx('back');
            sleep(500 * ConfigR.DelayScale);
            if (!FindAndClick('福利中心', null, maxAttempts, delayScale, 2)) {
                console.error('出错了，请清除后台后重试');
                return false;
            };
        } else {
            console.error("加载福利中心页面超时，请调整延迟/重试次数再重试，或直接清除后台重试");
            engines.stopAll();
            sleep(1000 * DELAY_SCALE); 
            return false;
        }

    };
    let isSunday = false;
    let sundayBtn = selector().textMatches(/积攒碎片兑章节卡.*/).findOne(2000);
    if (!sundayBtn) {
        console.info("找不到周日兑章节卡的地方，可能是已经签过到被折叠，或者起点有更新");
        return false;
    }
    if (sundayBtn
        .parent().parent()
        .parent().parent()
        .child(5).child(1)
        .child(0).text() === '已签') isSunday = true;
    if (isSunday && EXCHANGE_FRAGMENT) {
        sundayBtn.parent().parent().parent().click();
        if (!exchangeFragment()) {  // 进入兑换章节卡流程
            // 需要过人机验证，暂不实现
            console.error('兑换章节卡出错，请保留报错信息');
            console.error('现在将重启起点app进入福利中心继续任务');
            restartQidianAndEnterWelfarecenter();
        };
        return true;
    }
    console.log('当前不是周日或者配置不进行章节卡兑换');
    return false;
}

function restartQidianAndEnterWelfarecenter() {
    restartQidian();
    if (!enterWelfareCenterByMe()) {
        console.error('进入福利中心失败，脚本将退出，请清除后台后重试');
        engines.stopAll();
        sleep(1000 * DELAY_SCALE);
    }
}


// 进入福利中心后，执行不同的任务

// 1. 连签礼包
function claimContinuousCheckInGift() {
    const claimContinuousCheckInGiftByCheckedInDays = ConfigR.claimContinuousCheckInGiftByCheckedInDays;
    const CLAIM_MODE = claimContinuousCheckInGiftByCheckedInDays ? 1 : 2;
    const ClaimContinuousCheckInGift = require("./Tasks/claimContinuousCheckInGift");
    ClaimContinuousCheckInGift(CLAIM_MODE, MAX_ATTEMPTS, DELAY_SCALE);
    if (!CLAIM_MODE) KeyEventEx("back"); // 返回福利中心主页
}
if (TASK_CONSIFG.claimContinuousCheckInGift) {
    claimContinuousCheckInGift();
}

// 2. 看视频得奖励，直接干所有看视频的奖励，所以如果有需要可以定时运行脚本领取每小时的奖励
function videoMissions() {
    const PlayVideoAd = require("./Tasks/playVideoAd");
    while (true) {
        let btn = text('看视频').findOne(2000);
        if (!btn) {
            console.info('已经没有看视频任务，退出')
            break;
        }
        if (!btn.click()) {
            console.error('点击“看视频”出错，请清除后台后重试\n脚本将退出');
            engines.stopAll();
            sleep(1000 * DELAY_SCALE); 
            break;
        }
        PlayVideoAd();
        let confirmBtn = selector().text('知道了').findOne(2000);
        if (confirmBtn) confirmBtn.click();
        // 太快有可能看视频的按钮还没被刷新为已领取就再次被点击，稍微的等一下
        sleep(500 * DELAY_SCALE);
    }
}
videoMissions();

// 3. 周日兑换章节卡
// 大概率触发人机验证，所以把这一步放到最后，如果触发了人机验证，请自行操作
exchangeFragmentIfIsSunday();


// 结束脚本
console.info('===================');
console.info('脚本结束，5s后退出')
for (let i = 5; i > 0; i--) {
    console.info(i);
    sleep(1000);
}
console.hide();
engines.stopAll();
sleep(1000 * DELAY_SCALE);

// 主逻辑 ends
// ===============================================================


// 结束起点APP，如果配置了使用Shizuku，则使用Shizuku结束APP，否则打印输出提示自行结束APP
function killQidian() {
    if (USE_SHIZUKU_KILL_APP) {
        KillApp("com.qidian.QDReader");
    } else {
        console.log("没有配置使用shizuku，需要手动结束起点app")
        console.log("倒计时5s，请在倒计时结束前划掉起点app后台");
        console.log("倒计时结束后请勿再操作手机");
        // log 输出一个5s的倒计时
        for (let i = 5; i > 0; i--) {
            console.log(i);
            sleep(1000);
        }
        console.log("开始脚本");
    }
}

// 启动起点APP，进入书架页面
function toQidianMainGroup() {
    console.log("启动起点APP，进入书架页面");
    function startQidian() {
        if (USE_SHIZUKU_KILL_APP) {
            if (!StartApp("com.qidian.QDReader", undefined, MAX_ATTEMPTS, DELAY_SCALE)) {
                console.error("启动起点APP失败, 脚本将退出，请清除后台后重试");
                engines.stopAll();
                sleep(1000 * DELAY_SCALE);
            }
        } else {
            if (!StartApp("com.qidian.QDReader", MAINGROUP_TARGET_TEXTS, MAX_ATTEMPTS, DELAY_SCALE, true, "com.qidian.QDReader.ui.activity.MainGroupActivity")
            ) {
                console.error("启动起点APP失败, 脚本将退出，请清除后台后重试");
                engines.stopAll();
                sleep(1000 * DELAY_SCALE);
            }
        }
    }
    startQidian();

    // 启动线程，以较高的延迟查找起点请求通知权限的弹窗
    const checkNotiPopup = threads.start(function () {
        const notificationPermissionPopup = selector().text('允许通知').findOne(8000);
        const notificationPermissionPopupCloseBtn = selector().id('closeBtn').findOne(8000);
        if (notificationPermissionPopup) {
            console.log('检测到起点弹出请求开启通知权限，X掉');
            notificationPermissionPopupCloseBtn.click();
            return true;
        }
        return
    })

    // 检测主页加载进度，如果已经加载到，说明没有请求通知权限弹窗，结束该线程
    if (!WaitForPageLoadR(MAINGROUP_TARGET_TEXTS, MAX_ATTEMPTS, DELAY_SCALE, true)) {
        console.error('启动app加载主页超时，重试一次');
        killQidian();
        sleep(500 * DELAY_SCALE);
        startQidian();

        if (!WaitForPageLoadR(MAINGROUP_TARGET_TEXTS, MAX_ATTEMPTS, DELAY_SCALE, true)) {
            console.error('依旧超时，脚本将退出，请清除后台后重试');
            engines.stopAll();
            sleep(1000 * DELAY_SCALE);
        }
    };
    checkNotiPopup.interrupt();
}




/**
 * 处理签到成功弹出页面之寻找查看签到多久的文本
 * 查找“签到成功，本周累计N章节卡碎片”文本，如果找到则说明签到成功
 * 同时日志输出累计章节卡碎片数量和连续签到天数
 * @returns {boolean} - 返回是否成功读取
 */
function readCheckInInfo() {
    try {
        // 查找签到成功文本
        const successText = textMatches(/签到成功.*\s?\d+\s?章节卡碎片/).findOne(2000);
        if (successText) {
            // 输出签到成功信息
            console.info("签到成功信息:", successText.text());

            // 查找连续签到天数文本
            const continuousDaysText = textMatches(/本周连续签到\s?\d+\s?天/).findOne(2000);
            if (continuousDaysText) {
                console.info("连续签到天数:", continuousDaysText.text());
            } else {
                console.warn("未找到连续签到天数信息");
            }

            return true;
        }
    } catch (e) {
        console.error("读取已签到信息时发生错误:", e);
    }

    return false;
}

/**
 * 关闭签到成功弹窗并进入福利中心页面
 */
function closeCheckInPopupAndEnterWelfareCenter() {
    try {
        // 关闭签到成功弹窗
        if (FindAndClick("fClose", null, MAX_ATTEMPTS, DELAY_SCALE)) {
            console.info("成功关闭签到成功弹窗");
        } else {
            console.error("关闭签到成功弹窗失败");
        }

        // 进入福利中心页面
        if (!FindAndClick(null, SIGNED_IN_TEXT, MAX_ATTEMPTS, DELAY_SCALE, 2)) {
            // 点击已签到的签到按钮，文本：领福利，如果点击出错则通过“我”中的“福利中心”进入
            return enterWelfareCenterByMe();
        }
        return true;
    } catch (e) {
        console.error("关闭弹窗或进入福利中心时发生错误:", e);
    }
}

// 进入福利中心
// 进入福利中心有两种方式，第一种是签到之后，弹出的页面点击“免费抽奖”直接进入福利中心并抽奖
// 默认使用第一种，如果失败则使用第二种，即在主页点击右下角的“我”，再查找“福利中心”并点击
// 由于现在进入抽奖的话，抽奖的控件都无法查找，抽奖功能无法实现没有意义
// 且暂时没办法定位抽奖的关闭按钮，按返回键会直接退出福利中心，故此暂时弃用第一种方式
const enterWelfareCenter = function () {
    // 查找“免费抽奖”按钮
    const freeLotteryButton = id("btnToCheckInSmall").findOne(2000);
    if (!freeLotteryButton) {
        console.error("未找到免费抽奖按钮，尝试第二种方式进入福利中心");
        return enterWelfareCenterByMe();
    }
    ClickEx(freeLotteryButton);
    console.log("已点击免费抽奖按钮");
    sleep(1000 * DELAY_SCALE); // 等待页面加载
    // 等待页面加载
    const isPageLoaded = waitForPageLoad(["激励视频任务"], MAX_ATTEMPTS);
    if (isPageLoaded) {
        console.log("已打开福利中心页面");
        // 查找“已连续签到N天”文本，并输出
        const checkInDays = textMatches(/已连续签到\d+天/).findOne(2000).text();
        console.log(checkInDays);
        return true;
    } else {
        console.error("打开福利中心页面超时，建议增加重试次数或调整延迟");
        return false;
    }
}

// 通过“我”进入福利中心
function enterWelfareCenterByMe() {
    if (!FindAndClick(null, "我", MAX_ATTEMPTS, DELAY_SCALE, 2)) {
        console.error("未找到“我”控件");
        console.error("再尝试直接查找“福利中心”")
        if (!FindAndClick(null, "福利中心", MAX_ATTEMPTS, DELAY_SCALE, 2)) {
            console.error("无法找到福利中心");
            return false;
        }
        console.log("找到并点击福利中心成功");
        return true;
    }

    // 找到并点击了“我”
    // 检查青少年模式弹窗
    closeTeenPopup();

    if (!FindAndClick(null, "福利中心", MAX_ATTEMPTS, DELAY_SCALE, 2)) {
        console.error("已找到点击“我”，但未找到福利中心")
        return false;
    }
    console.log("通过“我”找到并点击福利中心成功");
    return true;

    function closeTeenPopup() {
        try {
            // 查找青少年模式弹窗，如果有，点“我知道了”
            const enterTeen = selector().id('btnEnterTeen').findOne(2000);
            if (enterTeen) {
                console.log('查找到青少年模式弹窗，关闭之');
                let cancelBtn = selector().id('btnCancel').findOne(2000);
                if (!cancelBtn) {
                    console.log('找不到青少年模式关闭的按钮，尝试查找“我知道了”');
                    cancelBtn = selector().text('我知道了').findOne(2000);
                }
                if (!cancelBtn) {
                    console.log('找到青少年模式弹窗但是找不到关闭按钮');
                    return false;
                }
                if (ClickEx(cancelBtn)) {
                    console.log('已关闭青少年模式弹窗');
                    return true;
                }
                console.error('点击失败')
                return false;
            }
            // 没有青少年弹窗，直接返回
            return true;
        } catch (e) {
            console.error(`出错，错误信息：${e.message}`)
        }

    }

}




// 碎片兑换章节卡
function exchangeFragment() {
    // 点击退出的X按钮
    this.clickExitButton = function () {
        // 查找文本控件"兑换记录"，再在其父控件在子孙中遍历可点击的控件
        const exchangeRecordBtn = text("兑换记录").findOne(2000);
        const exchangeWindowsTitle = exchangeRecordBtn.parent().children();
        // 加入一个检查，通常此父控件应该只有三个子控件，并且只有退出按钮是可点击的
        if (exchangeWindowsTitle.length !== 3) {
            console.warn("未知原因，未找到退出按钮，或者退出按钮数量不正确");
            console.warn("将尝试点击上半部分空白处退出");
            const corX = device.width / 2;
            const corY = exchangeRecordBtn.bounds().top() / 2;
            if (ConfigR.ShizukuClick) {
                console.log(shizuku(`input tap ${corX} ${corY}`));
            } else {
                click(corX, corY);
            }

        }
        // 遍历所有可点击的控件并点击
        for (let button of exchangeWindowsTitle) {
            if (button.clickable()) {
                ClickEx(button);
                console.log("已点击退出X按钮");
                return true;
            }
        }
    }

    // 点击兑换按钮
    this.clickExchangeButton = function () {
        try {
            // 查找"n张碎片可兑换"文本控件
            const fragmentNumText = textMatches(/\d+\s*张碎片可兑换/).findOne(2000).text();
            const fragmentNum = parseInt(fragmentNumText.match(/\d+/)[0]);

            // 根据碎片数量点击对应的兑换按钮
            if (fragmentNum < 15) {
                console.log("碎片不足，无法兑换章节卡");
                this.clickExitButton();
                return false;
            }

            // 定义兑换按钮的文本和对应的碎片数量
            const exchangeOptions = [
                { text: "15张碎片兑换", min: 15, max: 20 },
                { text: "20张碎片兑换", min: 20, max: 30 },
                { text: "30张碎片兑换", min: 30, max: Infinity }
            ];

            // 查找并点击对应的兑换按钮
            for (let option of exchangeOptions) {
                if (fragmentNum >= option.min && fragmentNum < option.max) {
                    let button = text(option.text).findOne(2000).parent().findOne(text("兑换"));
                    if (button) {
                        ClickEx(button);
                        console.log(`已点击${option.text}的兑换按钮`);
                        sleep(1000 * DELAY_SCALE); // 等待兑换结果
                        ClickEx(className("android.widget.Button").text("兑换").findOne(2000));
                        console.log("已点击二次确认的兑换按钮");
                        sleep(1000 * DELAY_SCALE); // 等待兑换结果
                        this.clickExitButton();
                        return true;
                    } else {
                        console.error(`未找到${option.text}的兑换按钮`);
                        return false;
                    }
                }
            }
        } catch (e) {
            console.error("点击兑换按钮时发生错误:", e);
            return false;
        }
    };

    try {
        // 等待兑换页面加载
        const isPageLoaded = WaitForPageLoadR(["30张碎片兑换", "20张碎片兑换"], MAX_ATTEMPTS);
        if (isPageLoaded) {
            console.log("已打开兑换页面");
            return this.clickExchangeButton();
        } else {
            console.error("打开兑换页面超时，建议增加重试次数或调整延迟");
            return false;
        }

    } catch (e) {
        console.error("碎片兑换章节卡过程中发生错误:", e);
        return false;
    }
}


