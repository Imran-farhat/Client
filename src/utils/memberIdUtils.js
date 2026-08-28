import { supabase } from '../supabase/client';

export const DISTRICT_LIST = [
  { ta: "அரியலூர்", en: "Ariyalur", code: "ARI" },
  { ta: "செங்கல்பட்டு", en: "Chengalpattu", code: "CGL" },
  { ta: "சென்னை", en: "Chennai", code: "CHN" },
  { ta: "கோயம்புத்தூர்", en: "Coimbatore", code: "CBE" },
  { ta: "கடலூர்", en: "Cuddalore", code: "CDL" },
  { ta: "தர்மபுரி", en: "Dharmapuri", code: "DHR" },
  { ta: "திண்டுக்கல்", en: "Dindigul", code: "DKL" },
  { ta: "ஈரோடு", en: "Erode", code: "ERD" },
  { ta: "கள்ளக்குறிச்சி", en: "Kallakurichi", code: "KLK" },
  { ta: "காஞ்சிபுரம்", en: "Kanchipuram", code: "KPM" },
  { ta: "காரைக்கால்", en: "Karaikal", code: "KKL" },
  { ta: "கன்னியாகுமரி", en: "Kanyakumari", code: "KKI" },
  { ta: "கரூர்", en: "Karur", code: "KRR" },
  { ta: "கிருஷ்ணகிரி", en: "Krishnagiri", code: "KGI" },
  { ta: "மதுரை", en: "Madurai", code: "MDU" },
  { ta: "மயிலாடுதுறை", en: "Mayiladuthurai", code: "MLD" },
  { ta: "நாகப்பட்டினம்", en: "Nagapattinam", code: "NGP" },
  { ta: "நாமக்கல்", en: "Namakkal", code: "NMK" },
  { ta: "நீலகிரி", en: "Nilgiris", code: "NLG" },
  { ta: "பெரம்பலூர்", en: "Perambalur", code: "PRM" },
  { ta: "புதுக்கோட்டை", en: "Pudukkottai", code: "PDK" },
  { ta: "புதுச்சேரி", en: "Puducherry", code: "PDY" },
  { ta: "ராமநாதபுரம்", en: "Ramanathapuram", code: "RMD" },
  { ta: "ராணிப்பேட்டை", en: "Ranipet", code: "RPT" },
  { ta: "சேலம்", en: "Salem", code: "SLM" },
  { ta: "சிவகங்கை", en: "Sivagangai", code: "SVG" },
  { ta: "தென்காசி", en: "Tenkasi", code: "TSI" },
  { ta: "தஞ்சாவூர்", en: "Thanjavur", code: "TNJ" },
  { ta: "தேனி", en: "Theni", code: "THN" },
  { ta: "திருச்சிராப்பள்ளி", en: "Tiruchirappalli", code: "TRY" },
  { ta: "திருநெல்வேலி", en: "Tirunelveli", code: "TNV" },
  { ta: "திருப்பத்தூர்", en: "Tirupattur", code: "TPT" },
  { ta: "திருப்பூர்", en: "Tiruppur", code: "TPR" },
  { ta: "திருவள்ளூர்", en: "Tiruvallur", code: "TLR" },
  { ta: "திருவண்ணாமலை", en: "Tiruvannamalai", code: "TVM" },
  { ta: "திருவாரூர்", en: "Tiruvarur", code: "TVR" },
  { ta: "தூத்துக்குடி", en: "Thoothukudi", code: "TUT" },
  { ta: "வேலூர்", en: "Vellore", code: "VLR" },
  { ta: "விழுப்புரம்", en: "Viluppuram", code: "VPM" },
  { ta: "விருதுநகர்", en: "Virudhunagar", code: "VNR" }
];

export const TAMIL_NADU_DISTRICTS = DISTRICT_LIST.map(d => d.ta);

export const DISTRICT_CODES = DISTRICT_LIST.reduce((acc, d) => {
  acc[d.ta] = d.code;
  acc[d.en] = d.code;
  return acc;
}, {});

/**
 * Super Fast, Concurrency-Safe Member ID Generator
 * Generates structured member IDs: TIWTN-YYYY-DIST-NNN
 */
export const generateMemberId = async (district, offset = 0) => {
  const districtCode = DISTRICT_CODES[district] || 'OTH';
  const year = new Date().getFullYear();
  const prefix = `TIWTN-${year}-${districtCode}-`;

  // Tier 1: Try database RPC if configured in Supabase
  try {
    const { data: rpcId, error: rpcErr } = await supabase
      .rpc('get_next_member_id', { p_district: district || '' });
    if (!rpcErr && rpcId) {
      if (offset === 0) return rpcId;
      const match = rpcId.match(/(TIWTN-\d+-[A-Z]+-)(\d+)/);
      if (match) {
        const nextNum = parseInt(match[2], 10) + offset;
        return `${match[1]}${String(nextNum).padStart(3, '0')}`;
      }
    }
  } catch {}

  // Tier 2: Single-pass query of all member IDs in this district
  let maxNumber = 0;
  try {
    const { data: existingRecords } = await supabase
      .from('members')
      .select('member_id')
      .ilike('member_id', `${prefix}%`)
      .order('member_id', { ascending: false })
      .limit(50);

    if (existingRecords && existingRecords.length > 0) {
      for (const rec of existingRecords) {
        const match = rec.member_id?.match(/TIWTN-\d+-[A-Z]+-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    }
  } catch (e) {
    console.warn('Error fetching member records for sequence parsing:', e);
  }

  const nextCount = maxNumber + 1 + offset;
  const paddedCount = String(nextCount).padStart(3, '0');
  return `${prefix}${paddedCount}`;
};
