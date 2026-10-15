# 第三次作业：DataLens 数据分析网站

- 在线访问：[https://zhagou-hub.github.io/cinger_homework/homework3/](https://zhagou-hub.github.io/cinger_homework/homework3/)
- 网站源码、测试与本地启动：[`homework3/`](./homework3/)
- 发布分支：`homework3`，发布目录：仓库根目录。
- 原第二次作业保留在原网址；DataLens 使用独立的 `/homework3/` 路径。

---

# 页面布局学习实验室

一个围绕“如何进行页面布局”制作的纯前端中文教学网站。课程以主动学习路径组织 8 个核心知识点，每节包含详细讲解、3 组关键代码、实际案例和可操作实验。

## 课程内容

1. 页面结构与布局准则
2. 文档流与盒模型
3. 定位与层叠
4. 布局方案选择
5. Flexbox 一维布局
6. Grid 二维布局
7. 响应式与流式布局
8. 布局可靠性检查

## 主要功能

- 每个知识点可独立标记学完，进度保存在浏览器本地。
- 24 组关键代码覆盖常见实现与问题处理。
- 8 个案例实验包含拖拽排序、定位、网格编排、容器缩放和自动体检。
- “知识点 Markdown”栏目统一汇总八节内容，支持复制和下载 `.md` 文件。
- 全中文演示界面，支持键盘标签切换、焦点样式与减少动态效果偏好。

## 本地运行

在本目录执行：

```bash
py -3 -m http.server 8080
```

然后访问 `http://localhost:8080/`。

网站使用 HTML、CSS 和原生 JavaScript，不需要后端或第三方依赖。


## GitHub Pages 部署

本部署包的页面文件与原项目 `site/dist/` 中的对应文件完全一致，未修改网站样式和交互。
已把发布目录提到压缩包顶层，并添加 `.nojekyll`，用于跳过 Jekyll 处理。
不需要安装依赖，不需要运行 npm build，也不需要后端服务器。

### 上传到现有仓库

仓库：<https://github.com/zhagou-hub/cinger_homework>

1. 解压本压缩包，进入能直接看到 `index.html` 的那一层。
2. 打开仓库的 Code 页面，点击 **Add file → Upload files**。
3. 拖入这一层的全部文件，以及整个 `layout-lab` 文件夹。不要上传 ZIP 本身；不要再套一层总文件夹。
4. 填写提交说明（例如 `Deploy frontend website`），提交到 `main` 分支。
5. 打开 **Settings → Pages**：Source 选择 **Deploy from a branch**，Branch 选择 **main**，目录选择 **/(root)**，点击 **Save**。
6. 等待部署，在 **Actions** 中查看 Pages 部署是否成功，然后返回 Pages，点击 **Visit site**。

未设置自定义域名时，部署成功后的默认网址：
<https://zhagou-hub.github.io/cinger_homework/>

这个地址需要在 GitHub 上完成上传、启用 Pages 且部署成功后才能访问。
本压缩包只准备了部署文件，并不代表已经修改远程仓库或完成上线。

### 核对仓库结构

```text
cinger_homework/
├── .nojekyll
├── README.md
├── index.html
├── styles.css
├── lesson.js
├── i18n.css
├── i18n.js
├── lecture.md
├── lecture-en.md
└── layout-lab/
    ├── index.html
    ├── layout-lab.css
    └── layout-lab.js
```

重点：在仓库首页的文件列表中应直接看到 `index.html`，不应该先进入 `site/`、`dist/` 或压缩包同名文件夹。
不要漏传 `.nojekyll`；若上传后没有它，可以使用 Add file → Create new file，文件名填 `.nojekyll`，内容输入一个空行，再提交。
保留 `layout-lab` 内部目录结构，不要把其中的 CSS、JS 随意移动到根目录。

### 后续更新

修改文件后，把更新后的对应文件提交到同一个 `main` 分支、同样的相对路径，Pages 会重新发布。
公开仓库和公开网页中不要放密码、访问令牌、API 密钥或私人资料。
学习进度和实验参数使用浏览器本地保存，不是云端账号同步。

### 官方说明

- GitHub Pages 简介：<https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages>
- 发布分支设置：<https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site>
- 首页与 .nojekyll：<https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site>
- 网页上传文件：<https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository>
