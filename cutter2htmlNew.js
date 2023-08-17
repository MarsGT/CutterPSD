/**
 * Created by Liangxiao on 17/7/6.
 */

//@target photoshop
app.preferences.rulerUnits = Units.PIXELS
app.bringToFront()

/* 全局文档名 */
var outNamePre = app.activeDocument.name.match(/S?P\d{2,4}(_\d)?/)[0]
// 命名规则: 多页,以大写字母P开头, 支持2位/3位数字序号, 增补页以_1形式出现, 如P01_1、P01_2等
// 4位数字第1位数字标识哪个部分, 第2、3位数字标识是这个部分的第几页,
// 第3位数字从0开始, 预留给之后修订时要增加的页(防止切出组件命名重复), 如P2020、P2030中间再加页就是P2021、P2022、P2023并以此类推
// 几种推荐形式范例: [P02.设计稿名称.psd]、[P02_1.设计稿名称.psd]、[P045.设计稿名称.psd]、[P0290.设计稿名称.psd]、[P0291.设计稿名称.psd]
// P前边可以加上S(业务需要), 导出的图片也同样会带
// 另: 如果命名不符合以上规则, 可以直接自行设定固定值
/* 输出文件夹 */
var outFolder = "/item/"
/* 生成指定位数的序列号（填充0） */
function zeroSuppress(num, digit) {
    var tmp = num.toString()
    while (tmp.length < digit) {
        tmp = "0" + tmp
    }
    return tmp
}

/* 存储PNG */
function savePNG(path, name, imgConf) {
    var selectReg = [
        [imgConf.x1, imgConf.y1],
        [imgConf.x2, imgConf.y1],
        [imgConf.x2, imgConf.y2],
        [imgConf.x1, imgConf.y2]
    ]
    app.activeDocument.selection.select(selectReg)
    app.activeDocument.selection.copy(true)
    app.activeDocument.selection.deselect()

    var DocName = "切图用临时文档"
    preferences.rulerUnits = Units.PIXELS
    var newDocument = documents.add(imgConf.width, imgConf.height, 72, DocName, NewDocumentMode.RGB, DocumentFill.TRANSPARENT)
    newDocument.paste()

    var exp = new ExportOptionsSaveForWeb()
    exp.format = SaveDocumentType.PNG
    exp.interlaced = false
    exp.PNG8 = false

    var folderImg = new Folder(path)
    if (!folderImg.exists) { folderImg.create() }
    var fileObj = new File(folderImg.fsName + '/' + name + ".png")
    newDocument.exportDocument(fileObj, ExportType.SAVEFORWEB, exp)
    newDocument.close(SaveOptions.DONOTSAVECHANGES)
}

/* 在工作文档中处理所有复制来的图层/组，如果是图层组就先合并，然后裁切并输出 */
function processing(exFolder) {
    var rectArr = [] // 组件信息数组，包含名称、定位和宽高
    var layers = app.activeDocument.layers
    var len = layers.length
    var i, j, fileIndex = 0
    var x1, x2, y1, y2, width, height, name, layerName
    var cmp, boundsArr
    for (i = 0; i < len; i++) {
        if (!layers[i].visible) { // 直接跳过隐藏图层
            continue
        }
        boundsArr = layers[i].bounds
        layerName = layers[i].name
        cmp = app.activeDocument.layerComps.add("工作快照", "", true, true, true) // 使用图层复合做备份
        x1 = UnitValue(boundsArr[0]).as('px')
        y1 = UnitValue(boundsArr[1]).as('px')
        x2 = UnitValue(boundsArr[2]).as('px')
        y2 = UnitValue(boundsArr[3]).as('px')
        width = x2 - x1
        height = y2 - y1
        // 文件名
        fileIndex++
        name = zeroSuppress(fileIndex, 2)
        // 压入组件信息数组
        rectArr.push({
            name: name,
            layerName: layerName,
            x: x1,
            y: y1,
            w: width,
            h: height
        })
        layers[i].duplicate(app.activeDocument, ElementPlacement.PLACEATBEGINNING) // 复制图层并移动到当前文档的layers[0]位置
        for (j = 1; j < layers.length; j++) {
            layers[j].visible = false
        }
        savePNG(exFolder + outFolder, outNamePre + '.' + name, {
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            width: width,
            height: height
        })
        // 避免运行脚本时没有选中的图层时会报错
        try {
            layers[0].remove()
        } catch (e) {
            
        }
        cmp.apply() // 还原并删除备份
        cmp.remove()
    }
    return rectArr
}

// 直接输出html代码
function exportHTML(rectArr, exFolder) {
    // 输出目标
    var htmlOut = new File(exFolder + "/main.html")
    htmlOut.encoding = "UTF-8"
    if (!htmlOut.exists) { // 如果指定路径没有
        htmlOut.open("w") // 写入模式
    } else {
        htmlOut.open("a") // 追加模式
    }

    var text = "" // 待写入内容的字符串
    text += "<article class='swiper-slide' style='overflow:hidden;' data-icon='show' data-tips='black'>\n"
    // data-icon为是否显示音乐图标[取值为show/hide], data-tips为是否显示下拉提示[取值为none/black/golden/green等], 翻页时按各页设计处理
    // text += "\t<img class='imgBase' src='assets/common/bgHeader.png' style='width:100vw;left:0;top:0;'>\n"
    text += "\t<img class='imgBase' src='assets/common/header.png' style='width:100vw;left:0;top:1.58rem;'>\n"
    // text += "\t<img class='imgBase' src='assets/common/goback.png' style='width:100vw;left:.7rem;top:1.58rem;' data-goback>\n"
    var textBody = [] // 待写入内容缓存

    var imageTmp = ""
    var aniCache = null
    var posCache = null
    var len = rectArr.length

    for (var i = 0; i < len; i++) {
        imageTmp = "\t<img class='imgBase swiper-lazy'"
        // 图片样式
        imageTmp += " style='width:" + (rectArr[i].width / 100) + "rem;"
        imageTmp += "left:" + (rectArr[i].x / 100) + "rem;"
        imageTmp += "top:" + (~~(rectArr[i].y / 1500 * 10000) / 100) + "vh;"
        // 是否需要处理事件(图层名包含`[Tap]`)
        if (rectArr[i].layerName.match(/\[[Tt]ap\]/).length != 0) {
            imageTmp += "pointer-events:auto;'"
        } else {
            imageTmp += "'"
        }
        // 路径
        imageTmp += "\n\t\t data-src='assets" + outFolder + outNamePre + '.' + rectArr[i].name + ".png'"
        // 动画设定(图层名包含形如`[Ani:XXXX]`
        // 其中`[Ani:icon]`是循环晃动的小Logo, `[Ani:no]`代表没有动画, `[Ani:random]`代表默认的随机动画
        // 其余取值皆为动画名
        aniCache = null
        aniCache = rectArr[i].layerName.match(/\[[Aa]ni:(\S*)\]/)
        if (aniCache.length != 0) {
            imageTmp += " data-ani='"
            imageTmp += aniCache[1]
            imageTmp += "' "
        } else {
            imageTmp += " data-ani='random'" // 如果没有也是随机动画
        }
        // 位置设定
        posCache = null
        posCache = rectArr[i].layerName.match(/\[[Pp]os:(\S*)\]/)
        if (posCache.length != 0) {
            imageTmp += " data-pos='"
            imageTmp += posCache[1].replace(/[<]/, '&lt;').replace(/[>]/, '&gt;') // 处理实体字符
            imageTmp += "'"
        } else {
            imageTmp += " data-pos='&gt;'" // 如果没有就是默认并行动画(HTML实体字符)
        }
        // 如果有跳转
        if (rectArr[i].layerName.match(/\[[Tt]o:(\S*)\]/).length != 0) {
            imageTmp += " data-to='"
            imageTmp += rectArr[i].layerName.match(/\[[Tt]o:(\S*)\]/)[1]
            imageTmp += "'"
        }
        // 封口,将拼好的单条字串放入缓存
        imageTmp += ">"
        textBody.push(imageTmp)
    }
    textBody.reverse() // 颠倒顺序,按自然层级排列

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
            var rect = processing(exFolder.fsName)
            exportHTML(rect, exFolder.fsName)
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
