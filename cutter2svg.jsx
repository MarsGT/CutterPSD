/**
 * Created by Liangxiao on 22/1/6.
 */

//@target photoshop
app.preferences.rulerUnits = Units.PIXELS
app.bringToFront()

/* 在工作文档中处理所有复制来的图层/组，如果是图层组就先合并，然后裁切并输出 */
var processing = function () {
    var layers = app.activeDocument.layers
    var len = layers.length
    var rectArr = [] // 组件名，定位和宽高
    var i, j, boundsArr, cmp, x1, x2, y1, y2
    for (i = 0; i < len; i++) {
        if (!layers[i].visible) { // 跳过隐藏图层
            continue;
        }
        boundsArr = layers[i].bounds
        cmp = app.activeDocument.layerComps.add('快照', '', true, true, true) // 使用图层复合做备份
        x1 = UnitValue(boundsArr[0]).as('px')
        y1 = UnitValue(boundsArr[1]).as('px')
        x2 = UnitValue(boundsArr[2]).as('px')
        y2 = UnitValue(boundsArr[3]).as('px')
        rectArr.push({
            layerName: layers[i].name,
            x: x1,
            y: y1,
            width: x2 - x1,
            height: y2 - y1
        })
        layers[i].duplicate(app.activeDocument, ElementPlacement.PLACEATBEGINNING) // 复制图层并移动到当前文档的layers[0]位置
        for (j = 1; j < layers.length; j++) {
            layers[j].visible = false
        }

        try {
            layers[0].remove()
        } catch (e) {
            alert(e)
        }
        cmp.apply() // 还原并删除备份
        cmp.remove()
    }
    return rectArr
}

// 直接输出SVG代码
var exportSVG = function (rectArr, exFolder) {
    // 输出目标
    var svgOut = new File(exFolder + '/output.svg')
    svgOut.encoding = 'UTF-8'
    if (!svgOut.exists) { // 如果指定路径没有
        svgOut.open('w') // 写入模式
    } else {
        svgOut.open('a') // 追加模式
    }

    var textBody = [] // 待写入内容缓存
    var len = rectArr.length
    var tmp = ''

    for (var i = 0; i < len; i++) {
        tmp = '<image xlink:href="images/'
        tmp += rectArr[i].layerName
        tmp += '.png'
        tmp += '" x="'
        tmp += rectArr[i].x
        tmp += '" y="'
        tmp += rectArr[i].y
        tmp += '" width="'
        tmp += rectArr[i].width
        tmp += '" height="'
        tmp += rectArr[i].height
        tmp += '" />'
        textBody.push(tmp)
    }
    // 处理头尾
    var docWidth = UnitValue(app.activeDocument.width).as('px'),
        docHeight = UnitValue(app.activeDocument.height).as('px')
    var svgHead = '<svg xmlns="http://www.w3.org/2000/svg"'
    svgHead += ' xmlns:xlink="http://www.w3.org/1999/xlink"'
    svgHead += (' viewBox="0 0 ' + docWidth + ' ' +  docHeight + '"')
    svgHead += '>'
    textBody.unshift(svgHead)
    textBody.push('</svg>')
    // 拼合字符串
    var text = textBody.join('\n')

    // 写入文本文件, 成功后关闭文件的输入流。
    svgOut.write(text)
    svgOut.close()

}

/* 主进程，出弹框提示选择输出路径，执行处理过程，完成后播放提示音 */
;(function () {
    try {
        var exFolder = Folder.selectDialog('请选择输出文件夹')
        if (exFolder != null) {
            var rect = processing(exFolder.fsName)
            exportHTML(rect, exFolder.fsName)
            app.beep() //成功后播放提示音
        } else {
            alert('文件夹选择有误！')
        }
    } catch (e) {
        alert('抱歉！执行时发生错误！\r\n!!' + e.name + '-> Line ' + e.line + ': ' + e.message + '}')
    }
})()
