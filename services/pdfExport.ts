import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function generateForensicPDF(analysis, fileName = 'forensic_report.pdf') {
    const { verdict, score, riskLevel, anomalies, forensicInsights } = analysis;

    // Create a new PDF document
    const doc = new jsPDF();

    // Set up professional formatting with SachAi branding
    doc.setFont('Helvetica');
    doc.setFontSize(12);
    doc.text('SachAi Forensic Analysis Report', 10, 10);

    // Timestamp and metadata
    const timestamp = new Date().toUTCString();
    doc.text(`Generated on: ${timestamp}`, 10, 20);

    // Verdict Section
    doc.text('Verdict: ', 10, 30);
    const verdictColor = verdict === 'AUTHENTIC' ? 'green' : verdict === 'SUSPICIOUS' ? 'yellow' : 'red';
    doc.setTextColor(verdictColor);
    doc.text(verdict, 10, 40);
    doc.setTextColor('black');

    // Score Section
    doc.text(`Score: ${score}`, 10, 50);
    // Risk Level Section
    doc.text(`Risk Level: ${riskLevel}`, 10, 60);

    // Anomalies Section
    doc.text('Anomalies:', 10, 70);
    anomalies.forEach((anomaly, index) => {
        doc.text(`- ${anomaly}`, 10, 80 + (index * 10));
    });

    // Forensic Insights Section
    doc.text('Forensic Insights:', 10, 100);
    forensicInsights.forEach((insight, index) => {
        doc.text(`- ${insight}`, 10, 110 + (index * 10));
    });

    // Save the PDF
    doc.save(fileName);
}

// To use this function, simply call generateForensicPDF with the appropriate analysis object.