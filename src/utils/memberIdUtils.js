import { supabase } from '../supabase/client';

export const DISTRICT_CODES = {
  "அரியலூர்": "ARI",
  "செங்கல்பட்டு": "CGL",
  "சென்னை": "CHN",
  "கோயம்புத்தூர்": "CBE",
  "கடலூர்": "CDL",
  "தர்மபுரி": "DHR",
  "திண்டுக்கல்": "DKL",
  "ஈரோடு": "ERD",
  "கள்ளக்குறிச்சி": "KLK",
  "கல்லக்குறிச்சி": "KLK",
  "காஞ்சிபுரம்": "KPM",
  "காரைக்கால்": "KKL",
  "கன்னியாகுமரி": "KKI",
  "கரூர்": "KRR",
  "கிருஷ்ணகிரி": "KGI",
  "மதுரை": "MDU",
  "மயிலாடுதுறை": "MLD",
  "நாகப்பட்டினம்": "NGP",
  "நாமக்கல்": "NMK",
  "நீலகிரி": "NLG",
  "பெரம்பலூர்": "PRM",
  "புதுக்கோட்டை": "PDK",
  "புதுச்சேரி": "PDY",
  "ராமநாதபுரம்": "RMD",
  "ராணிப்பேட்டை": "RPT",
  "சேலம்": "SLM",
  "சிவகங்கை": "SVG",
  "தென்காசி": "TSI",
  "தஞ்சாவூர்": "TNJ",
  "தேனி": "THN",
  "திருச்சிராப்பள்ளி": "TRY",
  "திருநெல்வேலி": "TNV",
  "திருப்பத்தூர்": "TPT",
  "திருப்பூர்": "TPR",
  "திருவள்ளூர்": "TLR",
  "திருவண்ணாமலை": "TVM",
  "திருவாரூர்": "TVR",
  "தூத்துக்குடி": "TUT",
  "வேலூர்": "VLR",
  "விழுப்புரம்": "VPM",
  "விருதுநகர்": "VNR"
};

export const generateMemberId = async (district, offset = 0) => {
  const districtCode = DISTRICT_CODES[district] || 'OTH';
  const year = new Date().getFullYear();

  // Tier 1: Try database RPC if available (bypasses RLS with security definer)
  try {
    const { data: rpcId, error: rpcErr } = await supabase
      .rpc('get_next_member_id', { p_district: district || '' });
    if (!rpcErr && rpcId) {
      if (offset === 0) return rpcId;
      // If offset requested (e.g. during collision retry)
      const match = rpcId.match(/(TIWTN-\d+-[A-Z]+-)(\d+)/);
      if (match) {
        const nextNum = parseInt(match[2], 10) + offset;
        return `${match[1]}${String(nextNum).padStart(3, '0')}`;
      }
    }
  } catch (e) {
    console.warn('RPC get_next_member_id not available, using client query fallback:', e.message);
  }

  // Tier 2: Client query of all existing member IDs matching this district pattern
  let maxNumber = 0;
  try {
    const { data: existingRecords } = await supabase
      .from('members')
      .select('member_id')
      .ilike('member_id', `TIWTN-${year}-${districtCode}-%`);

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
    console.warn('Error fetching member records for sequence parsing:', e.message);
  }

  let nextCount = maxNumber + 1 + offset;
  let isUnique = false;
  let generatedId = '';

  // Tier 3: Verify uniqueness with maybeSingle check
  let attempts = 0;
  while (!isUnique && attempts < 20) {
    attempts++;
    const paddedCount = String(nextCount).padStart(3, '0');
    generatedId = `TIWTN-${year}-${districtCode}-${paddedCount}`;

    try {
      const { data, error } = await supabase
        .from('members')
        .select('member_id')
        .eq('member_id', generatedId)
        .maybeSingle();

      if (!error && !data) {
        isUnique = true;
      } else {
        nextCount++;
      }
    } catch {
      nextCount++;
    }
  }

  return generatedId;
};
