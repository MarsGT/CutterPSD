//@target photoshop
app.preferences.rulerUnits = Units.PIXELS
app.bringToFront()

/* 全局文档名 */
var outNamePre = app.activeDocument.name.match(/S?P\d{2}(_\d)?/)[0]
// 命名规则: 以大写字母P开头, 2位数字序号, 位数不足补0, 前边可以加S, 后边可以跟下划线加1位数字,
// 比如P01、P02、SP11、SP04_3、P21_4等都是合法名称
// 如果不符合以上规则，推荐用批量重命名工具自行在设计稿名称前追加,
// 或者也可以在每次切图前自行改写此字符串
/* 输出文件夹 */
var outFolder = "/item/"
/* 用于随机的动画名 */
var animateLib = [
    "fadeInDown", "fadeInLeft", "fadeInUp", "fadeInRight",
    "fadeInDownBig", "fadeInLeftBig","fadeInUpBig","fadeInRightBig",
    "fadeInTopLeft", "fadeInTopRight", "fadeInBottomLeft", "fadeInBottomRight",
    "slideInDown", "slideInLeft", "slideInUp", "slideInRight",
    "zoomIn"
]
/* 生成指定位数的序列号（填充0） */
function zeroSuppress(num, digit) {
    var tmp = num.toString()
    while (tmp.length < digit) {
        tmp = "0" + tmp
    }
    return tmp
}

/* 核心处理流程 */
function main(exFolder) {
    var layers = app.activeDocument.layers
    var len = layers.length
    // 循环用数据缓存
    var i, j, fileIndex = 0
    var x1, x2, y1, y2, width, height, name, layerName
    var cmp, boundsArr
    // 要输出到哪个HTML文件
    var htmlOut = new File(exFolder + "/main.html")
    htmlOut.encoding = "UTF-8"
    if (!htmlOut.exists) { // 如果指定路径没有
        htmlOut.open("w") // 写入模式
    } else {
        htmlOut.open("a") // 追加模式
    }
    // 待写入内容的字符串
    var text = ""
    // 页面最外层容器(页面包裹在<article>标签里)
    // 形式1: 含有背景图的页面, 背景使用swiper预加载
    text += "<article class='swiper-slide swiper-lazy' data-icon='show' data-tips='black' data-mu='white'\n"
    text += "\t\t data-background='assets/bg.01.jpg'>\n"
    // 形式2: 有背景色的页面
    // text += "<article class='swiper-slide' data-icon='show' data-tips='black' data-mu='white'\n"
    // text += "\t\t style='background-color:#f3f3f1;'>\n"
    // 形式3: 不含背景图也没有背景色的页面
    // text += "<article class='swiper-slide' data-icon='show' data-tips='black' data-mu='white'>\n"
    // 属性解释:
    // data-icon为是否显示音乐图标[取值为show/hide]
    // data-mu为音乐图标颜色[取值对应data-tools下data-music的相应颜色,具体定义写在CSS里]
    // data-tips为是否显示下拉提示[取值为none/black/golden/green等], 翻页时按各页设计处理(如适配不同颜色的下拉提示icon)
    // data-background为单个页面使用的背景图，用了懒加载所以直接写背景图片的链接就行
    // CSS里需要注意提前设置好`article.swiper-lazy`的bg-repeat、bg-size
    // ---------------
    // 页眉元素(包裹在<header>标签里)
    // 形式1: 普通页眉
    text += "\t<header>\n"
    // 形式2: 需要提高页眉层级以避免被下方页面内容遮挡
    // text += "\t<header style='z-index:9;'>\n"
    text += "\t\t<img class='imgBase swiper-lazy' data-src='assets/logo.1.png' data-logo='1'>\n"
    text += "\t\t<img class='imgBase swiper-lazy' data-src='assets/title.1.png' data-title='1'>\n"
    // text += "\t\t<img class='imgBase swiper-lazy' data-src='assets/btnGoback.png' data-goback>\n"
    text += "\t</header>\n"
    // 页面主体内容(包裹在<section>标签里)
    text += "\t<section>\n"
    // 待写入内容缓存
    var textBody = []
    // 用来拼接每条img的缓存
    var imageTmp = ""
    // 遍历每一图层
    for (i = 0; i < len; i++) {
        if (!layers[i].visible) { // 直接跳过隐藏图层
            continue
        }
        boundsArr = layers[i].bounds
        layerName = layers[i].name
        cmp = app.activeDocument.layerComps.add("工作快照", "", true, true, true) // 使用图层复合做备份
        // ------------ 整理相关数据 ------------
        x1 = UnitValue(boundsArr[0]).as('px')
        y1 = UnitValue(boundsArr[1]).as('px')
        x2 = UnitValue(boundsArr[2]).as('px')
        y2 = UnitValue(boundsArr[3]).as('px')
        width = x2 - x1
        height = y2 - y1
        // 文件名
        fileIndex++
        name = zeroSuppress(fileIndex, 2)
        // 复制图层并移动到当前文档的layers[0]位置,剩下的图层全部隐藏
        layers[i].duplicate(app.activeDocument, ElementPlacement.PLACEATBEGINNING)
        for (j = 1; j < layers.length; j++) {
            layers[j].visible = false
        }
        // ------------ 生成单条<img>元素 ------------
        imageTmp = "\t\t<img class='imgBase swiper-lazy'"
        // 图片样式与定位。这里定位上Left采用vw单位，Top采用vh单位，
        // 全部按比例后小屏幕机型只需要适当调整根节点font-size就行(控制图片width)
        imageTmp += " style='width:" + (~~(width / 750 * 10000) / 100) + "vw;"
        imageTmp += "left:" + (~~(x1 / 750 * 10000) / 100) + "vw;"
        imageTmp += "top:" + (~~((y1 - 286)/*即header高度*/ / 750 * 10000) / 100) + "vw;"
        // 是否需要处理事件(图层名包含`[Tap]`或者`[To:XXX]`)
        if (layerName.match(/\[[Tt](ap|o:[一-龥a-zA-Z]+)\]/) !== null) {
            imageTmp += "pointer-events:auto;'"
        } else {
            imageTmp += "'"
        }
        // 路径, data-src是因为用到了懒加载
        // 另外由于现在基本不存在兼容性问题了, 切出来的PNG图片建议使用XnConvert批量转换为WebP格式
        // 把输出文件夹里的图片拖到XnConvert的“输入”里, 动作不用管, 直接到输出里设置输出文件夹, 文件名{Filename}大小写不转换,
        // 选项只勾保留颜色设置和使用多核(拉满), “转换完毕之后”的“清除输入文件”可以勾, 格式选WEBP, 在下边设置里质量设置85就行, 然后把下边的RGB->YUV勾上就行了
        imageTmp += "\n\t\t\t data-src='assets" + outFolder + outNamePre + '.' + name + ".webp'"
        // 动画设定(图层名包含形如`[Ani:XXXX]`
        // 其中`[Ani:icon]`是循环晃动的小Logo, `[Ani:no]`代表没有动画, 未标此值代表采用随机动画(默认)
        // 其余取值皆为动画名
        if (layerName.match(/\[[Aa]ni:([a-zA-Z]{2,})\]/) !== null) {
            if (layerName.match(/\[[Aa]ni:([a-zA-Z]{2,})\]/)[1] !== 'no') {
                imageTmp += " data-ani='"
                imageTmp += layerName.match(/\[[Aa]ni:([a-zA-Z]{2,})\]/)[1]
                imageTmp += "'"
            }
        } else {
            imageTmp += " data-ani='"
            imageTmp += animateLib[~~(Math.random() * animateLib.length)] // 随机一种动画效果
            imageTmp += "'"
        }
        // 如果有跳转(图层名包含`[To:XXX]`, 比如目录图跳转, 可以配合在要跳转到的页面上加data-dist参数)
        if (layerName.match(/\[[Tt]o:([一-龥a-zA-Z]+)\]/) !== null) {
            imageTmp += " data-to='"
            imageTmp += layerName.match(/\[[Tt]o:([一-龥a-zA-Z]+)\]/)[1]
            imageTmp += "'"
        }
        // 封口,将拼好的单条字串放入缓存
        imageTmp += ">"
        textBody.push(imageTmp)
        // ------------ 保存PNG ------------
        // 复制内容
        var selectReg = [
            [x1, y1],
            [x2, y1],
            [x2, y2],
            [x1, y2]
        ]
        app.activeDocument.selection.select(selectReg)
        app.activeDocument.selection.copy(true)
        app.activeDocument.selection.deselect()
        // 根据复制粘贴内容建立一个临时新文档,然后把内容粘过去
        var DocName = "切图用临时文档"
        preferences.rulerUnits = Units.PIXELS
        var newDocument = documents.add(width, height, 72, DocName, NewDocumentMode.RGB, DocumentFill.TRANSPARENT)
        newDocument.paste()
        // 导出为Web格式
        var exp = new ExportOptionsSaveForWeb()
        exp.format = SaveDocumentType.PNG
        exp.interlaced = false
        exp.PNG8 = false
        // 导出文件夹,如果不存在就新建
        var folderImg = new Folder(exFolder + outFolder)
        if (!folderImg.exists) { folderImg.create() }
        // 新建文件描述符并导出文件
        var fileObj = new File(folderImg.fsName + '/' + outNamePre + '.' + name + ".png")
        newDocument.exportDocument(fileObj, ExportType.SAVEFORWEB, exp)
        // 关闭临时新文档(不保存)
        newDocument.close(SaveOptions.DONOTSAVECHANGES)
        // ------------ 后续操作 ------------
        // 避免运行脚本时没有选中的图层时会报错
        try {
            layers[0].remove()
        } catch (e) {
            
        }
        cmp.apply() // 还原并删除备份
        cmp.remove()
    }
    // 输出HTML内容后续的操作
    // 颠倒顺序(因为Ps里的图层顺序和网页里是反的),按自然层级排列
    textBody.reverse()
    // 拼接后排入总体内容字符串
    text += textBody.join('\n')
    // 关闭标签
    text += "\n\t</section>"
    text += "\n</article>\n"
    // 写入文本文件, 成功后关闭文件的输入流。
    htmlOut.write(text)
    htmlOut.close()
}

/* 主进程，出弹框提示选择输出路径，执行处理过程，完成后播放提示音 */
;(function () {
    try {
        var exFolder = Folder.selectDialog("请选择输出文件夹")
        if (exFolder != null) {
            main(exFolder.fsName)
            app.beep(); //成功后播放提示音
            app.activeDocument.close(SaveOptions.DONOTSAVECHANGES)
        } else {
            alert("文件夹选择有误！")
        }
    } catch (e) {
        $.writeln("!!" + e.name + '-> Line ' + e.line + ': ' + e.message)
        alert("抱歉！执行时发生错误！\r\n" + "!!" + e.name + '-> Line ' + e.line + ': ' + e.message)
    }
})();
