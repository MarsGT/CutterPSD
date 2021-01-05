/**
 * Created by Liangxiao on 21/1/5.
 */

//@include "lib/json2.min.js"
//@target photoshop
app.preferences.rulerUnits = Units.PIXELS;
app.bringToFront();

// 生成指定位数的序列号(填充0)
function zeroSuppress(num, digit) {
    var tmp = num.toString();
    while (tmp.length < digit) {
        tmp = "0" + tmp;
    }
    return tmp;
}

// 遍历图层中的文本图层
function getLayersText(layers, textArr) {
    for (var i = 0; i < layers.length; i++) {
        if (!layers[i].visible) { // 跳过隐藏图层
            continue;
        } else if (layers[i].typename == "LayerSet") { //判断是否是图层组,是则递归
            getLayersText(layers[i].layers, textArr);
        } else if (layers[i].kind == LayerKind.TEXT) {
            textArr.push(layers[i].textItem.contents);
        }
    }
}

// 输出文本文件
function exportText(layers, infoArr, exFolder) {
    getLayersText(layers, infoArr);

    var jsOut = new File(exFolder + "/textInfo.txt");
    jsOut.encoding = "UTF-8"; // 强制指定编码

    if (!jsOut.exists) { // 如果指定的路径没有该文件
        jsOut.open("w"); // 写入模式
    }

    var text = infoArr.join('\n')

    // 写入到文本文件里
    jsOut.write(text);
    jsOut.close();

}

// 在工作文档中处理所有复制来的图层/组，如果是图层组就先合并，然后裁切并输出
function processing(exFolder) {
    var layers = app.activeDocument.layers;
    var infoArr = [];
    exportText(layers, infoArr, exFolder);
}

/* 主进程，出弹框提示选择输出路径，执行处理过程，完成后播放提示音 */
function Main() {
    try {
        var exFolder = Folder.selectDialog("请选择输出文件夹");
        if (exFolder != null) {
            processing(exFolder.fsName);
            app.beep(); //成功后播放提示音
            app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
        } else {
            alert("文件夹选择有误！");
        }
    } catch (e) {
        alert("抱歉！执行时发生错误！\r\n" + "!!" + e.name + '-> Line ' + e.line + ': ' + e.message);
    }
}

Main();