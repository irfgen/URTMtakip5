// Regular expression patterns for extracting technical drawing information

const PART_NAME_PATTERNS = [
  // Turkish patterns
  /(?:PARÇA\s*ADI?|PARÇA\s*İSM[İI]|PART\s*NAME)[\s:]+([A-ZÇĞIİÖŞÜa-zçğıiöşü0-9\s\-_\.]+)/gi,
  /(?:MONTAJ|ASSEMBLY|GRUP)[\s:]+([A-ZÇĞIİÖŞÜa-zçğıiöşü0-9\s\-_\.]+)/gi,
  /(?:PARÇA|PART)[\s:]+([A-ZÇĞIİÖŞÜa-zçğıiöşü0-9\s\-_\.]+)/gi,
  /(?:ADI?|NAME|İSİM)[\s:]+([A-ZÇĞIİÖŞÜa-zçğıiöşü0-9\s\-_\.]+)/gi,
  
  // Common part name patterns
  /([A-ZÇĞIİÖŞÜa-zçğıiöşü]+\s*(?:PLAKA|KAPAK|VİDA|SOMUN|PULS|CONTA|YATAĞ|DİŞ|MİL|KAMÇI))/gi,
  /([A-ZÇĞIİÖŞÜa-zçğıiöşü]+\s*(?:PLATE|COVER|SCREW|NUT|WASHER|GASKET|BEARING|SHAFT|CAM))/gi,
];

const MATERIAL_PATTERNS = [
  // Turkish material patterns
  /(?:MALZEME|MATERIAL|MAL\.)[\s:]+([A-ZÇĞIİÖŞÜa-zçğıiöşü0-9\s\-_\.]+)/gi,
  /(?:MALZ\.|MAT\.)[\s:]+([A-ZÇĞIİÖŞÜa-zçğıiöşü0-9\s\-_\.]+)/gi,
  
  // Steel grades
  /(St\s*\d+(?:[\.\-]\d+)?)/gi,
  /(S\s*\d+(?:[\.\-]\d+)?)/gi,
  /(DIN\s*\d+)/gi,
  /(EN\s*\d+)/gi,
  /(AISI\s*\d+)/gi,
  /(SAE\s*\d+)/gi,
  
  // Common materials
  /([A-ZÇĞIİÖŞÜa-zçğıiöşü]*(?:ÇELİK|STEEL|ALÜMINYUM|ALUMINUM|BRONZ|BRONZE|PIRINÇ|BRASS))/gi,
  /(PASLANMAZ\s*ÇELİK|STAINLESS\s*STEEL|INOX)/gi,
  /(KARBON\s*ÇELİK|CARBON\s*STEEL)/gi,
];

const PROJECT_NAME_PATTERNS = [
  // Project identification patterns
  /(?:PROJE\s*ADI?|PROJECT\s*NAME|PROJE)[\s:]+([A-ZÇĞIİÖŞÜa-zçğıiöşü0-9\s\-_\.]+)/gi,
  /(?:PROJ\.|PRJ\.)[\s:]+([A-ZÇĞIİÖŞÜa-zçğıiöşü0-9\s\-_\.]+)/gi,
  /(?:ÇİZİM\s*ADI?|DRAWING\s*NAME)[\s:]+([A-ZÇĞIİÖŞÜa-zçğıiöşü0-9\s\-_\.]+)/gi,
  /(?:BAŞLIK|TITLE)[\s:]+([A-ZÇĞIİÖŞÜa-zçğıiöşü0-9\s\-_\.]+)/gi,
];

const DRAWING_NUMBER_PATTERNS = [
  /(?:ÇİZİM\s*NO|DRAWING\s*NO|DWG\s*NO)[\s:]+([A-Z0-9\-_\.]+)/gi,
  /(?:ÇIZIM\s*NUMARASI|DRAWING\s*NUMBER)[\s:]+([A-Z0-9\-_\.]+)/gi,
  /(?:NO|NUMBER)[\s:]+([A-Z0-9\-_\.]+)/gi,
];

const REVISION_PATTERNS = [
  /(?:REVİZYON|REVISION|REV)[\s:]+([A-Z0-9\-_\.]+)/gi,
  /(?:VERSİYON|VERSION|VER)[\s:]+([A-Z0-9\-_\.]+)/gi,
];

const SCALE_PATTERNS = [
  /(?:ÖLÇEK|SCALE)[\s:]+(\d+:\d+)/gi,
  /(?:ÖL\.|SC\.)[\s:]+(\d+:\d+)/gi,
];

const DATE_PATTERNS = [
  /(?:TARİH|DATE)[\s:]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
  /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/g,
];

// Technical specifications
const DIMENSION_PATTERNS = [
  /(\d+(?:[,\.]\d+)?\s*(?:mm|cm|m|inch|in|"|'))/gi,
  /(Ø\s*\d+(?:[,\.]\d+)?)/gi, // Diameter symbol
  /(R\s*\d+(?:[,\.]\d+)?)/gi, // Radius
];

const TOLERANCE_PATTERNS = [
  /([±]\s*\d+(?:[,\.]\d+)?)/gi,
  /(\+\d+(?:[,\.]\d+)?\s*\-\d+(?:[,\.]\d+)?)/gi,
];

// Quality and standards
const STANDARD_PATTERNS = [
  /(ISO\s*\d+)/gi,
  /(DIN\s*\d+)/gi,
  /(EN\s*\d+)/gi,
  /(ASTM\s*[A-Z]\d+)/gi,
  /(JIS\s*[A-Z]\d+)/gi,
];

// Surface finish patterns
const SURFACE_PATTERNS = [
  /(Ra\s*\d+(?:[,\.]\d+)?)/gi,
  /(Rz\s*\d+(?:[,\.]\d+)?)/gi,
  /(\d+(?:[,\.]\d+)?\s*μm)/gi,
];

// Heat treatment
const HEAT_TREATMENT_PATTERNS = [
  /(NORMALLE|NORMALIZE|NORMALIZING)/gi,
  /(TAVLA|ANNEAL|ANNEALING)/gi,
  /(SERT|HARD|HARDENING)/gi,
  /(TEMPERLE|TEMPER|TEMPERING)/gi,
];

module.exports = {
  PART_NAME_PATTERNS,
  MATERIAL_PATTERNS,
  PROJECT_NAME_PATTERNS,
  DRAWING_NUMBER_PATTERNS,
  REVISION_PATTERNS,
  SCALE_PATTERNS,
  DATE_PATTERNS,
  DIMENSION_PATTERNS,
  TOLERANCE_PATTERNS,
  STANDARD_PATTERNS,
  SURFACE_PATTERNS,
  HEAT_TREATMENT_PATTERNS
}; 