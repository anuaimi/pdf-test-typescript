"use strict";
var import_jspdf = require("jspdf");
const doc = new import_jspdf.jsPDF("landscape");
doc.text("Hello page one!", 10, 10);
doc.addPage();
doc.text("Hello page two!", 10, 10);
doc.save("a4.pdf");
//# sourceMappingURL=index.js.map
