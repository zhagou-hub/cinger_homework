# 石油勘探开发的智能化可能性地图

可视化导论大作业，包含 13 个石油作业环节、61 个候选场景和 16 个可运行案例。案例由 15 个补充案例与保留的测井曲线智能分层示范组成，每个案例提供专业背景、案例流程和交互演示。

在线访问：https://zhagou-hub.github.io/cinger_homework/bighomework/

源码分支：`bighomework`。GitHub Pages 从该分支根目录发布；本目录是大作业网站，仓库根目录保留原 homework4 网站。

## 运行

纯 HTML、CSS 和 JavaScript，无需安装依赖或后端。可在仓库根目录运行 `python -m http.server 4173`，然后访问 `http://localhost:4173/bighomework/`。

15 个补充案例的背景、流程和演示文件已打包在 `assets/cases/builtin-cases.js`，首次访问即可使用，无需手动导入。测井示范位于 `assets/cases/welllog-layer.*.js`。

“添加案例”仍支持导入案例文件。自行导入的内容保存在当前浏览器本地存储中，不会自动同步到其他设备或 GitHub。

演示使用教学数据与简化计算，用于理解参数、过程和结果，不代表真实工程验证效果。
