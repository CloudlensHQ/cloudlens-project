import jsPDF from 'jspdf';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

export interface DashboardExportData {
    scanOverview: {
        totalScans: number;
        regionsScanned: number;
        servicesMonitored: number;
        criticalAlerts: number;
    };
    securityScore: number;
    alerts: Array<{
        severity: string;
        message: string;
        resource: string;
        region: string;
    }>;
    serviceMetrics: Array<{
        serviceName: string;
        resourceCount: number;
    }>;
    regionMetrics: Array<{
        region: string;
        resourceCount: number;
    }>;
}

// Helper function to create a chart and return as base64 image
async function createChart(config: any): Promise<string> {
    return new Promise((resolve) => {
        // Create a temporary canvas
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        canvas.style.backgroundColor = 'white';

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            resolve('');
            return;
        }

        // Create the chart
        const chart = new Chart(ctx, config);

        // Wait for chart to render then convert to image
        setTimeout(() => {
            const imageData = canvas.toDataURL('image/png');
            chart.destroy();
            resolve(imageData);
        }, 500);
    });
}

// Create pie chart for service distribution
async function createServiceDistributionChart(serviceMetrics: Array<{ serviceName: string, resourceCount: number }>): Promise<string> {
    const colors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
        '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
    ];

    const config: any = {
        type: 'pie' as ChartType,
        data: {
            labels: serviceMetrics.map(m => m.serviceName.toUpperCase()),
            datasets: [{
                data: serviceMetrics.map(m => m.resourceCount),
                backgroundColor: colors.slice(0, serviceMetrics.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Service Distribution',
                    font: { size: 16, weight: 'bold' },
                    color: '#1f2937'
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 12 },
                        color: '#374151'
                    }
                }
            }
        }
    };

    return await createChart(config);
}

// Create bar chart for regional distribution
async function createRegionalDistributionChart(regionMetrics: Array<{ region: string, resourceCount: number }>): Promise<string> {
    const config: any = {
        type: 'bar' as ChartType,
        data: {
            labels: regionMetrics.map(m => m.region),
            datasets: [{
                label: 'Resources',
                data: regionMetrics.map(m => m.resourceCount),
                backgroundColor: '#3b82f6',
                borderColor: '#1d4ed8',
                borderWidth: 1
            }]
        },
        options: {
            responsive: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Regional Distribution',
                    font: { size: 16, weight: 'bold' },
                    color: '#1f2937'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#374151'
                    }
                },
                x: {
                    ticks: {
                        color: '#374151'
                    }
                }
            }
        }
    };

    return await createChart(config);
}

// Create doughnut chart for security score
async function createSecurityScoreChart(score: number): Promise<string> {
    const remaining = 100 - score;
    const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';

    const config: any = {
        type: 'doughnut',
        data: {
            labels: ['Security Score', 'Remaining'],
            datasets: [{
                data: [score, remaining],
                backgroundColor: [color, '#e5e7eb'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: false,
            cutout: '70%',
            plugins: {
                title: {
                    display: true,
                    text: `Security Score: ${score}/100`,
                    font: { size: 16, weight: 'bold' },
                    color: '#1f2937'
                },
                legend: {
                    display: false
                }
            }
        }
    };

    return await createChart(config);
}

// Create alerts severity chart
async function createAlertsChart(alerts: Array<{ severity: string }>): Promise<string> {
    const severityCounts = alerts.reduce((acc, alert) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const severityOrder = ['critical', 'high', 'medium', 'low'];
    const colors = {
        critical: '#ef4444',
        high: '#f97316',
        medium: '#f59e0b',
        low: '#3b82f6'
    };

    const labels = severityOrder.filter(severity => severityCounts[severity] > 0);
    const data = labels.map(severity => severityCounts[severity]);
    const backgroundColors = labels.map(severity => colors[severity as keyof typeof colors]);

    const config: any = {
        type: 'bar' as ChartType,
        data: {
            labels: labels.map(l => l.toUpperCase()),
            datasets: [{
                label: 'Alerts',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Security Alerts by Severity',
                    font: { size: 16, weight: 'bold' },
                    color: '#1f2937'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#374151',
                        stepSize: 1
                    }
                },
                x: {
                    ticks: {
                        color: '#374151'
                    }
                }
            }
        }
    };

    return await createChart(config);
}

export async function exportDashboardToPDF(data: DashboardExportData): Promise<void> {
    const pdf = new jsPDF();
    let yPosition = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;

    // Add loading indicator (you might want to show this in UI)
    console.log('Generating PDF with charts...');

    // Title with colored background
    pdf.setFillColor(59, 130, 246); // Blue background
    pdf.rect(0, 0, pageWidth, 35, 'F');

    pdf.setTextColor(255, 255, 255); // White text
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Cloud Security Dashboard Report', margin, 25);

    // Reset text color and add date
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    yPosition = 45;
    pdf.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, yPosition);
    yPosition += 20;

    // Executive Summary Box
    pdf.setFillColor(248, 250, 252); // Light gray background
    pdf.rect(margin, yPosition - 5, contentWidth, 50, 'F');
    pdf.setDrawColor(203, 213, 225); // Border color
    pdf.rect(margin, yPosition - 5, contentWidth, 50, 'S');

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Executive Summary', margin + 10, yPosition + 10);

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    const summaryY = yPosition + 25;
    pdf.text(`Total Scans: ${data.scanOverview.totalScans}`, margin + 10, summaryY);
    pdf.text(`Regions: ${data.scanOverview.regionsScanned}`, margin + 90, summaryY);
    pdf.text(`Services: ${data.scanOverview.servicesMonitored}`, margin + 10, summaryY + 10);
    pdf.text(`Critical Alerts: ${data.scanOverview.criticalAlerts}`, margin + 90, summaryY + 10);

    yPosition += 70;

    // Security Score with Chart
    try {
        const scoreChart = await createSecurityScoreChart(data.securityScore);
        if (scoreChart) {
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Security Score Analysis', margin, yPosition);
            yPosition += 15;

            // Add chart
            pdf.addImage(scoreChart, 'PNG', margin, yPosition, 80, 60);

            // Add score details next to chart
            const scoreColor = data.securityScore >= 80 ? [16, 185, 129] : data.securityScore >= 60 ? [245, 158, 11] : [239, 68, 68];
            pdf.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
            pdf.setFontSize(24);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${data.securityScore}`, margin + 100, yPosition + 30);

            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            const scoreStatus = data.securityScore >= 80 ? 'Excellent' : data.securityScore >= 60 ? 'Good' : 'Needs Attention';
            pdf.text(`Status: ${scoreStatus}`, margin + 100, yPosition + 45);

            yPosition += 80;
        }
    } catch (error) {
        console.error('Error creating security score chart:', error);
        yPosition += 20;
    }

    // New page for charts
    pdf.addPage();
    yPosition = 20;

    // Service Distribution Chart
    if (data.serviceMetrics.length > 0) {
        try {
            const serviceChart = await createServiceDistributionChart(data.serviceMetrics);
            if (serviceChart) {
                pdf.addImage(serviceChart, 'PNG', margin, yPosition, 80, 60);
                yPosition += 70;
            }
        } catch (error) {
            console.error('Error creating service chart:', error);
        }
    }

    // Regional Distribution Chart
    if (data.regionMetrics.length > 0) {
        try {
            const regionChart = await createRegionalDistributionChart(data.regionMetrics);
            if (regionChart) {
                pdf.addImage(regionChart, 'PNG', margin + 90, yPosition - 70, 80, 60);
            }
        } catch (error) {
            console.error('Error creating region chart:', error);
        }
    }

    // Alerts Chart
    if (data.alerts.length > 0) {
        try {
            const alertsChart = await createAlertsChart(data.alerts);
            if (alertsChart) {
                pdf.addImage(alertsChart, 'PNG', margin, yPosition + 20, 80, 60);
                yPosition += 90;
            }
        } catch (error) {
            console.error('Error creating alerts chart:', error);
        }
    }

    // Detailed Alerts Section
    if (data.alerts.length > 0) {
        yPosition += 20;

        // Section header with background
        pdf.setFillColor(239, 68, 68); // Red background for alerts
        pdf.rect(margin, yPosition - 5, contentWidth, 15, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Critical Security Alerts', margin + 5, yPosition + 5);

        pdf.setTextColor(0, 0, 0);
        yPosition += 25;

        // Show top 8 critical alerts
        const criticalAlerts = data.alerts.filter(a => a.severity === 'critical').slice(0, 8);
        criticalAlerts.forEach((alert, index) => {
            if (yPosition > 260) {
                pdf.addPage();
                yPosition = 20;
            }

            // Alert box
            pdf.setFillColor(254, 242, 242); // Light red background
            pdf.rect(margin, yPosition - 3, contentWidth, 25, 'F');
            pdf.setDrawColor(239, 68, 68);
            pdf.rect(margin, yPosition - 3, contentWidth, 25, 'S');

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${index + 1}. [${alert.severity.toUpperCase()}]`, margin + 5, yPosition + 5);

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(9);
            const messageLines = pdf.splitTextToSize(alert.message, contentWidth - 20);
            pdf.text(messageLines.slice(0, 2), margin + 5, yPosition + 12); // Limit to 2 lines

            pdf.setFontSize(8);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`${alert.resource} | ${alert.region}`, margin + 5, yPosition + 20);
            pdf.setTextColor(0, 0, 0);

            yPosition += 35;
        });

        if (data.alerts.length > criticalAlerts.length) {
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'italic');
            pdf.text(`... and ${data.alerts.length - criticalAlerts.length} more alerts`, margin, yPosition);
        }
    }

    // Footer on last page
    const pageCount = pdf.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text(`CloudLens Security Report - Page ${i} of ${pageCount}`, margin, pdf.internal.pageSize.getHeight() - 10);
    }

    // Save the PDF
    const fileName = `cloudlens-dashboard-report-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    console.log('PDF generated successfully!');
}