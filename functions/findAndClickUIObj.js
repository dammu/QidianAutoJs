/**
 * 通用控件查找和操作函数
 * @param {string} id - 控件的 ID（可选）
 * @param {string} text - 控件的文本（可选）
 * @param {number} maxAttempts - 最大重试次数，默认为 3
 * @param {number} delayScale - 延迟系数，默认为 1
 * @param {number} parent - 父控件层级，默认为 0
 * @returns {boolean} - 返回是否成功找到并操作控件
 */
function findAndClickUIObj (id, text, maxAttempts, delayScale, parent) {
    maxAttempts = maxAttempts || 3; // 最大重试次数，默认为 3
    delayScale = delayScale || 1; // 延迟系数，默认为 1
    parent = parent || 0; // 父控件层级，默认为 0

    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            let control;

            // 如果有 ID，优先通过 ID 查找控件
            if (id) {
                let query = id(id).findOne(2000);
                // 添加 parent() 层级
                for (let i = 0; i < parent; i++) {
                    query = query.parent();
                }
                control = query;
            } 
            // 如果没有 ID，则通过文本查找控件
            else if (text) {
                let query = text(text).findOne(2000);
                // 添加 parent() 层级
                for (let i = 0; i < parent; i++) {
                    query = query.parent();
                }
                control = query;
            } 
            // 如果既没有 ID 也没有文本，返回失败
            else {
                console.error("必须传入 ID 或文本");
                return false;
            }

            // 如果未找到控件，重试
            if (!control) {
                console.log("未找到控件，重试中...");
                attempts++;
                sleep(1000 * delayScale); // 延迟后重试
                continue;
            }

            // 找到控件后执行操作
            console.log("找到控件，执行操作");
            control.click(); // 示例操作：点击控件
            return true;
        } catch (e) {
            console.error("操作过程中发生错误:", e);
            attempts++;
            sleep(1000 * delayScale); // 延迟后重试
        }
    }

    console.log("操作失败，已达到最大重试次数");
    return false;
};

// 导出函数
module.exports = findAndClickUIObj;