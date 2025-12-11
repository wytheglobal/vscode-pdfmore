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



## renderView 
```
renderView(view)
    │
    ├─→ FINISHED → return false
    │
    ├─→ PAUSED → set priority + view.resume() → continues
    │
    ├─→ RUNNING → set priority (already rendering)
    │
    └─→ INITIAL → view.draw()
                    │
                    ├─→ Validate state → Set to RUNNING
                    ├─→ Setup layers (text, annotation)
                    ├─→ Create canvas with scaling
                    ├─→ _drawCanvas()
                    │     │
                    │     ├─→ pdfPage.render() → InternalRenderTask
                    │     │     │
                    │     │     ├─→ Wait for operatorList
                    │     │     │
                    │     │     ├─→ initializeGraphics()
                    │     │     │     ├─→ Get canvas context
                    │     │     │     ├─→ Create CanvasGraphics
                    │     │     │     └─→ beginDrawing() (fill background)
                    │     │     │
                    │     │     └─→ operatorListChanged()
                    │     │           │
                    │     │           └─→ _continue()
                    │     │                 │
                    │     │                 └─→ _scheduleNext()
                    │     │                       │
                    │     │                       ├─→ requestAnimationFrame (if display)
                    │     │                       └─→ Promise.resolve() (if print)
                    │     │                             │
                    │     │                             └─→ _next()
                    │     │                                   │
                    │     │                                   ├─→ executeOperatorList()
                    │     │                                   │     (processes PDF operators)
                    │     │                                   │
                    │     │                                   └─→ If not done → _continueBound
                    │     │                                         (loops back)
                    │     │
                    │     └─→ onContinue callback
                    │           ├─→ Check priority
                    │           ├─→ If not highest → PAUSE
                    │           └─→ Otherwise → continue
                    │
                    └─→ After canvas done:  // user created text, annotation, draw ...etc 
                          ├─→ Render text layer
                          ├─→ Render annotation layer
                          ├─→ Render draw layer
                          ├─→ Render annotation editor layer
                          └─→ Set state to FINISHED
```


## How operatorList is Updated
The `operatorList` is built incrementally in chunks via a streaming pipeline from the worker thread to the main thread.

```
┌─────────────────────────────────────────────────────────────┐
│ WORKER THREAD                                               │
├─────────────────────────────────────────────────────────────┤
│ 1. Page.getOperatorList()                                   │
│    └─→ Creates OperatorList(intent, sink)                   │
│                                                             │
│ 2. PartialEvaluator.getOperatorList()                       │
│    └─→ Parses PDF content stream                            │
│        └─→ Calls operatorList.addOp(fn, args) repeatedly    │
│                                                             │
│ 3. OperatorList.addOp()                                     │
│    ├─→ optimizer.push(fn, args)                             │
│    ├─→ Adds to fnArray/argsArray                            │
│    └─→ When weight >= CHUNK_SIZE (1000):                    │
│        └─→ flush()                                          │
│                                                             │
│ 4. OperatorList.flush()                                     │
│    ├─→ Optimizes operator sequences                         │
│    ├─→ streamSink.enqueue(chunk)                            │
│    └─→ Clears fnArray/argsArray (for next chunk)            │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ (Streaming via MessageHandler)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ MAIN THREAD                                                 │
├─────────────────────────────────────────────────────────────┤
│ 5. _pumpOperatorList()                                      │
│    └─→ Creates ReadableStream reader                        │
│        └─→ pump() loop:                                     │
│            └─→ reader.read()                                │
│                                                             │
│ 6. _renderPageChunk(chunk, intentState)                     │
│    ├─→ For each operator in chunk:                          │
│    │     intentState.operatorList.fnArray.push(...)         │
│    │     intentState.operatorList.argsArray.push(...)       │
│    ├─→ Sets lastChunk flag                                  │
│    └─→ Calls operatorListChanged() on all render tasks      │
│                                                             │
│ 7. InternalRenderTask.operatorListChanged()                 │
│    ├─→ If graphics ready:                                   │
│    │     └─→ _continue() → _scheduleNext()                  │
│    └─→ If not ready:                                        │
│          └─→ Wait for initializeGraphics()                  │
│                                                             │
│ 8. executeOperatorList()                                    │
│    └─→ Processes operators from fnArray/argsArray           │
│        └─→ Incrementally executes as chunks arrive          │
└─────────────────────────────────────────────────────────────┘

```
