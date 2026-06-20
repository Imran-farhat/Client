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

export const generateMemberId = async (district) => {
  const districtCode = DISTRICT_CODES[district] || 'OTH';
  const year = new Date().getFullYear();

  // Get current count of members in this district
  const { count } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('district', district);

  let nextCount = (count || 0) + 1;
  let isUnique = false;
  let generatedId = '';

  while (!isUnique) {
    const paddedCount = String(nextCount).padStart(3, '0');
    generatedId = `TIWTN-${year}-${districtCode}-${paddedCount}`;

    // Check if this ID already exists in the database
    const { data, error } = await supabase
      .from('members')
      .select('member_id')
      .eq('member_id', generatedId)
      .maybeSingle();

    if (error) {
      throw new Error("Error checking member ID uniqueness: " + error.message);
    }

    if (!data) {
      isUnique = true;
    } else {
      nextCount++;
    }
  }

  return generatedId;
};
