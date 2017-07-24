# cutterJsx —— Ps辅助切图脚本

一个简单的 Photshop 切图脚本，主要用于将 PSD 设计稿输出为 PNG 格式的小图片，并生成其相应定位配置的 config.json 文件。


## 使用时注意事项

本脚本相对简单，为了确保输出内容正确，所以在使用前需要简单检查设计稿内容，以保证输出正确：

1. 默认的设计稿宽度和高度分别为 640px 与 1008px，并且图层/组内容都位于可视区域内；
2. 默认按照每页使用单独的数字psd文件，比如第一页就是 1.psd、第二页就是 2.psd ，最后输出的page也会有相应命名为 page_1、page_2 等；
3. 勾选菜单栏的“视图”>“显示”>“图层边缘”，并逐个检查需要切图操作的组件边缘，是否正好包围住要切的部分。如果有个别边框过大的，可能会造成图片尺寸的浪费，这时可以右键点击图层并将其转换为智能对象；
4. 本脚本只对最上层的图层/组进行处理，如果有互相嵌套的组件将被切到图一幅图里；
5. 本脚本只处理可视图层，所以有不想处理的层可以设置为隐藏。有位置相近互相重叠的组件没有关系，只要不在同一个组里就是分开切的；
6. 注意不要有全透明的图层或组，否则脚本可能会报错。


## 使用方法

Ps 中有两种调用脚本的方法，以下任选一种即可：
1. 点击菜单栏中的“文件”>“脚本”>“浏览...”，然后找到该脚本位置运行即可（推荐）；
2. 运行 Extendscript Toolkit，然后点击“File”>“open”，打开该脚本然后点击绿色箭头运行。如果有调试需求比较适合用这种方法。

运行后会出来一个选择输出文件夹的对话框，选择下输出的文件夹之后就会开始自动运行了。生成的 config.json 包含了切出图片的相应大小及定位信息，主要是自己用，可以随便改。

