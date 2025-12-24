"use strict";

(function () {
  function loadConfig() {
    const elem = document.getElementById('pdf-preview-config')
    if (elem) {
      return JSON.parse(elem.getAttribute('data-config'))
    }
    throw new Error('Could not load configuration.')
  }
  function cursorTools(name) {
    if (name === 'hand') {
      return 1
    }
    return 0
  }
  function scrollMode(name) {
    switch (name) {
      case 'vertical':
        return 0
      case 'horizontal':
        return 1
      case 'wrapped':
        return 2
      default:
        return -1
    }
  }
  function spreadMode(name) {
    switch (name) {
      case 'none':
        return 0
      case 'odd':
        return 1
      case 'even':
        return 2
      default:
        return -1
    }
  }

  function setViewerOptions(config) {
    const defaults = config.defaults
    console.log("tomwang defaults", defaults)

    if (!defaults.sidebar) { 
      PDFViewerApplicationOptions.set('sidebarViewOnLoad', 0)
    }
    PDFViewerApplicationOptions.set('defaultZoomValue', 'page-actual')
    PDFViewerApplicationOptions.set('defaultUrl', '')

    // set dynamic options
    // PDFViewerApplication.pdfSidebar.active = 2
  }

  async function reloadPDFDocument(opts) {
    const app = PDFViewerApplication;
    if (!app.pdfDocument) return;
    
    // Capture current state
    const state = {
      page: app.pdfViewer.currentPageNumber,
      scale: app.pdfViewer.currentScaleValue,
      rotation: app.pdfViewer.pagesRotation,
      scrollLeft: app.pdfViewer.container.scrollLeft,
      scrollTop: app.pdfViewer.container.scrollTop,
      url: app.url
    };
    
    /*
    // Reload document
    await app.open({ url: state.url });
    
    // Restore state once pages are ready
    app.eventBus.on('pagesloaded', () => {
      app.pdfViewer.currentScaleValue = state.scale;
      app.pdfViewer.pagesRotation = state.rotation;
      app.pdfViewer.currentPageNumber = state.page;
      
      // Restore scroll position after a small delay
      requestAnimationFrame(() => {
        app.pdfViewer.container.scrollLeft = state.scrollLeft;
        app.pdfViewer.container.scrollTop = state.scrollTop;
      });
    }, { once: true });
    */

    const loadingTask = pdfjsLib.getDocument(opts)
    loadingTask.promise.then(doc => {
      // debugger
      // doc._pdfInfo.fingerprints = [config.path]
      PDFViewerApplication.load(doc)
    }, err => {
      // debugger
    }).then(()=> {
      app.eventBus.on('pagesloaded', () => {
        app.pdfViewer.currentScaleValue = state.scale;
        app.pdfViewer.pagesRotation = state.rotation;
        app.pdfViewer.currentPageNumber = state.page;
        
        app.pdfViewer.container.scrollLeft = state.scrollLeft;
        app.pdfViewer.container.scrollTop = state.scrollTop;
      }, { once: true });
    })
  }


  window.addEventListener('load', async function () {
    const config = loadConfig()
    PDFViewerApplicationOptions.set('cMapUrl', config.cMapUrl)
    PDFViewerApplicationOptions.set('standardFontDataUrl', config.standardFontDataUrl)
    const loadOpts = {
      url:config.path,
      useWorkerFetch: false,
      cMapUrl: config.cMapUrl,
      cMapPacked: true,
      standardFontDataUrl: config.standardFontDataUrl
    }

    setViewerOptions(config)
    PDFViewerApplication.initializedPromise.then(() => {
      const defaults = config.defaults

      const optsOnLoad = () => {
        console.log("tomwang optsOnLoad")
        PDFViewerApplication.pdfCursorTools.switchTool(cursorTools(defaults.cursor))
        PDFViewerApplication.pdfViewer.currentScaleValue = 'page-actual'
        PDFViewerApplication.pdfViewer.scrollMode = scrollMode(defaults.scrollMode)
        PDFViewerApplication.pdfViewer.spreadMode = spreadMode(defaults.spreadMode)
        if (defaults.sidebar) {
          PDFViewerApplication.pdfSidebar.open()
        } else {
          PDFViewerApplication.pdfSidebar.close()
        }
        PDFViewerApplication.eventBus.off('documentloaded', optsOnLoad)
      }
      PDFViewerApplication.eventBus.on('documentloaded', optsOnLoad)
      
      // load() cannot be called before pdf.js is initialized
      // open() makes sure pdf.js is initialized before load()
      PDFViewerApplication.open({url: config.path}).then(async function () {
        // const doc = await pdfjsLib.getDocument(loadOpts).promise
        // doc._pdfInfo.fingerprints = [config.path]
        // PDFViewerApplication.load(doc)
      })
    })

    window.addEventListener('message', async function (msg) {
      if (msg.data && msg.data.type === 'reload') {
        // Refresh all pages
        // PDFViewerApplication.open({url: config.path})
        reloadPDFDocument(loadOpts)
        // PDFViewerApplication.pdfViewer.refresh()
      }
      // PDFViewerApplication.open({url: config.path})
      // Prevents flickering of page when PDF is reloaded
      // const oldResetView = PDFViewerApplication.pdfViewer._resetView
      // PDFViewerApplication.pdfViewer._resetView = function () {
      //   this._firstPageCapability = (0, pdfjsLib.createPromiseCapability)()
      //   this._onePageRenderedCapability = (0, pdfjsLib.createPromiseCapability)()
      //   this._pagesCapability = (0, pdfjsLib.createPromiseCapability)()

      //   this.viewer.textContent = ""
      // }

      // // Changing the fingerprint fools pdf.js into keeping scroll position
      // const doc = await pdfjsLib.getDocument(loadOpts).promise
      // doc._pdfInfo.fingerprints = [config.path]
      // PDFViewerApplication.load(doc)

      // PDFViewerApplication.pdfViewer._resetView = oldResetView
    });
  }, { once: true });

  window.onerror = function () {
    const msg = document.createElement('body')
    msg.innerText = 'An error occurred while loading the file. Please open it again.'
    document.body = msg
  }
}());
