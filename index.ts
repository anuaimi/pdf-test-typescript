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

class BoundingBox {
  left: number;
  right: number;
  top: number;
  height: number;

  constructor() {
    this.left = 0;
    this.right = 0;
    this.top = 0;
    this.height = 0;
  }
}
class DateRange {
  firstDate: Date;
  lastDate: Date;
  numberOfDays: number;
  firstDay: number;     // day of the first date (0-6)
  lastDay: number;      // day of the last date (0-6)

  constructor() {
    this.firstDate = new Date(2023, 0, 1);      // jan 1st
    this.lastDate = new Date(2023, 0, 1);     // jan 1st
    this.firstDay = this.firstDate.getDay();
    this.lastDay = this.lastDate.getDay();
    this.numberOfDays = 0;
  }

  setRange(firstDate: Date, lastDate: Date) {
    this.firstDate = firstDate;
    this.lastDate = lastDate;
    this.numberOfDays = (this.lastDate.getTime() - this.firstDate.getTime()) / (1000 * 60 * 60 * 24);
    this.firstDay = this.firstDate.getDay();
    this.lastDay = this.lastDate.getDay();

    console.log("firstDate: " + this.firstDate.toString());
    console.log("lastDate: " + this.lastDate.toString());
    console.log("number of days", this.numberOfDays);
    console.log("first day", this.firstDay);
    console.log("last day", this.lastDay);
  }

}

// function display_punch_holes(doc: jsPDF, pageLayout: PageLayout,) 
// {
  // 3 holes 
  // center & 2 3/4" on each side, 0.5 in margin for holes
  // 8.5mm from edge, 108mm between each hole, 7mm diameter hole

  // 6 holes
// }


// getPreviousNextMonths - return tuple with 3 dates: last month, current month & next month
//                         note, ignore day of month.  just month and year are correct
function getPreviousNextMonths(givenDate: Date) {

  // create copy & go to prev month
  let previousDate = new Date(givenDate.valueOf());
  previousDate.setDate(0);

  // create copy and go to next month
  let nextDate = new Date(givenDate.valueOf());
  nextDate.setDate(32);

  return [previousDate, givenDate, nextDate];
}

function drawCalendar(doc: jsPDF, size: BoundingBox, month: number, year: number) {

  const firstDay = new Date(year, month, 1);
  firstDay.getDay();

  // month name at top
  // divide bounding box into 7 columns
  // find day of 1st of month.  that defines the column
  let xOffset = 0;
  let yOffset = 0;
  let columnWidth = 10;
  let day: number;
  let givenDate = new Date(year, month, 1);
  for (let i = 1; i <= 31; i++) {

    day = new Date(year, month, i).getDay();
    console.log(day);
    xOffset = day * columnWidth;
    doc.setFontSize(7).text(i.toString(), size.left+xOffset, size.top+yOffset);

    if (day == 6) {
      // increment yOffice
      yOffset += 10;
    }
  }


  // doc.setFontSize(7).text("1  2  3   4  5  6  7", size.left, size.height);
  // doc.setFontSize(7).text("8  9  10 11 12 13 14", size.left, size.height+20);
  doc.setFontSize(16);
}

function leftSideHeader(doc: jsPDF, pageLayout: PageLayout, sectionHeight: number, currentDate: Date) {

  let leftMargin: number;
  let rightMargin: number;

  if (pageLayout.holesOnLeft) {
    leftMargin = pageLayout.left_margin+pageLayout.offsetForHoles;
    rightMargin = pageLayout.width-pageLayout.right_margin;
  } else {
    leftMargin = pageLayout.left_margin;
    rightMargin = pageLayout.width-(pageLayout.right_margin+pageLayout.offsetForHoles);
  }
  
  let objectLayout = new BoundingBox;

  const oldColor = doc.getDrawColor();
  doc.setDrawColor(40, 40, 40);

  const [prevDate, givenDate, nextDate] = getPreviousNextMonths(currentDate);

  let month = prevDate.getMonth();
  let year = prevDate.getFullYear();
  const calendarWidthHeight = sectionHeight * 0.7
  
  let boundingBox = new BoundingBox;
  boundingBox.left = leftMargin;
  boundingBox.right = leftMargin+80;
  boundingBox.top = calendarWidthHeight;
  boundingBox.height = calendarWidthHeight;

  drawCalendar(doc, boundingBox, month, year);

  doc.rect(leftMargin, sectionHeight*0.2, calendarWidthHeight, calendarWidthHeight); 
  let offset = calendarWidthHeight + 10;
  doc.rect(leftMargin+offset, sectionHeight*0.2, calendarWidthHeight, calendarWidthHeight); 
  offset += calendarWidthHeight + 10;
  doc.rect(leftMargin+offset, sectionHeight*0.2, calendarWidthHeight, calendarWidthHeight); 

  doc.setDrawColor(oldColor);

}

// header will print the header for the page
function rightSideHeader(doc: jsPDF, pageLayout: PageLayout, sectionHeight: number, currentDate: Date) {

  const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
  ];

  let leftMargin: number;
  let rightMargin: number;

  if (pageLayout.holesOnLeft) {
    leftMargin = pageLayout.left_margin+pageLayout.offsetForHoles;
    rightMargin = pageLayout.width-pageLayout.right_margin;
  } else {
    leftMargin = pageLayout.left_margin;
    rightMargin = pageLayout.width-(pageLayout.right_margin+pageLayout.offsetForHoles);
  }

  const yMargin = sectionHeight * 0.25;

  doc.setFontSize(14).text("Priorities", leftMargin, yMargin);
  doc.rect(leftMargin, sectionHeight*0.4, 10, 10); 
  doc.rect(leftMargin, sectionHeight*0.55, 10, 10); 
  doc.rect(leftMargin, sectionHeight*0.70, 10, 10); 

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const previousSize = doc.getFontSize();
  doc.setFontSize(24);
  doc.text(`${monthNames[month]} ${year}`, rightMargin, yMargin, {align:"right"});
  doc.setFontSize(previousSize);
}

// drawDayBox
function drawDayBox(doc: jsPDF, boundingBox: BoundingBox, givenDay : Date) {

  const indent = 7;
  const ySpacing = boundingBox.height * 0.025;

  // line at top
  doc.setLineWidth(0.5);
  doc.line(boundingBox.left, boundingBox.top, boundingBox.right, boundingBox.top); 

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dateOfMonth = givenDay.getDate();
  const dayOfWeek = givenDay.getDay();
  const day = daysOfWeek[dayOfWeek];

  // date and day of week
  doc.setFontSize(20).text(dateOfMonth.toString(), boundingBox.left+indent, boundingBox.top+ySpacing);
  doc.setFontSize(16).text(day, boundingBox.left+indent, boundingBox.top+(ySpacing*2));

}

function getFirstDate( givenDate: Date) {

  // want monday to be 1st day not Sunday
  // and want 1 to be 1st value not 0
let day = givenDate.getDay();
  day = (day == 0) ? 7 : day

  let firstDayOfWeek = new Date();
  if (day <= 3) {
    // M T W on one page
    firstDayOfWeek.setDate( givenDate.getDate() - (day-1));
  } else {
    // Th F S & S on another page
    firstDayOfWeek.setDate( givenDate.getDate() - (day-4));
  }

  return firstDayOfWeek;
}

//  body
function body(doc: jsPDF, pageLayout: PageLayout, sectionYOffset: number, sectionHeight: number, currentDate: Date) {
 
  // look at day of week
  // if < 2
    // calc day 0
    // display day 0 1 2
  // else
    // display day 3 4 5 6

  let leftMargin = 0;
  let rightMargin = 0;
  if (pageLayout.holesOnLeft) {
    leftMargin = pageLayout.left_margin+pageLayout.offsetForHoles;
    rightMargin = pageLayout.right_margin;
  } else {
    leftMargin = pageLayout.left_margin;
    rightMargin = pageLayout.right_margin+pageLayout.offsetForHoles;
  }
  const centrePoint = pageLayout.width/2;
  const subSectionHeight = sectionHeight * 0.33;
  const ySpacing = sectionHeight * 0.03;

  const indent = 7;

  let firstDay = getFirstDate(currentDate);

  let boundingBox = {
    left: leftMargin,
    right: pageLayout.width-rightMargin,
    top: sectionYOffset,
    height: sectionYOffset + sectionHeight
  }
  // drawDayBox(doc, boundingBox, 27, "Thursday");
  drawDayBox(doc, boundingBox, firstDay);

  let nextDay = new Date();
  nextDay.setDate(firstDay.getDate() + 1);
  boundingBox.top = sectionYOffset + subSectionHeight;
  drawDayBox(doc, boundingBox, nextDay);

  nextDay.setDate(nextDay.getDate() + 1);
  boundingBox.top = sectionYOffset + subSectionHeight*2;
  boundingBox.right = centrePoint;
  drawDayBox(doc, boundingBox, nextDay);

  let subSectionYOffset = sectionYOffset + (subSectionHeight*2);
  doc.line(centrePoint, subSectionYOffset, centrePoint, subSectionYOffset+subSectionHeight);

  nextDay.setDate(nextDay.getDate() + 1);
  boundingBox.left = centrePoint;
  boundingBox.right = pageLayout.width-rightMargin;
  drawDayBox(doc, boundingBox, nextDay);

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
  appInputs.printDateRange.setRange( new Date(2023, 2, 19), new Date(2023, 2, 27));

  // calculate # of weeks
  const timeDiff = (appInputs.printDateRange.lastDate.getTime() - appInputs.printDateRange.firstDate.getTime());
  const numberOfDays = timeDiff/(1000.0*60*60*24)+1;        // convert from msec to days & add 1 extra day
  const firstDayOfRange = appInputs.printDateRange.firstDate.getDay();
  const lastDayOfRange = appInputs.printDateRange.lastDate.getDay();
  const numberOfWeeks = Math.ceil((appInputs.printDateRange.firstDay + appInputs.printDateRange.numberOfDays) / 7);
  console.log("number of weeks:", numberOfWeeks);

  // create PDF (and 1st page)

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

  // set page layout

  // setup page details
  // can be 1 planner page per paper page or 2 planner pages per paper page  
  const pageLayout = new PageLayout();
  pageLayout.width = paperLayout.width;
  pageLayout.height = paperLayout.height;
  pageLayout.left_margin = pageLayout.width*0.02;
  pageLayout.right_margin = pageLayout.width*0.02;
  pageLayout.offsetForHoles = 72*0.8;                 // 72 pt/in & want 0.8" offset
  
  const headerHeight = paperLayout.height * 0.15;
  const bodyHeight = paperLayout.height * 0.80;
  const footerOffset = paperLayout.height * 0.95;

  // start generating the pages
  let pageNumber = 0;
  let currentDate = appInputs.printDateRange.firstDate
  for (let week = 1; week <= numberOfWeeks; week++) {


    const day = currentDate.getDay();
    console.log("current day: ", day);

    // see if current week includes M T or W
    // only print if 
    if ((day <= 2) && (week == 1) || (week > 1)){
      
      if (pageNumber > 0) {
        doc.addPage();
      } 

      // start with 1st (left) page
      console.log("printing left page for week ", week);
      console.log(currentDate.toString());
        
      leftSideHeader(doc, pageLayout, headerHeight+1, currentDate);
      body(doc, pageLayout, headerHeight, bodyHeight, currentDate);
      footer(doc, pageLayout, footerOffset);

      pageNumber += 1;
    }
    
    if ((week < numberOfWeeks) || (lastDayOfRange > 2) && (week == numberOfWeeks)) {
      // print 2nd (right) page 
      if (pageNumber > 0) {
        doc.addPage();

        rightSideHeader(doc, pageLayout, headerHeight+1, currentDate);
        body(doc, pageLayout, headerHeight, bodyHeight, currentDate);
        footer(doc, pageLayout, footerOffset);

      } 
      console.log("printing right page for week ", week);
      pageNumber += 1;
    }

    currentDate.setDate( currentDate.getDate() + 7);
    console.log("new date: ", currentDate.toString())
  }
  console.log(pageNumber, " total pages");

  // save the PDF to disk
  doc.save("letter-landscape.pdf");
}

main();
