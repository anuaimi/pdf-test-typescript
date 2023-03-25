import { jsPDF } from "jspdf";

class AppInputs {
  paperSize: string;
  pageSize: string;
  printDateRange: DateRange;

  constructor() {
    this.paperSize = "a4";
    this.pageSize = "a4";
    this.printDateRange = new DateRange();
  }
}

// PageLayout has all details on the layout of the page
class PaperDetails {
  width: number;
  height: number;
  // left_margin: number;
  // right_margin: number;

  constructor() {
    this.width = 0;
    this.height = 0;
    // this.left_margin = 0;
    // this.right_margin = 0;
  }
}

class PageLayout {
  width: number;            // width of the page 
  height: number;           // height of the page
  left_margin: number;      // 
  right_margin: number;
  offsetForHoles: number;
  holesOnLeft: boolean;

  constructor() {
    this.width = 0;
    this.height = 0;
    this.left_margin = 0;
    this.right_margin = 0;
    this.offsetForHoles = 0;
    this.holesOnLeft = true;
  }
}

class DateRange {
  firstDate: Date;
  lastDate: Date;

  constructor() {
    this.firstDate = new Date(2023, 0, 1);      // jan 1st
    this.lastDate = new Date(2023, 11, 31);     // dec 31st
  }
}

// function display_punch_holes(doc: jsPDF, pageLayout: PageLayout,) 
// {
  // 3 holes 
  // center & 2 3/4" on each side, 0.5 in margin for holes
  // 8.5mm from edge, 108mm between each hole, 7mm diameter hole

  // 6 holes
// }


// header will print the header for the page
function header(doc: jsPDF, pageLayout: PageLayout, sectionHeight: number) {

  // TODO: 
  let leftMargin = 0;
  let rightMargin = 0;

  if (pageLayout.holesOnLeft) {
    leftMargin = pageLayout.left_margin+pageLayout.offsetForHoles;
    rightMargin = pageLayout.width-pageLayout.right_margin;
  } else {
    leftMargin = pageLayout.left_margin;
    rightMargin = pageLayout.width-(pageLayout.right_margin+pageLayout.offsetForHoles);
  }

  const yMargin = sectionHeight * 0.25;

  doc.text("Priorities", leftMargin, yMargin);
  doc.rect(leftMargin, sectionHeight*0.4, 10, 10); 
  doc.rect(leftMargin, sectionHeight*0.55, 10, 10); 
  doc.rect(leftMargin, sectionHeight*0.70, 10, 10); 

  const previousSize = doc.getFontSize();
  doc.setFontSize(24);
  doc.text("July 2023", rightMargin, yMargin, {align:"right"});
  doc.setFontSize(previousSize);
}

// body
function body(doc: jsPDF, pageLayout: PageLayout, sectionYOffset: number, sectionHeight: number) {
 
  let leftMargin = 0;
  let rightMargin = 0;
  if (pageLayout.holesOnLeft) {
    leftMargin = pageLayout.left_margin+pageLayout.offsetForHoles;
    rightMargin = pageLayout.right_margin;
  } else {
    leftMargin = pageLayout.left_margin;
    rightMargin = pageLayout.right_margin+pageLayout.offsetForHoles;
  }
  const subSectionHeight = sectionHeight * 0.33;
  console.log(subSectionHeight);
  const ySpacing = sectionHeight * 0.03;

  // day 1
  doc.setLineWidth(0.5);
  console.log(sectionYOffset);
  doc.line(leftMargin, sectionYOffset, pageLayout.width-rightMargin, sectionYOffset); 
  doc.setFontSize(20).text("27", leftMargin, sectionYOffset+ySpacing);
  doc.setFontSize(16).text("Thursday", leftMargin, sectionYOffset+(ySpacing*2));

  // day 2
  let subSectionYOffset = sectionYOffset + subSectionHeight
  doc.line(leftMargin, subSectionYOffset, pageLayout.width-rightMargin, subSectionYOffset); 
  doc.setFontSize(20).text("28", leftMargin, subSectionYOffset+ySpacing);
  doc.setFontSize(16).text("Friday", leftMargin, subSectionYOffset+(ySpacing*2));

  // day 3 + 4
  subSectionYOffset += subSectionHeight;
  doc.line(leftMargin, subSectionYOffset, pageLayout.width-rightMargin, subSectionYOffset); 
  doc.text("29", leftMargin, subSectionYOffset+ySpacing);
  doc.text("Saturday", leftMargin, subSectionYOffset+(ySpacing*2));

  // const start = pageWidth * 0.5;
  // doc.line(start, 150, start, section_height); 
  // doc.text("30", start + margin, 90);
  // doc.text("Sunday", start + margin, 100);

}

// footer will print the footer for the page
function footer(doc:jsPDF, pageLayout: PageLayout, footerOffset: number) {
  
  const footerHeight = pageLayout.height - footerOffset;
  const footerYCentre = footerOffset + footerHeight/2;

  doc.setFontSize(10);
  doc.text("personal planner for Athir Nuaimi", pageLayout.width/2, footerYCentre, {align: "center"}); 
}

// main
function main() {

  // setup user input for app (as we don't have a UI yet)
  const appInputs = new AppInputs();
  appInputs.paperSize = "letter";
  appInputs.pageSize = "letter";
  appInputs.printDateRange.firstDate = new Date(2023, 2, 19);
  appInputs.printDateRange.lastDate = new Date(2023, 2, 25);

  
  // create the document (with 1st page)
  const pageSize = appInputs.paperSize;       // 'letter' or 'a4'
  const pageUnits = "pt";                     // or 'mm', 'in' or others
  let orientation = 'p';                  // default to portrait
  if (appInputs.pageSize == "a5") {
    orientation = "l";                    // portrait - take up entire paper
  }

  // create the PDF - note, 1st param can't be a string so need to use ?
  const doc = new jsPDF(orientation == 'p' ? 'p' : 'l', pageUnits, pageSize, false);

  // get pager size 
  const paperInfo = doc.getPageInfo(1);
  const paperLayout = new PaperDetails();
  paperLayout.width = paperInfo.pageContext.mediaBox.topRightX;
  paperLayout.height = paperInfo.pageContext.mediaBox.topRightY;
  console.log("paper size:",paperLayout.width, paperLayout.height);

  // setup page details
  // can be 1 planner page per paper page or 2 planner pages per paper page  
  const pageLayout = new PageLayout();
  pageLayout.width = paperLayout.width;
  pageLayout.height = paperLayout.height;
  pageLayout.left_margin = pageLayout.width*0.02;
  pageLayout.right_margin = pageLayout.width*0.02;
  pageLayout.offsetForHoles = 72*0.8;                 // 72 pt/in & want 0.8" offset
  
  const headerHeight = paperLayout.height * 0.15;
  header(doc, pageLayout, headerHeight+1);

  const bodyHeight = paperLayout.height * 0.80;
  body(doc, pageLayout, headerHeight, bodyHeight);

  const footerOffset = paperLayout.height * 0.95;
  footer(doc, pageLayout, footerOffset);

  //page two
  doc.addPage();
  header(doc, pageLayout, headerHeight+1);
  body(doc, pageLayout, headerHeight, bodyHeight);
  footer(doc, pageLayout, footerOffset);

  // save the PDF to disk
  doc.save("letter-landscape.pdf");
}

main();
