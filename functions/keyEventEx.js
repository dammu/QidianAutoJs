const Config = require("../config");
const ShizukuKeyEvent = Config.ShizukuKeyEvent; // 配置项改为 ShizukuKeyEvent

/**
 * 扩展的按键事件函数
 * @param {string} keyEvent - 按键事件类型（如 "back", "home", "menu", "volumeUp", "volumeDown"）
 * @param {boolean} [useShizuku] - 是否使用 Shizuku 执行按键事件，默认为 config.shizukuKeyEvent
 * @returns {boolean} - 返回操作是否成功
 */
function keyEventEx(keyEvent, useShizuku) {
    // 设置默认值
    useShizuku = useShizuku !== undefined ? useShizuku : ShizukuKeyEvent;

    // 按键事件映射
    const keyEventMap = {
        back: `${KeyEvent.KEYCODE_BACK}`,
        home: `${KeyEvent.KEYCODE_HOME}`,
        menu: `${KeyEvent.KEYCODE_MENU}`,
        volumeUp: `${KeyEvent.KEYCODE_VOLUME_UP}`,
        volumeDown: `${KeyEvent.KEYCODE_VOLUME_DOWN}`,
    };

    // 检查按键事件是否支持
    const keyCode = keyEventMap[keyEvent];
    if (!keyCode) {
        console.error("不支持的按键事件类型:", keyEvent);
        return false;
    }

    try {
        if (useShizuku) {
            // 使用 Shizuku 执行按键事件
            console.log(`使用 Shizuku 执行 ${keyEvent} 操作`);
            return $shizuku(`input keyevent ${keyCode}`);
        } else {
            // 使用默认的方法
            switch (keyEvent) {
                case "back":
                    console.log("使用默认的 back 方法");
                    return back();
                case "home":
                    console.log("使用默认的 home 方法");
                    return home();
                case "menu":
                    console.log("使用默认的 menu 方法");
                    return menu();
                case "volumeUp":
                case "volumeDown":
                    console.error(`默认方法不支持 ${keyEvent} 操作`);
                    return false;
                default:
                    console.error("未知的按键事件类型:", keyEvent);
                    return false;
            }
        }
    } catch (e) {
        console.error("执行按键事件时发生错误:", e);
        return false;
    }
}

module.exports = keyEventEx;