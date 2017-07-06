/**
 * Created by Liangxiao on 17/7/6.
 */

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
    var selectReg = [[x1,y1],[x2,y1],[x2,y2],[x1,y2]];
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
    exp.interlaced　= false;
    exp.PNG8 = false;

    var fileObj = new File(path + name + ".png");
    newDocument.exportDocument(fileObj, ExportType.SAVEFORWEB, exp);
    newDocument.close( SaveOptions.DONOTSAVECHANGES );
}

/* 在工作文档中处理所有复制来的图层/组，如果是图层组就先合并，然后裁切并输出 */
function processing (exFolder) {
    var rectArr = []; // 组件名，定位和宽高
    var layers = app.activeDocument.layers;
    var len = layers.length;
    var i, j, fileIndex = 0;
    var x1, x2, y1, y2, width, height, name, comm;
    var tmp, cmp, boundsArr;
    var pre = app.activeDocument.name;
    pre = pre.replace(".psd", "_");
    for (i = 0; i < len; i++) {
        if (!layers[i].visible) { // 跳过隐藏图层
            continue;
        }
        fileIndex++;
        boundsArr = layers[i].bounds;
        cmp = app.activeDocument.layerComps.add("快照", "", true, true, true);
        x1 = UnitValue(boundsArr[0]).as('px');
        y1 = UnitValue(boundsArr[1]).as('px');
        x2 = UnitValue(boundsArr[2]).as('px');
        y2 = UnitValue(boundsArr[3]).as('px');
        width = x2 - x1;
        height = y2 - y1;
        name = 'page_' + pre + zeroSuppress(fileIndex, 3);
        comm = layers[i].name;
        comm.replace(/[:\/\\*\?\"\<\>\|]/g, "_"); // 非法字符处理
        if (comm.length > 6) { // 留6个字
            comm = comm.substring(0, 6);
        }
        rectArr.push({"name": name, "comm": comm, "x": x1, "y": y1, "w": width, "h": height});
        tmp = layers[i].duplicate(app.activeDocument, ElementPlacement.PLACEATBEGINNING); // 复制图层并移动到当前文档的layers[0]位置
        if (tmp.typename == "LayerSet") {
            layers[0].merge();
        }
        for (j = 1; j < layers.length; j++) {
            layers[j].visible = false;
        }
        savePNG(exFolder + "\\", name, boundsArr);
        
        layers[0].remove();
        cmp.apply();
        cmp.remove();
    }
    return rectArr;
}

/* 构建并输出js配置文件 */
function exportJS(rectArr, exFolder) {
    var jsOut = new File(exFolder + "\\config.js");
    jsOut.encoding = "UTF-8"; // 指定编码
    jsOut.open(jsOut.exists ? "a" : "w", "TEXT", "????"); // 后俩参数是留给Mac的，Windows无用

    var len = rectArr.length;

    var text = '';
    var imgName = '';
    var imgNameTmp = '';
    var domName = '';
    var domNameTmp = '';
    var index = 1;
    var pre = app.activeDocument.name;
    pre = pre.replace(".psd", "");

    for (var i = 0; i < len; i++) {
        imgNameTmp = "\t\t\t" + "\"images/" + rectArr[index-1].name + ".png\",\r\n";
        imgName += imgNameTmp;
        imgNameTmp = '';

        domNameTmp = rectArr[index-1].comm;
        domNameTmp = "\t\t\t\t" + "{type:\"img\", src:\"images/" + rectArr[index-1].name + ".png\", rect:{x:" + rectArr[index-1].x + ", y:" + rectArr[index-1].y + ", w:" + rectArr[index-1].w + ", h:" + rectArr[index-1].h + "}, comment:\"" + domNameTmp + "\", time:0, wait:0, animates:\"\"},\r\n";
        domName += domNameTmp;
        index += 1;
    }

    text += "\r\nvar config = {\r\n";
    text += "\tbasic: {\r\n";
    text += "\t\timages: [\r\n";
    text += imgName;
    text += "\t\t],\r\n";
    text += "\t},\r\n";
    text += "\tpages: [\r\n";
    text += "\t\t{\r\n";
    text += "\t\t\tid:\"page_" + pre + "\",\r\n";
    text += "\t\t\tanimation:[],\r\n";
    text += "\t\t\trect:{x:0,y:0},\r\n";
    text += "\t\t\tdisplay:\"none\",\r\n";
    text += "\t\t\tdom:[\r\n";
    text += domName;
    text += "\t\t\t]\r\n\t\t},\r\n";
    text += "\t]\r\n};\r\n";

    // 写入到文本文件里
    jsOut.write(text);

    //文件写入成功后，关闭文件的输入流。
    jsOut.close();

}

/* 主进程，出弹框提示选择输出路径，执行处理过程，完成后播放提示音 */
function Main () {
    try {
        var exFolder = Folder.selectDialog ("请选择输出文件夹");
        if (exFolder != null) {
            var rect = processing (exFolder.fsName);
            exportJS(rect, exFolder.fsName);
            app.beep(); //成功后播放提示音
        } else {
            alert("文件夹选择有误！");
        }
    } catch(e) {
        $.writeln ("!!" + e.name + '-> Line ' + e.line + ': ' + e.message);
        alert("抱歉！执行时发生错误！");
    }
}

Main();