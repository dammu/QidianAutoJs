const TaskConfig = {
  claimContinuousCheckInGift: true,  // 是否开启连签礼包领取模块
  videoMissions: true,    // 是否开启视频任务模块
}

const config = {
  MaxAttempts: 5,    // 最大重试次数，影响绝大多数的操作
  DelayScale: 2,     // 操作的延迟放大倍数，包括但不限于每次重试之间的延迟，还有各种寻找控件等
  UseShizukuKillApp: true,     // 是否使用 shizuku 来结束app
  ShizukuClick: true,          // 是否使用 shizuku 来点击控件坐标
  ShizukuKeyEvent: false,      // 是否使用 shizuku 来发送按键事件
  ExchangeFragment: false,      // 是否需要兑换章节卡（如果是周日），有时候会触发人机验证，不实现自动人机验证
  claimContinuousCheckInGiftByCheckedInDays: true,
  // 是否根据已连续签到天数来决定需不需要领取连签礼包，如果否就会不管连续签到几天都打开连签礼包页面尝试领取
  // 所以如果使用true的时候没运行脚本错过了当天的领取，第二天也不会再去领直到连签天数达到下一等级
  // 如果是一直有签到有领取过的，建议使用true，天数到了再去领。有没领取过的，怕错过的可以用false
  TaskConfig: TaskConfig,
  UseShizukuEnableA11y: true,
  AdExitCorX:  304,
  AdExitCorY:  251
};

module.exports = config;

