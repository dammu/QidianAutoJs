const Config = require("../config");
const ShizukuClick = Config.ShizukuClick;

/**
 * 扩展的点击函数
 * @param {object} widget - 需要点击的控件对象
 * @param {boolean} [useShizukuToClickCenter] - 是否使用 Shizuku 点击控件中心点，默认为 config.shizukuClick
 * @returns {boolean} - 返回点击是否成功
 */
function clickEx(widget, useShizukuToClickCenter) {
    // 参数校验
    if (!widget) {
        console.error("控件对象不能为空");
        return false;
    }

    // 设置默认值
    useShizukuToClickCenter = useShizukuToClickCenter || ShizukuClick;

    try {
        if (useShizukuToClickCenter) {
            // 使用 Shizuku 点击控件中心点
            const bounds = widget.bounds();
            if (!bounds) {
                console.error("无法获取控件坐标");
                return false;
            }

            const x = bounds.centerX();
            const y = bounds.centerY();
            const command = `input tap ${x} ${y}`;

            console.log(`使用 Shizuku 点击控件中心点：(${x}, ${y})`);
            return $shizuku(command);
        } else {
            // 使用默认的 click 方法
            console.log("使用默认的 click 方法");
            return widget.click();
        }
    } catch (e) {
        console.error("点击控件时发生错误:", e);
        return false;
    }
}

module.exports = clickEx;