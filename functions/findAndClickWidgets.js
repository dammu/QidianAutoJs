const ClickExR = require("./clickEx");
/**
 * 通用控件查找和操作函数
 * @param {string} id - 控件的 ID（可选）
 * @param {string} text - 控件的文本（可选）
 * @param {number} maxAttempts - 最大重试次数，默认为 3
 * @param {number} delayScale - 延迟系数，默认为 1
 * @param {number} parent - 父控件层级，默认为 0
 * @returns {boolean} - 返回是否成功找到并操作控件
 */
function findAndClickWidgets(id, text, maxAttempts, delayScale, parent) {
    maxAttempts = maxAttempts || 3; // 最大重试次数，默认为 3
    delayScale = delayScale || 1;   // 延迟系数，默认为 1
    parent = parent || 0;           // 父控件层级，默认为 0

    if (!id && !text) {
        console.error("必须传入 ID 或文本");
        return false;
    }

    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            let control = findControl(id, text);

            if (!control) {
                console.log("未找到控件，重试中...");
                attempts++;
                sleep(1000 * delayScale); // 延迟后重试
                continue;
            }

            // 逐级向上查找可点击的父控件
            let result = clickParentIfClickable(control, parent);

            if (result) {
                console.log("成功点击控件");
                return true;
            } else {
                console.log("未找到可点击的父控件");
                attempts++;
                sleep(1000 * delayScale); // 延迟后重试
            }
        } catch (e) {
            console.error("操作过程中发生错误:", e);
            attempts++;
            sleep(1000 * delayScale); // 延迟后重试
        }
    }

    console.log("操作失败，已达到最大重试次数");
    return false;
}

/**
 * 查找控件
 * @param {string} id - 控件的 ID
 * @param {string} text - 控件的文本
 * @returns {object|null} - 返回找到的控件，未找到则返回 null
 */
function findControl(id, text) {
    let query;

    console.verbose(`查找控件：ID=${id}，文本=${text}`);
    if (id) {
        query = selector().id(id).findOne(2000);
    } else if (text) {
        query = selector().text(text).findOne(2000);
    }

    if (query) {
        // console.log(`找到控件：${query}`);
        return query;
    }

    console.log("未找到控件");
    return null;
}

/**
 * 逐级向上查找可点击的父控件
 * @param {object} control - 当前控件
 * @param {number} maxParentLevel - 最大父控件层级
 * @returns {boolean} - 返回是否成功点击父控件
 */
function clickParentIfClickable(control, maxParentLevel) {
    let currentControl = control;

    for (let i = 0; i <= maxParentLevel; i++) {
        if (currentControl && currentControl.clickable()) {
            console.log(`找到可点击的父控件，层级=${i}，执行点击操作`);
            ClickExR(currentControl);
            return true;
        }

        if (i < maxParentLevel) {
            currentControl = currentControl.parent();
            if (!currentControl) {
                console.log(`未找到第 ${i + 1} 级可点击的父控件`);
                break;
            }
        }
    }

    return false;
}

// 导出函数
module.exports = findAndClickWidgets;