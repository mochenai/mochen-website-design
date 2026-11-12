![Pasted image 20261013135556](media/6b3d3f5e5920888f142d.webp)大家好，我是陌晨。

skills.sh 是现在最常用的 skill 排行榜，按累计安装量排名，榜首已经快到400万次了。

我从榜单前列挑了10个最值得装的，发现一件挺有意思的事：**10个里有7个，出自同一个人。**

他叫 Matt Pocock，一个教 TypeScript 的老师。他把自己日常干活的 skill 整包开源在 GitHub 上，仓库已经28万多星。

剩下3个，一个是 Vercel 出的找 skill 工具，一个是 Vercel 的浏览器操作工具，一个是 Anthropic 官方的前端设计 skill。

下面挨个说，每个只讲是什么、解决什么、怎么用。安装量数据截至10月12日。

装之前先说一句，下面的安装命令需要电脑上有 Node.js。不想敲命令也行，把 GitHub 地址丢给 Claude Code、Codex 这类工具，说一句"帮我装这个skill"就够了。

## find-skills：帮你找 skill 的 skill

380万次安装，榜单第一。

装上它，你只要说"有没有能做 X 的 skill"，它就去 skills.sh 上帮你找现成的，找到了直接装。

它会先帮你筛一遍：安装量太低的、来路不明的、仓库没几颗星的，不推荐。**装 skill 最怕的不是没有，是装错。**

`安装：npx skills add vercel-labs/skills@find-skills`

## grill-me：动手前先把你问透

130万次安装。

你说一句"grill 一下这个方案"，它就开始一轮轮追问你。每轮把能问的问题一次问完，每题都附一个推荐答案，你答完才进下一轮。

查代码、查文件这种事实问题，它自己去查；只有需要拍板的决定，才留给你。问到没有遗漏了，你确认，它才开工。

适合做之前脑子里只有个大概的时候。

`安装：npx skills add mattpocock/skills@grill-me`

## grill-with-docs：边问边留档

110万次安装，是 grill-me 的带记录版本。

追问的同时，它会把项目里的专业术语整理成一份术语表，把关键决定写成决策记录，存进项目文件夹。

三个月后有人问"当初为什么这么定"，翻文档就有答案。

`安装：npx skills add mattpocock/skills@grill-with-docs`

## improve-codebase-architecture：给代码做体检

110万次安装。

它先看最近哪块代码改得最频繁，从那里开始查，专门找"看着复杂、其实没帮上忙"的模块。查完生成一份网页报告，每个问题都写清楚涉及哪些文件、怎么改、改完好在哪，还标了推荐程度。

报告放在临时目录，不会弄乱你的项目。

`安装：npx skills add mattpocock/skills@improve-codebase-architecture`

## tdd：先写测试，再写代码

110万次安装。

TDD 是一种老派但靠谱的开发方式：先写一个会失败的测试，再写刚好能通过的代码，一次只推进一小步。

这个 skill 把规矩定得很死。写测试之前，要先跟你确认测哪几个地方；那种永远不会失败、等于自己证明自己的测试，直接禁掉。

`安装：npx skills add mattpocock/skills@tdd`

## agent-browser：让 AI 操作浏览器

110万次安装，Vercel 出品。

它把网页上的按钮、输入框挨个编号，AI 按编号去点，不靠截图猜位置，所以点得准。除了网页，还能操作 VS Code、Slack 这类桌面软件。

需要先装一个命令行工具：

`安装：npm i -g agent-browser && agent-browser install`

## frontend-design：治 AI 味的界面

98万次安装，Anthropic 官方出品。

AI 做的网页为什么一眼就能认出来？奶油底配衬线字、到处都是同一个圆角和灰阴影、每个区块都淡入上滑。这个 skill 把这些套路列成了黑名单。

它做界面前会先问你：这个产品给谁用？给小学生的玩具和给分析师的看板，长得就不该一样。确认清楚，先定配色和字体，再动手。

`安装：npx skills add anthropics/skills@frontend-design`

## setup-matt-pocock-skills：一次性配置

98万次安装。

Matt Pocock 那一整套工程 skill 的初始化工具。在新项目里跑一次，它会问你几个问题：任务记在哪、标签怎么命名、文档放哪。每题都有推荐答案，基本一路确认就行。

配完之后，其他几个 skill 才知道该去哪读、往哪写。

`安装：npx skills add mattpocock/skills@setup-matt-pocock-skills`

## handoff：对话太长时写交接

97万次安装。

和 AI 聊久了，上下文快装不下的时候，执行 /handoff，它会把当前进度压缩成一份交接文档，让下一个对话接着干。

已经有的文件只写路径不复制内容，密码、密钥这类敏感信息会自动打码。

`安装：npx skills add mattpocock/skills@handoff`

## triage：帮你分拣任务

93万次安装，目前排第11，刚被一个视频 skill 挤出前10，但依然值得一提。

适合在 GitHub 上管项目的人。执行 /triage，说一句"看看有什么要我处理的"，它就把待办的问题过一遍，每个标上是 bug 还是新需求、现在该谁处理。

已经做过的、之前被拒过的，它会先查出来。它发出的每条评论，开头都会注明"由 AI 生成"。

`安装：npx skills add mattpocock/skills@triage`

## 写在最后

普通用户想先试试，我建议装三个：find-skills、grill-me、handoff。一个帮你找工具，一个帮你想清楚，一个帮你接上断掉的对话，不写代码也用得上。

回头再看这份榜单，最火的 skill 没有一个是"写作神器""一键生成"。

一个教 TypeScript 的老师，靠把自己的干活习惯写成 skill，装机量做到了全网第一梯队。**skill 拼到最后，拼的不是功能，是一个人干活的方法论。**

如果你也有天天重复的工作习惯，不妨也把它写成一个 skill。

这10个你装过哪个？欢迎**评论区分享。**

我是陌晨，下次见。
