function parseSmartTime(str) {
  str = str.trim().toLowerCase();
  if (!str) return null;

  if (str === "midnight" || str === "0" || str === "00" || str === "0000") return {h: 0, m: 0, s: 0};
  if (str === "noon") return {h: 12, m: 0, s: 0};
  
  if (str === "12") return {h: 12, m: 0, s: 0, isAmbiguous: true};

  if (/^\d{4}$/.test(str)) {
    const h = parseInt(str.substring(0, 2), 10);
    const m = parseInt(str.substring(2, 4), 10);
    if (h < 24 && m < 60) return {h, m, s: 0};
  }
  if (/^\d{6}$/.test(str)) {
    const h = parseInt(str.substring(0, 2), 10);
    const m = parseInt(str.substring(2, 4), 10);
    const s = parseInt(str.substring(4, 6), 10);
    if (h < 24 && m < 60 && s < 60) return {h, m, s};
  }
  
  const ampmMatch = str.match(/^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?\s*(am|pm|a|p)$/);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const m = parseInt(ampmMatch[2] || "0", 10);
    const s = parseInt(ampmMatch[3] || "0", 10);
    const p = ampmMatch[4].startsWith('a') ? 'AM' : 'PM';
    
    if (m >= 60 || s >= 60) return null;
    if (h > 12) return null;
    if (h === 0) return null;
    
    if (p === 'AM' && h === 12) h = 0;
    if (p === 'PM' && h !== 12) h += 12;
    return {h, m, s};
  }

  const standardMatch = str.match(/^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?$/);
  if (standardMatch) {
    const h = parseInt(standardMatch[1], 10);
    const m = parseInt(standardMatch[2] || "0", 10);
    const s = parseInt(standardMatch[3] || "0", 10);
    
    if (m >= 60 || s >= 60) return null;
    
    if (!standardMatch[2]) {
      if (h >= 1 && h <= 12) return {h, m, s, isAmbiguous: true};
      if (h < 24) return {h, m, s};
      return null;
    }
    if (h < 24) return {h, m, s};
  }
  
  return null;
}

const tests = [
  "1430",
  "143000",
  "14:30",
  "14:30:45",
  "2:30 PM",
  "2:30PM",
  "2 PM",
  "2PM",
  "2:30 AM",
  "2:30am",
  "2",
  "midnight",
  "noon",
  "0",
  "00",
  "0000",
  "12",
  "13:00 am",
  "13:00",
  "24:00"
];

for (const t of tests) {
  console.log(`"${t}" -> ${JSON.stringify(parseSmartTime(t))}`);
}
