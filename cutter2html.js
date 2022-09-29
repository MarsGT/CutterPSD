/**
 * Created by Liangxiao on 17/7/6.
 */

//@target photoshop
app.preferences.rulerUnits = Units.PIXELS
app.bringToFront()

/* 全局文档名 */
var outNamePre = app.activeDocument.name.match(/P\d{2,4}(_\d)?/) || 'Pzzzz'
// 命名规则: 多页,以大写字母P开头, 支持2位/3位数字序号, 增补页以_1形式出现, 如P01_1、P01_2等
// 4位数字第1位数字标识哪个部分, 第2、3位数字标识是这个部分的第几页,
// 第3位数字从0开始, 预留给之后修订时要增加的页(防止切出组件命名重复), 如P2020、P2030中间再加页就是P2021、P2022、P2023并以此类推
// 几种推荐形式范例: [P02.设计稿名称.psd]、[P02_1.设计稿名称.psd]、[P045.设计稿名称.psd]、[P0290.设计稿名称.psd]、[P0291.设计稿名称.psd]
/* 输出文件夹 */
var outFolder = "/item2/"
/* 用于随机的动画名 */
var animateLib = ["fadeInDown", "fadeInLeft", "fadeInUp", "fadeInRight", "slideInDown", "slideInLeft", "slideInUp", "slideInRight", "zoomIn"]
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
        cmp = app.activeDocument.layerComps.add("快照", "", true, true, true) // 使用图层复合做备份
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
            cx: (x1 + ~~(width / 2)),
            cy: (y1 + ~~(height / 2)),
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
    var htmlOut = new File(exFolder + "/all.html")
    htmlOut.encoding = "UTF-8"
    if (!htmlOut.exists) { // 如果指定路径没有
        htmlOut.open("w") // 写入模式
    } else {
        htmlOut.open("a") // 追加模式
    }

    var text = ""
    text += "<section class='swiper-slide' style='overflow:hidden;' data-music data-bg='1'>\n"
    text += "\t<div class='pageZoom noTop'>\n"
    // text += "\t\t<img class='imgBase' src='assets/common/bgHeader.png' style='left:0;top:0;'>\n"
    text += "\t\t<img class='imgBase' src='assets/common/header.png' style='left:0;top:0;'>\n"
    // text += "\t\t<img class='imgBase' src='assets/common/goback.png' style='left:164px;top:177px;' data-goback>\n"
    text += "\t</div>\n"
    text += "\t<div class='pageZoom'>\n" // 待写入内容的字符串
    var textBody = [] // 待写入内容缓存

    var imageTmp = ""
    var len = rectArr.length

    for (var i = 0; i < len; i++) {
        imageTmp = "\t\t<img class='imgBase swiper-lazy"
        switch (rectArr[i].layerName) {
            case "[icon]":
                imageTmp += " ani infinite' data-src='"
                break;
            case "[NoAni]":
                imageTmp += "' data-src='"
                break;
            default:
                imageTmp += " ani' data-src='"
                break;
        }
        imageTmp += "assets" + outFolder + outNamePre + '.' + rectArr[i].name + ".png"
        imageTmp += "' style='left:" + rectArr[i].x + "px;top:" + rectArr[i].y + "px;"
        if (rectArr[i].layerName === '[pointer]') {
            imageTmp += "pointer-events:auto;'"
        } else {
            imageTmp += "'"
        }
        if (rectArr[i].layerName !== "[NoAni]") {
            imageTmp += "\n\t\t\tswiper-animate-effect='"
            switch (rectArr[i].layerName) {
                case "[Ani:flipInX]":
                    imageTmp += "flipInX"
                    imageTmp += "' swiper-animate-duration='0.6s' swiper-animate-delay='0.3s'>"
                    break;
                case "[Ani:fadeIn]":
                    imageTmp += "fadeIn"
                    imageTmp += "' swiper-animate-duration='0.6s' swiper-animate-delay='0s'>"
                    break;
                case "[Ani:fadeInUp]":
                    imageTmp += "fadeInUp";
                    imageTmp += "' swiper-animate-duration='0.6s' swiper-animate-delay='0s'>"
                    break;
                case "[icon]":
                    imageTmp += "tada"
                    imageTmp += "' swiper-animate-duration='1.0s' swiper-animate-delay='0.8s'>"
                    break;
                default:
                    imageTmp += animateLib[~~(Math.random() * animateLib.length)] // 随机一种动画效果
                    imageTmp += "' swiper-animate-duration='0.6s' swiper-animate-delay='0s'>"
                    break;
            }
        } else {
            imageTmp += ">"
        }
        textBody.push(imageTmp)
    }
    textBody.reverse(); // 颠倒顺序,按自然层级排列

    text += textBody.join('\n')
    text += "\n\t</div>\n</section>\n"

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
