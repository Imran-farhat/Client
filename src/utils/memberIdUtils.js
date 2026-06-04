import { supabase } from '../supabase/client';

export const DISTRICT_CODES = {
  "அரியலூர்": "ARL",
  "சேலம்": "SLM",
  "சென்னை": "CHN",
  "கோயம்புத்தூர்": "CBE",
  "கடலூர்": "KDL",
  "தர்மபுரி": "DHP",
  "திண்டுக்கல்": "DNK",
  "ஈரோடு": "ERD",
  "காஞ்சிபுரம்": "KCP",
  "கன்னியாகுமரி": "KNY",
  "கரூர்": "KRR",
  "கிருஷ்ணகிரி": "KRG",
  "மதுரை": "MDU",
  "மயிலாடுதுறை": "MYL",
  "நாகப்பட்டினம்": "NGP",
  "நாமக்கல்": "NMK",
  "நீலகிரி": "NLG",
  "பெரம்பலூர்": "PBR",
  "புதுக்கோட்டை": "PDK",
  "ராமநாதபுரம்": "RMN",
  "ராணிப்பேட்டை": "RNP",
  "சிவகங்கை": "SVG",
  "தென்காசி": "TNK",
  "தஞ்சாவூர்": "TNJ",
  "தேனி": "THN",
  "திருவள்ளூர்": "TVL",
  "திருவண்ணாமலை": "TVN",
  "திருவாரூர்": "TVR",
  "தூத்துக்குடி": "TUT",
  "திருச்சிராப்பள்ளி": "TRY",
  "திருநெல்வேலி": "TVL",
  "திருப்பத்தூர்": "TPT",
  "திருப்பூர்": "TPR",
  "வேலூர்": "VLR",
  "விழுப்புரம்": "VPM",
  "விருதுநகர்": "VRN"
};

export const generateMemberId = async (district) => {
  const districtCode = DISTRICT_CODES[district] || 'OTH';
  const year = new Date().getFullYear();

  // Get current count of members in this district
  const { count } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('district', district);

  const nextCount = (count || 0) + 1;
  const paddedCount = String(nextCount).padStart(3, '0');

  return `TIWTN-${year}-${districtCode}-${paddedCount}`;
};
