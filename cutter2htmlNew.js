/**
 * Created by Liangxiao on 17/7/6.
 */

//@target photoshop
app.preferences.rulerUnits = Units.PIXELS
app.bringToFront()

/* 全局文档名 */
var outNamePre = app.activeDocument.name.match(/^P\d{2}/)[0]
// 命名规则: 以大写字母P开头, 2位数字序号, 位数不足补0, 如P01、P02、P11等
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
    text += "<article class='swiper-slide swiper-lazy' style='overflow:hidden;' data-icon='show' data-tips='black'\n"
    text += "\t data-background='assets/bg.01.jpg'>\n"
    // data-icon为是否显示音乐图标[取值为show/hide]
    // data-tips为是否显示下拉提示[取值为none/black/golden/green等], 翻页时按各页设计处理(如适配不同颜色的下拉提示icon)
    // data-background为单个页面使用的背景图，用了懒加载所以直接给链接(bg-image)，
    // CSS里需要注意提前设置好`article.swiper-lazy`的bg-repeat、bg-size和bg-color(如果背景透明的话)就行
    // ---------------
    // 下面是一些(固定出现的)顶端元素
    text += "\t<img class='imgBase swiper-lazy' data-logo data-src='assets/logo.png'>\n"
    text += "\t<img class='imgBase swiper-lazy' data-title data-src='assets/title.png'>\n"
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
        imageTmp = "\t<img class='imgBase swiper-lazy'"
        // 图片样式
        imageTmp += " style='width:" + (width / 100) + "rem;"
        imageTmp += "left:" + (x1 / 100) + "rem;"
        // Top值是否使用vh单位，带有`[useRem]`标记的使用rem单位
        // 一般应用于比如两个元素的差接近页面高1/3了，这时再用vh可能在小屏机型上会出现重叠
        if (layerName.match(/\[[Uu]seRem\]/) !== null) {
            imageTmp += "top:" + (y1 / 100) + "rem;"
        } else {
            imageTmp += "top:" + (~~(y1 / 1500 * 10000) / 100) + "vh;"
        }
        // 是否需要处理事件(图层名包含`[Tap]`或者`[To:XXX]`)
        if (layerName.match(/\[[Tt](ap|o:[一-龥a-zA-Z]+)\]/) !== null) {
            imageTmp += "pointer-events:auto;'"
        } else {
            imageTmp += "'"
        }
        // 路径(改用了src, 因为目前的框架用data-src会不支持……)
        imageTmp += "\n\t\t data-src='assets" + outFolder + outNamePre + '.' + name + ".png'"
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
