// If absolute URL from the remote server is provided, configure the CORS
// header on that server.
var url = './KARM-2019.pdf';

// Loaded via <script> tag, create shortcut to access PDF.js exports.
var pdfjsLib = window['pdfjs-dist/build/pdf'];

// The workerSrc property shall be specified.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

var pdfDoc = null,
    pageNum = 1,
    pageTot = null,
    pageRendering = false,
    pageNumPending = null,
    scale = 1,
    canvas = document.getElementById('the-canvas'),
    ctx = canvas.getContext('2d');

/**
 * Get page info from document, resize canvas accordingly, and render page.
 * @param num Page number.
 */
function renderPage(num, anim = true) {

  pageRendering = true;

  // Using promise to fetch the page
  pdfDoc.getPage(num).then(function(page) {
    
    let viewport = page.getViewport({scale: scale});
    /*let viewport = page.getViewport({scale: 1});

    console.log("first viewport", viewport);

    if (viewport.width / window.innerWidth > viewport.height / window.innerHeight ) {

      if ( viewport.width < window.innerWidth * 0.95 ) {

        console.log("1")

        viewport = page.getViewport({ scale: window.innerWidth * 0.95 / viewport.width  });

      } else {

        console.log("2")

        viewport = page.getViewport({ scale: viewport.width /  window.innerWidth * 0.95 });

      }

    } else {

      if (viewport.height < window.innerHeight * 0.95 ) {

        console.log("3")

        viewport = page.getViewport({ scale: window.innerHeight* 0.95 / viewport.height });

      } else {

        console.log("4")

        viewport = page.getViewport({ scale:  viewport.height / window.innerHeight* 0.95 });

      }

    }

    console.log("second viewport", viewport);*/

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    /*if ( viewport.width / window.innerWidth > viewport.height / window.innerHeight && viewport.width > window.innerWidth * 0.8 ) {

      canvas.width = window.innerWidth * 0.8;
      canvas.height = viewport.height * ((window.innerWidth*0.8) / viewport.width); 

    } else if (viewport.width / window.innerWidth < viewport.height / window.innerHeight && viewport.height > window.innerHeight * 0.8 ) {

      canvas.height = window.innerheight * 0.8;
      canvas.width = viewport.width * ((window.innerHeight*0.8) / viewport.height ); 

    } else {

      canvas.height = viewport.height;
      canvas.width = viewport.width;

    }*/

    // Render PDF page into canvas context
    var renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };
    var renderTask = page.render(renderContext);

    // Wait for rendering to finish
    renderTask.promise.then(function() {
      pageRendering = false;
      if (pageNumPending !== null) {
        // New page rendering is pending
        renderPage(pageNumPending);
        
        pageNumPending = null;
      }
    });
  });

  // Update page counters
  document.getElementById('page_num').textContent = num;
  
  if (anim) { playFlipAnimation() }
}

/**
 * If another page rendering in progress, waits until the rendering is
 * finised. Otherwise, executes rendering immediately.
 */
function queueRenderPage(num) {
  if (pageRendering) {
    pageNumPending = num;
  } else {
    renderPage(num);
  }
}

/**
 * Displays previous page.
 */
function onPrevPage() {

  if (pageNum <= 1) {
    return;
  }
  pageNum--;
  queueRenderPage(pageNum);
}

/**
 * Displays next page.
 */
function onNextPage() {

  if (pageNum >= pdfDoc.numPages) {
    return;
  }
  pageNum++;
  queueRenderPage(pageNum);
}

function goToPage(num) {

  pageNum = num;
  queueRenderPage(pageNum);

}

/**
 * Asynchronously downloads PDF.
 */

document.getElementById('fileinput').addEventListener('change', (e) => {
  
  if (window.File && window.FileReader && window.FileList && window.Blob) {

    reader = new FileReader();

    reader.onload = function (e) {
      
      output = e.target.result;
      
      getDocument({data: output});

      /*pdfjsLib.getDocument(output).promise.then(function(pdfDoc_) {
        pdfDoc = pdfDoc_;
        document.getElementById('page_count').textContent = pdfDoc.numPages;
      
        document.getElementById('fileinput').style.display = "none";
        document.getElementById('the-canvas').style.display = "block";
        // Initial/first page rendering
        renderPage(pageNum);
      });*/

    };
    
    reader.readAsArrayBuffer(e.target.files[0]);

    return true; 

  } else {

    alert('The File APIs are not fully supported by your browser. Please update your browser.');
    return false;

  }

});

const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());

if (params.pdfurl) {

  getDocument({url: params.pdfurl});

  /*pdfjsLib.getDocument(params.pdfurl).promise.then(function(pdfDoc_) {
    pdfDoc = pdfDoc_;
    pageTot = pdfDoc.numPages;
    document.getElementById('page_count').textContent = pdfDoc.numPages;
  
    document.getElementById('fileinput').style.display = "none";
    document.getElementById('the-canvas').style.display = "block";
    // Initial/first page rendering
    renderPage(pageNum);
  });*/

}

if (params.pdfurl && params.download != "false") {

  document.getElementById('button-download').style.display = "flex";

}

if (params.scale) {

  scale = parseFloat(params.scale);

}

function getDocument(params) {

  console.log("params", params);
  
  pdfjsLib.getDocument({
    ...params,
    width: window.innerWidth * 0.8,
    height: window.innerHeight * 0.8   
  }).promise.then(function(pdfDoc_) {
    
    pdfDoc = pdfDoc_;
    document.getElementById('page_count').textContent = pdfDoc.numPages;
      
    document.getElementById('fileinput').style.display = "none";
    document.getElementById('the-canvas').style.display = "block";
      
    renderPage(pageNum);

  });

}

function playFlipAnimation() {

  document.getElementById('the-canvas').style.animationName = "";

  setInterval(() => {
    document.getElementById('the-canvas').style.animationName = "flip";
  }, 200);
  

}

if (!document.getElementById('canvas-container').requestFullscreen) {

  document.getElementById('button-activate-fullscreen').style.display == "none";
  
}

function activateFullscreen() {

  let elem = document.getElementById('canvas-container')

  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  }

}

function userPickPage() {

  let num = parseInt(prompt("Go to page:"))

  if (typeof num == "number" && num <= pageTot) {

    console.log("num", num);

    if (num == 0) {

      goToPage(1);

    } else if (num < 0 && pageTot + num + 1 > 0) {

      goToPage(pageTot + num + 1);

    } else if (num > 0) {

      goToPage(num);

    }

  }

}
  
function setBrightnessFull() {

  document.getElementById("the-canvas").style.filter = "brightness(100%)";

  document.getElementById("button-brightness-full").style.display = "none";
  document.getElementById("button-brightness-low").style.display = "block";

}

function setBrightnessLow() {

  document.getElementById("the-canvas").style.filter = "brightness(80%)";

  document.getElementById("button-brightness-low").style.display = "none";
  document.getElementById("button-brightness-full").style.display = "block";

}

function changeScale(change) {

  scale += parseFloat(change);
  renderPage(pageNum, false)

}