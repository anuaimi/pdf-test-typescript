import { jsPDF } from "jspdf";

const doc = new jsPDF("landscape");
doc.text("Hello page one!", 10, 10);
doc.addPage();
doc.text("Hello page two!", 10, 10);
doc.save("a4.pdf");
