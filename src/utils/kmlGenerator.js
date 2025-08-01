// KML Generator utility for travel entries
export const generateKML = (entries, date = null) => {
  const filteredEntries = date 
    ? entries.filter(entry => entry.date === date)
    : entries;

  if (filteredEntries.length === 0) {
    return null;
  }

  const dateStr = date || 'all-entries';
  const formattedDate = date 
    ? new Date(date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'All Entries';

  const kmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Travel Log - ${formattedDate}</name>
    <description>Travel entries exported from Travel Logger</description>
    
    <!-- Styles for different entry types -->
    <Style id="food">
      <IconStyle>
        <color>ff0066ff</color>
        <scale>1.2</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/shapes/dining.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <color>ff0066ff</color>
        <scale>0.8</scale>
      </LabelStyle>
    </Style>
    
    <Style id="accommodation">
      <IconStyle>
        <color>ffff6600</color>
        <scale>1.2</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/shapes/lodging.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <color>ffff6600</color>
        <scale>0.8</scale>
      </LabelStyle>
    </Style>
    
    <Style id="route">
      <IconStyle>
        <color>ff00ff00</color>
        <scale>1.2</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/shapes/road.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <color>ff00ff00</color>
        <scale>0.8</scale>
      </LabelStyle>
    </Style>
    
    <Style id="attraction">
      <IconStyle>
        <color>ffff00ff</color>
        <scale>1.2</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/shapes/camera.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <color>ffff00ff</color>
        <scale>0.8</scale>
      </LabelStyle>
    </Style>`;

  const placemarks = filteredEntries.map(entry => {
    const coordinates = getCoordinatesFromEntry(entry);
    if (!coordinates) return '';

    const [lat, lng] = coordinates;
    const description = createDescription(entry);

    return `
    <Placemark>
      <name>${escapeXML(entry.title)}</name>
      <description><![CDATA[${description}]]></description>
      <styleUrl>#${entry.type}</styleUrl>
      <Point>
        <coordinates>${lng},${lat},0</coordinates>
      </Point>
      <ExtendedData>
        <Data name="type">
          <value>${entry.type}</value>
        </Data>
        <Data name="rating">
          <value>${entry.rating}</value>
        </Data>
        <Data name="date">
          <value>${entry.date}</value>
        </Data>
        <Data name="location">
          <value>${escapeXML(entry.location)}</value>
        </Data>
      </ExtendedData>
    </Placemark>`;
  }).join('');

  const kmlFooter = `
  </Document>
</kml>`;

  return kmlHeader + placemarks + kmlFooter;
};

const getCoordinatesFromEntry = (entry) => {
  // Check if entry has stored coordinates
  if (entry.coordinates && Array.isArray(entry.coordinates) && entry.coordinates.length === 2) {
    return entry.coordinates;
  }

  // Try to parse coordinates from location string
  const coordMatch = entry.location.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return [lat, lng];
    }
  }

  return null;
};

const createDescription = (entry) => {
  let description = `
    <div style="font-family: Arial, sans-serif; max-width: 300px;">
      <h3 style="margin: 0 0 10px 0; color: #333;">${escapeXML(entry.title)}</h3>
      <p style="margin: 5px 0; color: #666;"><strong>Location:</strong> ${escapeXML(entry.location)}</p>
      <p style="margin: 5px 0; color: #666;"><strong>Type:</strong> ${capitalizeFirst(entry.type)}</p>
      <p style="margin: 5px 0; color: #666;"><strong>Date:</strong> ${new Date(entry.date).toLocaleDateString()}</p>
      <p style="margin: 5px 0; color: #666;"><strong>Rating:</strong> ${'★'.repeat(entry.rating)}${'☆'.repeat(5 - entry.rating)} (${entry.rating}/5)</p>
  `;

  if (entry.description) {
    description += `<p style="margin: 10px 0; color: #333;"><strong>Description:</strong><br/>${escapeXML(entry.description)}</p>`;
  }

  if (entry.notes) {
    description += `<p style="margin: 10px 0; color: #333;"><strong>Notes:</strong><br/>${escapeXML(entry.notes)}</p>`;
  }

  if (entry.photos && entry.photos.length > 0) {
    description += `<p style="margin: 10px 0; color: #666;"><strong>Photos:</strong> ${entry.photos.length} attached</p>`;
  }

  description += `</div>`;
  return description;
};

const escapeXML = (str) => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const capitalizeFirst = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const downloadKML = (kmlContent, filename) => {
  const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const getUniqueDates = (entries) => {
  const dates = [...new Set(entries.map(entry => entry.date))];
  return dates.sort((a, b) => new Date(b) - new Date(a));
};