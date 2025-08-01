import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Helper function to convert image to base64 
const imageToBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = url;
  });
};

// Helper function to add page break if needed
const addPageBreakIfNeeded = (pdf, currentY, requiredHeight) => {
  const pageHeight = pdf.internal.pageSize.height;
  if (currentY + requiredHeight > pageHeight - 20) {
    pdf.addPage();
    return 20; // Reset Y position to top margin
  }
  return currentY;
};

// Generate map image for location
const generateMapImage = async (coordinates, title) => {
  if (!coordinates || coordinates.length !== 2) return null;
  try {
    const [lat, lng] = coordinates;
    const zoom = 15;
    const size = '400x300';

    // Create a simple map representation
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    // Fill with light blue background
    ctx.fillStyle = '#e6f3ff';
    ctx.fillRect(0, 0, 400, 300);
    
    // Add location marker
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(200, 150, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add coordinates text
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${lat.toFixed(4)}, ${lng.toFixed(4)}`, 200, 280);
    ctx.fillText(title, 200, 20);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (error) {
    console.error('Error generating map image:', error);
    return null;
  }
};

// Main PDF generation function
export const generatePDF = async (entries, options = {}) => {
  const { 
    selectedDate = null, 
    includePhotos = true, 
    includeMaps = true, 
    includeStats = true,
    title = 'Travel Log Export'
  } = options;
  
  // Filter entries by date if specified
  const filteredEntries = selectedDate 
    ? entries.filter(entry => entry.date === selectedDate) 
    : entries;
  
  if (filteredEntries.length === 0) {
    throw new Error('No entries found for the selected criteria');
  }
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  let currentY = 20;
  
  // Helper function to add text with word wrapping
  const addWrappedText = (text, x, y, maxWidth, fontSize = 10) => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return y + (lines.length * fontSize * 0.5);
  };
  
  // Cover page
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, pageWidth / 2, 40, { align: 'center' });
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'normal');
  const subtitle = selectedDate 
    ? `Travel entries for ${new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` 
    : `Complete travel log (${filteredEntries.length} entries)`;
  pdf.text(subtitle, pageWidth / 2, 60, { align: 'center' });
  
  // Export date
  pdf.setFontSize(12);
  pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 80, { align: 'center' });
  
  // Statistics section if enabled
  if (includeStats) {
    currentY = 100;
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Travel Statistics', 20, currentY);
    currentY += 15;
    
    const stats = {
      totalEntries: filteredEntries.length,
      uniqueLocations: [...new Set(filteredEntries.map(e => e.location))].length,
      averageRating: (filteredEntries.reduce((sum, e) => sum + e.rating, 0) / filteredEntries.length).toFixed(1),
      dateRange: selectedDate 
        ? 'Single day' 
        : `${Math.ceil((new Date(Math.max(...filteredEntries.map(e => new Date(e.date)))) - 
            new Date(Math.min(...filteredEntries.map(e => new Date(e.date))))) / (1000 * 60 * 60 * 24))} days`,
      categories: {
        food: filteredEntries.filter(e => e.type === 'food').length,
        accommodation: filteredEntries.filter(e => e.type === 'accommodation').length,
        route: filteredEntries.filter(e => e.type === 'route').length,
        attraction: filteredEntries.filter(e => e.type === 'attraction').length
      }
    };
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    currentY = addWrappedText(`Total Entries: ${stats.totalEntries}`, 20, currentY, pageWidth - 40);
    currentY = addWrappedText(`Unique Locations: ${stats.uniqueLocations}`, 20, currentY + 5, pageWidth - 40);
    currentY = addWrappedText(`Average Rating: ${stats.averageRating}/5 stars`, 20, currentY + 5, pageWidth - 40);
    currentY = addWrappedText(`Time Span: ${stats.dateRange}`, 20, currentY + 5, pageWidth - 40);
    
    currentY += 10;
    pdf.setFont('helvetica', 'bold');
    currentY = addWrappedText('Categories Breakdown:', 20, currentY, pageWidth - 40);
    pdf.setFont('helvetica', 'normal');
    currentY = addWrappedText(`• Food: ${stats.categories.food} entries`, 25, currentY + 5, pageWidth - 45);
    currentY = addWrappedText(`• Accommodation: ${stats.categories.accommodation} entries`, 25, currentY + 5, pageWidth - 45);
    currentY = addWrappedText(`• Routes: ${stats.categories.route} entries`, 25, currentY + 5, pageWidth - 45);
    currentY = addWrappedText(`• Attractions: ${stats.categories.attraction} entries`, 25, currentY + 5, pageWidth - 45);
  }
  
  // Start new page for entries
  pdf.addPage();
  currentY = 20;
  
  // Sort entries by date
  const sortedEntries = [...filteredEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Process each entry
  for (let i = 0; i < sortedEntries.length; i++) {
    const entry = sortedEntries[i];
    
    // Check if we need a new page
    currentY = addPageBreakIfNeeded(pdf, currentY, 60);
    
    // Entry header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    currentY = addWrappedText(`${i + 1}. ${entry.title}`, 20, currentY, pageWidth - 40, 16);
    
    // Entry details
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    // Type and rating
    const typeLabel = entry.type.charAt(0).toUpperCase() + entry.type.slice(1);
    const ratingStars = '★'.repeat(entry.rating) + '☆'.repeat(5 - entry.rating);
    currentY = addWrappedText(`Type: ${typeLabel} | Rating: ${ratingStars} (${entry.rating}/5)`, 20, currentY + 8, pageWidth - 40);
    
    // Date and location
    currentY = addWrappedText(`Date: ${new Date(entry.date).toLocaleDateString()}`, 20, currentY + 5, pageWidth - 40);
    currentY = addWrappedText(`Location: ${entry.location}`, 20, currentY + 5, pageWidth - 40);
    
    // Description if available
    if (entry.description) {
      currentY += 5;
      pdf.setFont('helvetica', 'bold');
      currentY = addWrappedText('Description:', 20, currentY, pageWidth - 40);
      pdf.setFont('helvetica', 'normal');
      currentY = addWrappedText(entry.description, 20, currentY + 3, pageWidth - 40);
    }
    
    // Notes if available
    if (entry.notes) {
      currentY += 5;
      pdf.setFont('helvetica', 'bold');
      currentY = addWrappedText('Notes:', 20, currentY, pageWidth - 40);
      pdf.setFont('helvetica', 'normal');
      currentY = addWrappedText(entry.notes, 20, currentY + 3, pageWidth - 40);
    }
    
    currentY += 10;
    
    // Add map if coordinates are available and maps are enabled
    if (includeMaps && (entry.coordinates || entry.location.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/))) {
      try {
        let coordinates = entry.coordinates;
        if (!coordinates) {
          const coordMatch = entry.location.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
          if (coordMatch) {
            coordinates = [parseFloat(coordMatch[1]), parseFloat(coordMatch[2])];
          }
        }
        
        if (coordinates) {
          currentY = addPageBreakIfNeeded(pdf, currentY, 80);
          const mapImage = await generateMapImage(coordinates, entry.title);
          if (mapImage) {
            const mapWidth = 80;
            const mapHeight = 60;
            pdf.addImage(mapImage, 'JPEG', 20, currentY, mapWidth, mapHeight);
            currentY += mapHeight + 10;
          }
        }
      } catch (error) {
        console.error('Error adding map to PDF:', error);
      }
    }
    
    // Add photos if available and photos are enabled
    if (includePhotos && entry.photos && entry.photos.length > 0) {
      currentY = addPageBreakIfNeeded(pdf, currentY, 60);
      pdf.setFont('helvetica', 'bold');
      currentY = addWrappedText(`Photos (${entry.photos.length}):`, 20, currentY, pageWidth - 40);
      currentY += 5;
      
      // Process photos in rows of 2
      for (let photoIndex = 0; photoIndex < entry.photos.length; photoIndex += 2) {
        currentY = addPageBreakIfNeeded(pdf, currentY, 60);
        const photosInRow = entry.photos.slice(photoIndex, photoIndex + 2);
        
        for (let j = 0; j < photosInRow.length; j++) {
          const photo = photosInRow[j];
          try {
            const photoWidth = 70;
            const photoHeight = 50;
            const xPosition = 20 + (j * 90);
            
            // Add photo
            pdf.addImage(photo.dataUrl, 'JPEG', xPosition, currentY, photoWidth, photoHeight);
            
            // Add photo caption if available
            if (photo.name) {
              pdf.setFontSize(8);
              pdf.setFont('helvetica', 'normal');
              pdf.text(photo.name, xPosition + photoWidth/2, currentY + photoHeight + 5, { align: 'center' });
            }
          } catch (error) {
            console.error('Error adding photo to PDF:', error);
          }
        }
        currentY += 60;
      }
    }
    
    // Add separator line
    currentY += 5;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(20, currentY, pageWidth - 20, currentY);
    currentY += 15;
  }
  
  // Add footer with page numbers
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
    pdf.text('Generated by Travel Logger', 20, pageHeight - 10);
  }
  
  return pdf;
};

export const downloadPDF = async (entries, options = {}) => {
  try {
    const pdf = await generatePDF(entries, options);
    const filename = options.selectedDate 
      ? `travel-log-${options.selectedDate}.pdf` 
      : `travel-log-complete-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
    return { success: true, filename };
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
};

export const getUniqueDates = (entries) => {
  const dates = [...new Set(entries.map(entry => entry.date))];
  return dates.sort((a, b) => new Date(b) - new Date(a));
};