/**
 * Created by Liangxiao on 22/1/6.
 */

//@target photoshop
app.preferences.rulerUnits = Units.PIXELS
app.bringToFront()

/* 处理所有图层/组 */
var processing = function (exFolder) {
    // 全体图层
    var layers = app.activeDocument.layers
    var len = layers.length
    // 输出目标
    var svgOut = new File(exFolder + '/output.svg')
    svgOut.encoding = 'UTF-8'
    if (!svgOut.exists) {   // 如果指定路径没有
        svgOut.open('w')    // 写入模式
    } else {
        svgOut.open('a')    // 追加模式
    }
    var textBody = []       // 待写入内容缓存
    // 临时变量
    var i, layer, x, x2, y, y2, layerName, width, height
    var svgTmp = ''
    for (i = 0; i < len; i++) {
        // 跳过隐藏图层
        if (!layers[i].visible) {
            continue;
        }
        // 图层缓存
        layer = layers[i]
        // 拿到包围框信息
        x = UnitValue(layer.bounds[0]).as('px')
        y = UnitValue(layer.bounds[1]).as('px')
        x2 = UnitValue(layer.bounds[2]).as('px')
        y2 = UnitValue(layer.bounds[3]).as('px')
        // 其它各种
        layerName = layer.name
        width = x2 - x
        height = y2 - y
        // 生成写入内容
        svgTmp = '<image xlink:href="images/'
        svgTmp += layerName
        svgTmp += '.png'
        svgTmp += '" x="'
        svgTmp += x
        svgTmp += '" y="'
        svgTmp += y
        svgTmp += '" width="'
        svgTmp += width
        svgTmp += '" height="'
        svgTmp += height
        svgTmp += '" />'
        textBody.push(svgTmp)
    }
    // 处理头尾
    var docWidth = UnitValue(app.activeDocument.width).as('px'),
        docHeight = UnitValue(app.activeDocument.height).as('px')
    var svgHead = '<svg xmlns="http://www.w3.org/2000/svg"'
    svgHead += ' xmlns:xlink="http://www.w3.org/1999/xlink"'
    svgHead += (' viewBox="0 0 ' + docWidth + ' ' + docHeight + '"')
    svgHead += '>'
    textBody.reverse(); // 颠倒顺序,按自然层级排列
    textBody.unshift(svgHead)
    textBody.push('</svg>')
    // 拼合字符串
    var finalText = textBody.join('\n')
    // 写入文本文件, 成功后关闭文件的输入流。
    svgOut.write(finalText)
    svgOut.close()
}

/* 主进程，出弹框提示选择输出路径，执行处理过程，完成后播放提示音 */
;(function () {
    try {
        var exFolder = Folder.selectDialog('请选择输出文件夹')
        if (exFolder != null) {
            processing(exFolder.fsName)
            app.beep() //成功后播放提示音
        } else {
            alert('文件夹选择有误！')
        }
    } catch (e) {
        alert('抱歉！执行时发生错误！\r\n!!' + e.name + '-> Line ' + e.line + ': ' + e.message + '}')
    }
})()
