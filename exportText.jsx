/**
 * Created by Liangxiao on 21/1/5.
 */

//@include "lib/json2.min.js"
//@target photoshop
app.preferences.rulerUnits = Units.PIXELS;
app.bringToFront();

// 处理过程:将当前图层内容复制到系统剪贴板
function processing(layer) {
    var exFolder = Folder.selectDialog("请选择输出文件夹");
    if (exFolder != null) {
        var text = layer.textItem.contents;
        // 选择文件夹
        var txtOut = new File(exFolder + "/exportText.txt");
        txtOut.encoding = "UTF-8";
        // 如果指定路径没有
        if (!txtOut.exists) {
            txtOut.open("w"); // 写入模式
        } else {
            txtOut.open("a"); // 追加模式
        }
        // 写入文本文件, 成功后关闭文件
        txtOut.write(text);
        txtOut.close();
    } else {
        alert("文件夹选择有误！");
    }
}

/* 主进程，执行处理过程，完成后播放提示音 */
function Main() {
    try {
        var textLayer = app.activeDocument.activeLayer;
        if (textLayer.kind == LayerKind.TEXT) {
            processing(textLayer);
            app.beep(); //成功后播放提示音
        } else {
            alert("当前图层不是文本图层！");
        }
    } catch (e) {
        alert("抱歉！执行时发生错误！\r\n" + "!!" + e.name + '-> Line ' + e.line + ': ' + e.message);
    }
}

Main();