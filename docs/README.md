## initialization

pdf.mjs `render` --- GetOperatorList --- pdf.worker.mjs `getOperatorList`


pdf.mjs
1. 渲染是延迟渲染的，默认渲染首2页面
2. this._pages 存储了 PDFPageView 对象

1. updte
2. renderHighestPriority
3. forceRendering -> this.renderingQueue.renderView -> view.draw()
                                                            |
                     this.renderHighestPriority()   <-      |
