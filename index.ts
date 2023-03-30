import { jsPDF } from "jspdf";
import { program, Option} from "commander";
import process from "node:process";

const monthNames = ["January", "February", "March", "April", "May", "June",
"July", "August", "September", "October", "November", "December"
];

const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// AppInputs has the parameters for how to print the planner pages
class AppConfig {
  paperSize: string;          // actual paper printing on
  pageSize: string;           // page size. can be the same as paper size or smaller (ie a5)
  printDateRange: DateRange;  // date range of planner pages to print
  singleSided: boolean;       // whether will be printed out as single-sided or double-sided

  constructor() {
    this.paperSize = "a4";
    this.pageSize = "a4";
    this.printDateRange = new DateRange();
    this.singleSided = true;
  }
}

// PageLayout has all details on the paper that the planner pages will be printed on
class PaperDetails {
  width: number;            // in points (pt)
  height: number;
  leftMargin: number;
  rightMargin: number;

  constructor() {
    this.width = 0;
    this.height = 0;
    this.leftMargin = 0;
    this.rightMargin = 0;
  }
}

class PageLayout {
  width: number;            // width of the page 
  height: number;           // height of the page
  leftMargin: number;       // 
  rightMargin: number;
  offsetForHoles: number;   // how much space to reserve for hole guides 
  holesOnLeft: boolean;     // are holes on left (or right) side of the page

  constructor() {
    this.width = 0;
    this.height = 0;
    this.leftMargin = 0;
    this.rightMargin = 0;
    this.offsetForHoles = 72*0.75;  // 3/4" of inch
    this.holesOnLeft = true;
  }
}

// DrawArea - bounding box to draw to.  used for sections of page
class DrawArea {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor() {
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
  }
}

// DateRange - start and end dates to print planner pages for
class DateRange {
  firstDate: Date;
  firstDay: number;     // day of the first date (0-6)
  lastDate: Date;
  lastDay: number;      // day of the last date (0-6)
  numberOfDays: number;
  numberOfWeeks: number;

  constructor() {
    // default to current year
    const currentDate = new Date();
    const firstDate =  new Date(currentDate.getFullYear(), 0, 1);
    const lastDate = new Date(currentDate.getFullYear(), 11, 31);    // dec 31st

    this.firstDate = new Date();
    this.firstDay = 0;
    this.lastDate = new Date();
    this.lastDay = 0;
    this.numberOfDays = 0;
    this.numberOfWeeks = 0;

    this.setRange( firstDate, lastDate);
  }

  setRange(firstDate: Date, lastDate: Date) {
    this.firstDate = firstDate;
    this.lastDate = lastDate;

    this.numberOfDays = (this.lastDate.getTime() - this.firstDate.getTime()) / (1000 * 60 * 60 * 24);
    this.numberOfWeeks = Math.ceil((this.firstDay + this.numberOfDays) / 7);

    this.firstDay = this.firstDate.getDay();
    this.lastDay = this.lastDate.getDay();

    // console.log("firstDate: " + this.firstDate.toString());
    // console.log("lastDate: " + this.lastDate.toString());
    // console.log("number of days", this.numberOfDays);
    // console.log("first day", this.firstDay);
    // console.log("last day", this.lastDay);
  }
}

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

// drawCalendar - draws calendar for a given month and year
function drawCalendar(doc: jsPDF, size: DrawArea, month: number, year: number) {

  // month name at top
  // divide bounding box into 7 columns
  // find day of 1st of month.  that defines the column

  let xOffset = 0;
  let yOffset = 0;
  let columnWidth = 12;
  let centrePoint = size.width/2;
  let day: number;
  let givenDate = new Date(year, month, 1);

  doc.setFontSize(8).text(monthNames[givenDate.getMonth()], size.x+centrePoint, size.y+yOffset,  {align: "center"});
  yOffset += 10;

  const title = "SMTWTFSS"
  for (let i = 0; i < 7; i++){
    xOffset = i * columnWidth;
    doc.setFontSize(8).text(title[i], size.x+xOffset, size.y+yOffset, {align: "center"});
  }
  yOffset += 10;

  let daysInMonth = monthDays[month];
  if (month == 1) {     // feb
    // check for leap year
    if ((year % 100 === 0) ? (year % 400 === 0) : (year % 4 === 0)) {
      daysInMonth = 29;
    }
  }
  // print each day of the month
  for (let i = 1; i <= daysInMonth; i++) {

    day = new Date(year, month, i).getDay();
    xOffset = day * columnWidth;
    doc.setFontSize(8).text(i.toString(), size.x+xOffset, size.y+yOffset, {align: "center"});

    if (day == 6) {
      // increment yOffice
      yOffset += 10;
    }
  }

  doc.setFontSize(16);
}

function leftSideHeader(doc: jsPDF, pageLayout: PageLayout, sectionHeight: number, currentDate: Date) {

  let leftMargin: number;
  let rightMargin: number;

  if (pageLayout.holesOnLeft) {
    leftMargin = pageLayout.leftMargin+pageLayout.offsetForHoles;
    rightMargin = pageLayout.width-pageLayout.rightMargin;
  } else {
    leftMargin = pageLayout.leftMargin;
    rightMargin = pageLayout.width-(pageLayout.rightMargin+pageLayout.offsetForHoles);
  }
  
  const oldColor = doc.getDrawColor();
  doc.setDrawColor(40, 40, 40);

  const [prevDate, givenDate, nextDate] = getPreviousNextMonths(currentDate);

  let month = prevDate.getMonth();
  let year = prevDate.getFullYear();
  const calendarWidthHeight = sectionHeight * 0.7
  
  let boundingBox = new DrawArea;
  boundingBox.x = leftMargin;
  boundingBox.y = 30;
  boundingBox.width = 80;
  boundingBox.height = calendarWidthHeight;
  drawCalendar(doc, boundingBox, month, year);

  month = givenDate.getMonth();
  year = givenDate.getFullYear();
  let offset = calendarWidthHeight + 10;
  boundingBox.x = leftMargin + offset
  boundingBox.width = 80;
  drawCalendar(doc, boundingBox, month, year);

  month = nextDate.getMonth();
  year = nextDate.getFullYear();
  offset += calendarWidthHeight + 10;
  boundingBox.x = leftMargin + offset
  boundingBox.width = 80;
  drawCalendar(doc, boundingBox, month, year);

  doc.setDrawColor(oldColor);

}

// header will print the header for the page
function rightSideHeader(doc: jsPDF, pageLayout: PageLayout, sectionHeight: number, currentDate: Date) {

  let leftMargin: number;
  let rightMargin: number;

  if (pageLayout.holesOnLeft) {
    leftMargin = pageLayout.leftMargin+pageLayout.offsetForHoles;
    rightMargin = pageLayout.width-pageLayout.rightMargin;
  } else {
    leftMargin = pageLayout.leftMargin;
    rightMargin = pageLayout.width-(pageLayout.rightMargin+pageLayout.offsetForHoles);
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
function drawDayBox(doc: jsPDF, boundingBox: DrawArea, givenDay : Date) {

  const indent = 7;
  const ySpacing = boundingBox.height * 0.025;

  // line at top
  doc.setLineWidth(0.5);
  doc.line(boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.y); 

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dateOfMonth = givenDay.getDate();
  const dayOfWeek = givenDay.getDay();
  const day = daysOfWeek[dayOfWeek];

  // date and day of week
  doc.setFontSize(20).text(dateOfMonth.toString(), boundingBox.x+indent, boundingBox.y+ySpacing);
  doc.setFontSize(16).text(day, boundingBox.x+indent, boundingBox.y+(ySpacing*2));

}

// getDateAtTopOfPage - for a given date, return which date is at 
//                      the top of the page (that includes given date)
function getDateAtTopOfPage( givenDate: Date) {

  // top of page is either monday or thursday

  // make sunday 7 rather than 0
  let day = givenDate.getDay();
  day = (day == 0) ? 7 : day

  let dateAtTop = new Date(givenDate.valueOf());
  // M T W on one page
  if (day <= 3) {
    dateAtTop.setDate( givenDate.getDate() - (day-1));
  } else {
    // Th F S & S on another page
    dateAtTop.setDate( givenDate.getDate() - (day-4));
  }
  console.log("firstDayOfWeek: ", dateAtTop.getDay());
  return dateAtTop;
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
    leftMargin = pageLayout.leftMargin+pageLayout.offsetForHoles;
    rightMargin = pageLayout.rightMargin;
  } else {
    leftMargin = pageLayout.leftMargin;
    rightMargin = pageLayout.rightMargin+pageLayout.offsetForHoles;
  }
  const centrePoint = pageLayout.width/2;
  const subSectionHeight = sectionHeight * 0.33;
  const ySpacing = sectionHeight * 0.03;

  const indent = 7;

  let firstDay = getDateAtTopOfPage(currentDate);


  let boundingBox = {
    x: leftMargin,
    width: pageLayout.width-(leftMargin+rightMargin),
    y: sectionYOffset,
    height: sectionYOffset + sectionHeight
  }
  drawDayBox(doc, boundingBox, firstDay);

  let nextDay = new Date(firstDay.valueOf());
  nextDay.setDate(firstDay.getDate() + 1);
  boundingBox.y = sectionYOffset + subSectionHeight;
  drawDayBox(doc, boundingBox, nextDay);


  // do we do this or not!!
  if (nextDay.getDay() > 3) {
    nextDay.setDate(nextDay.getDate() + 1);
    boundingBox.y = sectionYOffset + subSectionHeight*2;
    boundingBox.width = centrePoint;
    drawDayBox(doc, boundingBox, nextDay);
  
    let subSectionYOffset = sectionYOffset + (subSectionHeight*2);
    doc.line(centrePoint, subSectionYOffset, centrePoint, subSectionYOffset+subSectionHeight);
  
    nextDay.setDate(nextDay.getDate() + 1);
    boundingBox.x = centrePoint;
    boundingBox.width = pageLayout.width-rightMargin;
    drawDayBox(doc, boundingBox, nextDay);
  }
  else {
    nextDay.setDate(nextDay.getDate() + 1);
    boundingBox.y = sectionYOffset + subSectionHeight*2;
    drawDayBox(doc, boundingBox, nextDay);
  }


}

// footer will print the footer for the page
function footer(doc:jsPDF, pageLayout: PageLayout, footerOffset: number) {
  
  const footerHeight = pageLayout.height - footerOffset;
  const footerYCentre = footerOffset + footerHeight/2;

  doc.setFontSize(10);
  doc.text("personal planner for Athir Nuaimi", pageLayout.width/2, footerYCentre, {align: "center"}); 
}

// getAppOptions will return the command line options
function getAppOptions() {

  // setup what options we support
  program
  .name('planner-pdf')
  .description('tool to print planner pages for a given date range')
  .version('0.0.10')

  // .option('-m, --months <char>');
  .option('-d, --start-date <yyyy-mm-dd>', 'start printing from this date')
  .option('-m, --months <number>', 'number of months to print', '1')
  .option('--single-sided', 'print on single side of page', true)
  .addOption( new Option('--double-sided', 'print on both sides of page').conflicts('singleSided'))
  
  // parse the comand line (options)
  program.parse();
  let options = program.opts();

  // assume start from today's date, (unless was specified)
  let startDate = new Date();
  if (options.startDate) {
    options.startDate = options.startDate + " 00:00:00";      // without time, date assumed to be UTC
    startDate = new Date(options.startDate);
  }
  // console.log(startDate.toDateString());
  
  // end a month from now, unless was specified
  let endDate = new Date(startDate.getTime());
  let dateOffset = 31 * Number(options.months);
  endDate.setDate( startDate.getDate() + (31*Number(options.months)));
  // console.log(endDate.toDateString());
  
  // if singled_sided set, use it.  otherwise, see if double_side specified
  if (options.doubleSided) {
    options.singleSided = !options.doubleSided;
  }
  console.log("single sided: " + options.singleSided);

  // setup user input for app (as we don't have a UI yet)
  let appConfig = new AppConfig();
  appConfig.paperSize = "letter";
  appConfig.pageSize = "letter";
  appConfig.printDateRange.setRange( startDate, endDate)
  appConfig.singleSided = options.singleSided;
  console.log("print from: ", appConfig.printDateRange.firstDate.toDateString());
  console.log("print to: ", appConfig.printDateRange.lastDate.toDateString());

  // calculate # of weeks
  const timeDiff = (appConfig.printDateRange.lastDate.getTime() - appConfig.printDateRange.firstDate.getTime());
  const numberOfDays = timeDiff/(1000.0*60*60*24)+1;        // convert from msec to days & add 1 extra day
  const firstDayOfRange = appConfig.printDateRange.firstDate.getDay();
  const lastDayOfRange = appConfig.printDateRange.lastDate.getDay();
  const numberOfWeeks = Math.ceil((appConfig.printDateRange.firstDay + appConfig.printDateRange.numberOfDays) / 7);
  console.log("number of weeks:", numberOfWeeks);

  return appConfig;
}

// addHolePunchGuides - is for 3 hole - A4/letter sized paper
function addHolePunchGuides(doc: jsPDF, drawArea: DrawArea) {

  console.log("drawing hole guides: ", drawArea);

  // draw circle 1/2 down page 1/2 in offet
  const xOffset = drawArea.x + (drawArea.width / 2);
  const yOffset = drawArea.height / 2;
  const verticalOffset = 72 * 4.25          // each hole is 4.25" apart - 72 pt/in
  const lineOffset = 12;                    // about 1/4 inch

  doc.setFillColor(255,255,255);            // white (for interior of circle)

  // draw hollow circle
  // draw cross hair through circle

  // center
  doc.circle(xOffset, yOffset-verticalOffset, 6, "FD")
  doc.line(xOffset, yOffset-verticalOffset-lineOffset, xOffset, yOffset-verticalOffset+lineOffset);
  doc.line(xOffset-lineOffset, yOffset-verticalOffset, xOffset+(lineOffset*2), yOffset-verticalOffset);

  // above
  doc.circle(xOffset, yOffset, 6, "FD")
  doc.line(xOffset, yOffset-lineOffset, xOffset, yOffset+lineOffset);
  doc.line(xOffset-lineOffset, yOffset, xOffset+(lineOffset*2), yOffset);

  // below
  doc.circle(xOffset, yOffset+verticalOffset, 6, "FD")
  doc.line(xOffset, yOffset+verticalOffset-lineOffset, xOffset, yOffset+verticalOffset+lineOffset);
  doc.line(xOffset-lineOffset, yOffset+verticalOffset, xOffset+(lineOffset*2), yOffset+verticalOffset);

}

// main
function main() {

  // process command line arguments
  const appConfig = getAppOptions();

  // create PDF (and 1st page)
  // create the document (with 1st page)
  const pageSize = appConfig.paperSize;       // 'letter' or 'a4'
  const pageUnits = "pt";                     // or 'mm', 'in' or others
  let orientation = 'p';                  // default to portrait
  // TODO a5 not support yet (next version)
  if (appConfig.pageSize == "a5") {
    orientation = "l";                    // portrait - take up entire paper
  }

  // create the PDF - note, 1st param can't be a string so need to use ?
  const compressPDF = false;
  const doc = new jsPDF(orientation == 'p' ? 'p' : 'l', pageUnits, pageSize, compressPDF);

  // get pager size in pts from jsPDF
  const paperLayout = new PaperDetails();
  const paperInfo = doc.getPageInfo(1);
  paperLayout.width = paperInfo.pageContext.mediaBox.topRightX;
  paperLayout.height = paperInfo.pageContext.mediaBox.topRightY;
  console.log("paper size:",paperLayout.width, paperLayout.height);

  // setup page details
  // can be 1 planner page per paper page or 2 planner pages per paper page  
  const pageLayout = new PageLayout();
  pageLayout.width = paperLayout.width;
  pageLayout.height = paperLayout.height;
  pageLayout.leftMargin = pageLayout.width*0.02;
  pageLayout.rightMargin = pageLayout.width*0.02;
  pageLayout.offsetForHoles = 72*0.8;                 // 72 pt/in & want 0.8" offset
  
  // divide up the page
  const headerHeight = paperLayout.height * 0.15;
  const bodyHeight = paperLayout.height * 0.80;
  const footerOffset = paperLayout.height * 0.95;

  // if double side, check if we need to add a blank 
  let drawArea = new DrawArea();
  drawArea.x = pageLayout.leftMargin;
  drawArea.y = 0;
  drawArea.width = paperLayout.width - 
                  (paperLayout.leftMargin+paperLayout.rightMargin+pageLayout.offsetForHoles);

  // start generating the pages
  let pageNumber = 0;
  let currentDate = appConfig.printDateRange.firstDate
  while (currentDate <= appConfig.printDateRange.lastDate) {

      // get 1st day of the week - sun: 0 to sat: 6
      let day = currentDate.getDay();    
      day = (day == 0)? 7 : day;              // move sun from 0 to 7
      console.log('current date:', currentDate.toString(), ' day:', day);
    
    if (pageNumber == 0) {
      // if double sided, need to check if 1st page is blank
      //   if first date is on left page (ie M T or W)
      //   1st page will be blank as left page is on back (ie 2nd page)
      if (!appConfig.singleSided && ((day >= 1) && (day <= 3))) {
        doc.addPage();
      }
    } else {
      // if not 1st page, need to add a new page
      doc.addPage();
    } 

    // see if 1st date is on left or right page
    // left is M T W and right is T F S S
    if ((day >= 1) && (day <= 3)) {
      
      // start with 1st (left) page
      console.log("printing left page (for given week)");
      console.log(currentDate.toString());
        
      // create rectangle for each section to use

      leftSideHeader(doc, pageLayout, headerHeight+1, currentDate);
      body(doc, pageLayout, headerHeight, bodyHeight, currentDate);
      footer(doc, pageLayout, footerOffset);

      drawArea.x = pageLayout.width - pageLayout.offsetForHoles;
      drawArea.y = 0;
      drawArea.width = pageLayout.offsetForHoles;
      drawArea.height = pageLayout.height;

      addHolePunchGuides(doc, drawArea)

      // move to the next page
      currentDate.setDate(currentDate.getDate()+(4-day));
      pageNumber += 1;
    } else {

      rightSideHeader(doc, pageLayout, headerHeight+1, currentDate);
      body(doc, pageLayout, headerHeight, bodyHeight, currentDate);
      footer(doc, pageLayout, footerOffset);

      drawArea.x = 0;
      drawArea.y = 0;
      drawArea.width = pageLayout.offsetForHoles;
      drawArea.height = pageLayout.height;

      addHolePunchGuides(doc, drawArea)
      console.log("printing right page for week ");

      // } 
      currentDate.setDate(currentDate.getDate()+(8-day));
      pageNumber += 1;
    }
    
    console.log("new date: ", currentDate.toString())
  }
  console.log(pageNumber, " total pages");

  // save the PDF to disk
  doc.save("letter-landscape.pdf");
}


main();
