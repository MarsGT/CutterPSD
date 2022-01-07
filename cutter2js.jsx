/**
 * Created by Liangxiao on 17/7/6.
 */

//@include "lib/json2.min.js"
//@target photoshop
app.preferences.rulerUnits = Units.PIXELS;
app.bringToFront();

/* 生成指定位数的序列号（填充0） */
function zeroSuppress(num, digit) {
    var tmp = num.toString();
    while (tmp.length < digit) {
        tmp = "0" + tmp;
    }
    return tmp;
}

/* 存储PNG */
function savePNG(path, name, crArr) {
    var x1 = UnitValue(crArr[0]).as('px'),
        y1 = UnitValue(crArr[1]).as('px'),
        x2 = UnitValue(crArr[2]).as('px'),
        y2 = UnitValue(crArr[3]).as('px');
    var selectReg = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]];
    app.activeDocument.selection.select(selectReg);
    app.activeDocument.selection.copy(true);
    app.activeDocument.selection.deselect();

    var width = x2 - x1;
    var height = y2 - y1;
    var resolution = 72;
    var docName = "切图用临时文档";
    var mode = NewDocumentMode.RGB;
    var initialFill = DocumentFill.TRANSPARENT;
    preferences.rulerUnits = Units.PIXELS;
    var newDocument = documents.add(width, height, resolution, docName, mode, initialFill);
    newDocument.paste();

    var exp = new ExportOptionsSaveForWeb();
    exp.format = SaveDocumentType.PNG;
    exp.interlaced = false;
    exp.PNG8 = false;

    var folderImg = new Folder(path);
    if (!folderImg.exists) { folderImg.create(); }
    var fileObj = new File(folderImg.fsName + '/' + name + ".png");
    newDocument.exportDocument(fileObj, ExportType.SAVEFORWEB, exp);
    newDocument.close(SaveOptions.DONOTSAVECHANGES);
}

/* 在工作文档中处理所有复制来的图层/组，如果是图层组就先合并，然后裁切并输出 */
function processing(exFolder) {
    var rectArr = []; // 组件名，定位和宽高
    var layers = app.activeDocument.layers;
    var len = layers.length;
    var i, j, fileIndex = 0;
    var x1, x2, y1, y2, width, height, name;
    var tmp, cmp, boundsArr;
    var psdName = app.activeDocument.name;
    psdName = psdName.replace(".psd", "");
    for (i = 0; i < len; i++) {
        if (!layers[i].visible) { // 跳过隐藏图层
            continue;
        }
        fileIndex++;
        boundsArr = layers[i].bounds;
        cmp = app.activeDocument.layerComps.add("快照", "", true, true, true); // 使用图层复合做备份
        x1 = UnitValue(boundsArr[0]).as('px');
        y1 = UnitValue(boundsArr[1]).as('px');
        x2 = UnitValue(boundsArr[2]).as('px');
        y2 = UnitValue(boundsArr[3]).as('px');
        width = x2 - x1;
        height = y2 - y1;
        name = 'item_' + zeroSuppress(fileIndex, 3);
        rectArr.push({ "n": name, "l": layers[i].name, "x": x1, "y": y1, "cx": (x1 + ~~(width / 2)), "cy": (y1 + ~~(height / 2)), "w": width, "h": height });
        tmp = layers[i].duplicate(app.activeDocument, ElementPlacement.PLACEATBEGINNING); // 复制图层并移动到当前文档的layers[0]位置
        if (tmp.typename == "LayerSet") {
            layers[0].merge();
        }
        for (j = 1; j < layers.length; j++) {
            layers[j].visible = false;
        }
        savePNG(exFolder + "/" + psdName + "/", name, boundsArr);

        try {
            layers[0].remove();
        } catch (e) {
            
        }
        cmp.apply(); // 还原并删除备份
        cmp.remove();
    }
    return rectArr;
}

// 直接输出js代码
function exportJS(rectArr, exFolder) {
    var psdName = app.activeDocument.name;
    psdName = psdName.replace(".psd", "");

    var jsOut = new File(exFolder + "/" + psdName + ".js");
    jsOut.encoding = "UTF-8"; // 强制指定编码

    var text = "const " + psdName + " = new Phaser.Scene('" + psdName + "')\n\n" + psdName + ".create = function () {\n"; // 待写入内容的字符串
    var textBody = []; // 待写入内容缓存

    if (!jsOut.exists) { // 如果指定的路径没有config.js文件
        jsOut.open("w"); // 写入模式
    }

    var imageTmp = "";
    var len = rectArr.length;

    for (var i = 0; i < len; i++) {
        imageTmp = "\tthis.add.image(" + rectArr[i].cx + ", " + rectArr[i].cy + ", '" + psdName + "_" + rectArr[i].l + "')";
        textBody.push(imageTmp);
    }
    textBody.reverse(); // 颠倒顺序,按自然层级排列

    text += textBody.join('\n');
    text += "\n}\n";

    // 写入到文本文件里
    jsOut.write(text);

    //文件写入成功后，关闭文件的输入流。
    jsOut.close();

}

/* 主进程，出弹框提示选择输出路径，执行处理过程，完成后播放提示音 */
function Main() {
    try {
        var exFolder = Folder.selectDialog("请选择输出文件夹");
        if (exFolder != null) {
            var rect = processing(exFolder.fsName);
            exportJS(rect, exFolder.fsName);
            app.beep(); //成功后播放提示音
            app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
        } else {
            alert("文件夹选择有误！");
        }
    } catch (e) {
        $.writeln("!!" + e.name + '-> Line ' + e.line + ': ' + e.message);
        alert("抱歉！执行时发生错误！\r\n" + "!!" + e.name + '-> Line ' + e.line + ': ' + e.message);
    }
}

Main();