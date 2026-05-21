import OrgLogo from '../components/OrgLogo';
import balajiPhoto from '../assets/balaji.png';
import idhreesPhoto from '../assets/Idhrees.jpeg';
import muraliPhoto from '../assets/murali.jpeg';

function About() {
  const team = [
    { name: 'A.பாலாஜி ', role: 'மாநில தலைவர்', photo: balajiPhoto, photoPosition: 'center center' },
    { name: 'M.முகமது இத்ரீஸ்', role: 'மாநில செயலாளர்', photo: idhreesPhoto, photoPosition: 'center 25%' },
    { name: 'A.முரளிதரன்', role: 'மாநில பொருளாளர்', photo: muraliPhoto, photoPosition: 'center center' },
  ];

  const rulesText = `தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்

சங்கத்தின் விதிமுறைகள்

1. சங்கத்தினுடைய விதிமுறைகளை மூன்றாண்டுகளுக்கு ஒரு முறை மாற்றி அமைக்கப்படும்
2. புதிய நிர்வாகிகளை தேர்ந்தெடுத்து தமிழகம் முழுவதும் உள்ள வெல்டிங் தொழிலாளர்களை சந்தித்து சங்கத்தை பரவலாக்க வேண்டும்
3. தேர்ந்தெடுக்கப்பட்ட நிர்வாகிகள் தன்னுடைய சுயநலத்துக்காக சங்கத்தில் உள்ள மற்ற நிர்வாகிகளையோ உறுப்பினர்களையோ நிர்பந்தம் செய்து பணம் பறிப்பது அன்பளிப்பு பெறுவதோ ஏதேனும் தலைமைக்கு தகவல் தெரிந்தால் உடனடியாக பொதுக்குழுவைக் கூட்டி அவர்கள் மீது உரிய நடவடிக்கை எடுக்கப்படும்
4. தேர்ந்தெடுக்கப்பட்ட மாநில மாவட்ட நிர்வாகிகள் தன்னுடைய சுய விளம்பரத்துக்காகவும் தன்னுடைய சுயநலத்திற்காகவும் சங்கத்தை தவறாக பயன்படுத்தினால் உடனடியாக அவர்களை பொறுப்பில் இருந்து விடுவிக்கப்படும்
5. சங்கத்தில் உறுப்பினராக இருக்கக்கூடிய அனைத்து உறுப்பினர்களுக்கும் இரண்டு ஆண்டுகளுக்கு ஒரு முறை உறுப்பினர் அடையாள அட்டை புதுப்பித்து கொடுக்கப்படும்
6. சங்கத்தில் உறுப்பினராக இருக்கக்கூடிய அனைத்து மாவட்ட உள்ள உறுப்பினர்களுக்கு தலைமையின் ஆலோசனைப்படி கட்டாயம் இன்சுரன்ஸ் காப்பீடு செய்து வைக்க வேண்டும்
7. சங்கத்தின் மாநில பொறுப்பாளர்கள் தலைவர் மற்றும் செயலாளர்கள் மாவட்ட நிர்வாகத்தை பற்றி தகவல் ஏதேனும் வேண்டுமென்றால் அந்தந்த மாவட்டத்தின் உடைய தலைவர் மற்றும் செயலாளர் பொருளாளர் இவர்களின் மூலமாக செய்திகளை கேட்டு அறிதல் வேண்டும்
8. மாநில பொருளாளராக நியமிக்கப்படுகின்ற நபர் மாநில செயலாளருடன் இணைத்து வங்கி கணக்கு தொடங்கி ஒரு ரூபாய் வருமானமாக இருந்தாலும் வங்கி கணக்கின் மூலமாகவே வரவு செலவு செய்ய வேண்டும்
9. ஒவ்வொரு ஆண்டும் மே மாதம் மாநில மாநாடு அல்லது பொதுக்கூட்டம் கட்டாயம் நடத்த வேண்டும்
10. ஒவ்வொரு ஆண்டும் நடைபெறுகின்ற மாநில மாநாட்டில் அந்த வருடத்திற்கான வரவு செலவு ஒட்டு மொத்த உறுப்பினர்கள் முன்னிலையில் வெளிப்படை தன்மையுடன் வாசித்துக் காட்ட வேண்டும்
11. சங்கத்தில் இருக்கக்கூடிய ஒட்டுமொத்த உறுப்பினர்களுக்கும் நம்முடைய சங்கத்தின் நேரடி யாகவோ அல்லது பிற அமைப்புகளுடன் சேர்ந்து நல வாரிய அடையாள அட்டை அனைவருக்கும் பெற்றுத் தர வேண்டும்
12. சங்கத்தினுடைய வளர்ச்சி வருமானத்தை கருத்தில் கொண்டு மாநில நிர்வாகிகள் மாவட்ட நிர்வாகிகள் குறிப்பிட்ட தொகையை சந்தா தொகையாக தலைமைக்கு அவசியம் செலுத்துதல் வேண்டும்
13. தமிழகம் முழுவதிலும் உள்ள ஒட்டுமொத்த உறுப்பினர்களிடம் மாதச் சந்தாவாக குறைந்தபட்சம் ரூபாய் 25 வசூல் செய்து மாவட்ட நிர்வாகிகள் தலைமைக்கு அனுப்புதல் வேண்டும்
14. எந்த காரணத்தைக் கொண்டும் சங்கத்தில் உள்ள உறுப்பினர்களையும் அல்லது நிர்வாகிகளையோ சங்கத்திலிருந்து எடுப்பதோ வாட்ஸ் அப் குழுவில் இருந்து நீக்குவதோ செய்தல் கூடாது அப்படி மாநில நிர்வாகிகள் யாரேனும் செய்தால் அவர்கள் மீது தக்க நடவடிக்கை எடுக்கப்படும்
15. சங்கத்தினுடைய whatsapp குழுவில் தேவையில்லாத செய்திகளையோ இருக்கக்கூடிய நிர்வாகிகள் பற்றி தேவையில்லாத வதந்தியில் பரப்புவோர் மீது உரிய நடவடிக்கை எடுப்பது மட்டுமல்லாமல் அவர்களை குழுவில் இருந்து நீக்குவதற்கு மாநில தலைமைக்கு முழு உரிமையும் அதிகாரமும் உண்டு
16. பணம் சம்பந்தமாக சீட்டு பிடிப்பது மாவட்ட நிர்வாகிகளிடம் பொருளாதாரம் ரீதியாக அன்பளிப்பு பெறுவது போன்ற தலைமை நிர்வாகிகள் அதாவது தலைவர் செயலாளர் யாரேனும் இது போன்ற நடவடிக்கைகளில் செயல்படக்கூடாது அப்படி செயல்பட்டால் அவர்களை பொறுப்பில் இருந்து உடனடியாக விடுவிக்க பொதுக்குழு உறுப்பினர்களுக்கு முழு அதிகாரம் உண்டு
17. சங்கத்தில் உறுப்பினர்கள் யாரேனும் எதிர்பாராத விதமாக விபத்து ஏற்படு உடல்நிலை பாதிக்கப்பட்டாலோ இறப்புகள் ஏற்பட்டாலோ ஒட்டுமொத்த தமிழகத்தில் உள்ள உறுப்பினர்களிடையே உதவி பெற்று சங்கத்தின் மூலமாக பாதிக்கப்பட்ட குடும்பத்திற்கு நிதியுதவி அளிக்க சங்கத்தினுடைய மாநில நிர்வாகிகள் முழு முயற்சி எடுக்க வேண்டும்
18. சங்கத்தில் இருக்கக்கூடிய மாநில மாவட்ட பொறுப்பாளர்கள் சூழ்ச்சி முறையில் மூன்று ஆண்டுக்கு ஒரு முறை மாற்றி அமைத்தல் வேண்டும் மாவட்ட நிர்வாகம் விருப்பப்பட்டால் தொடர்ந்து அப் பதவியில் அவர்கள் நீடிக்கலாம்
19. மாநிலத் தலைவர் செயலாளர் தலைமை ஒருங்கிணைப்பாளர் ஒப்பொரு 15 நாட்களுக்கு ஒரு முறையும் ஒட்டுமொத்த தமிழகத்தில் உள்ள குறிப்பிட்ட பகுதிகளுக்குச் சென்று சங்கத்தினுடைய வளர்ச்சியை மேம்படுத்த வேண்டும் இரண்டு மாதம் வரை அவர்கள் செயல்படில்லை என்றால் அவருடைய பொறுப்பை மாற்றி அமைக்கப்படும்
20. நம்முடைய சங்கத்தில் உள்ள எந்த மாவட்டத்தின் உடைய மாவட்ட செயலாளர்களும் உறுப்பினர்கள் கணக்கு வழக்குகளை கேட்டால் அந்த மாதாந்திர கூட்டத்தில் அவர்கள் தெளிவு பெறும் வகையில் கணக்கு வழக்குகளை சமர்ப்பிக்க வேண்டும்
21. ஒவ்வொரு மாவட்டமும் பிரதி மாதம் முதல் ஞாயிற்றுக்கிழமை மாதாந்திர ஆலோசனைக் கூட்டம் அவசியம் நடத்தப்பட வேண்டும் கூட்டம் நடந்தவுடன் கூட்டத்தினுடைய நிகழ்ச்சிகளை தலைமைக்கு தெரிவிக்க வேண்டும்.`;

  return (
    <section className="bg-secondary px-6 py-16 text-primary md:px-10">
      <div className="mx-auto max-w-6xl space-y-16">
        <div className="rounded-[32px] border border-[var(--border)] bg-primary p-10 shadow-sm md:p-12">
          <p className="text-sm uppercase tracking-[0.3em] text-amber">WHO WE ARE</p>
          <h1 className="mt-4 text-3xl font-display text-navy sm:text-5xl">Forging history through expertise and grit.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-secondary">தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம் has spent nearly two decades building a premium welding community that blends hands-on craftsmanship, rigorous certification, and industrial networking. Our story is grounded in the fire of steel fabrication, the discipline of safety compliance, and the ambition to equip every welder with futureproof skills.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-[32px] border border-[var(--border)] bg-card p-10 shadow-sm">
            <h2 className="text-3xl font-display text-navy">Mission</h2>
            <p className="mt-4 text-secondary">To empower welders with premium certification, career mobility, and a collaborative platform that sets the standard for welding excellence across India.</p>
          </div>
          <div className="rounded-[32px] border border-[var(--border)] bg-card p-10 shadow-sm">
            <h2 className="text-3xl font-display text-navy">Vision</h2>
            <p className="mt-4 text-secondary">To become the foremost association for industrial welding professionals, known for quality training, trusted certification, and a thriving national community.</p>
          </div>
        </div>

        <div className="space-y-10">
          <div className="rounded-[32px] border border-[var(--border)] bg-primary p-8 shadow-sm">
            <div className="flex flex-col items-center gap-4 text-center md:flex-row">
              <OrgLogo size={60} />
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-amber">Leadership</p>
                <p className="mt-2 text-lg text-secondary">The team that leads our association, connects members, and grows welding standards across South India.</p>
              </div>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {team.map((member) => (
                <div key={member.name} className="rounded-3xl border border-[var(--border)] bg-secondary p-6 text-center">
                  <img src={member.photo} alt={member.name} className="mx-auto h-32 w-32 rounded-full object-cover" style={{ objectPosition: member.photoPosition }} />
                  <h3 className="mt-5 text-xl font-semibold text-navy">{member.name}</h3>
                  <p className="mt-2 text-sm text-secondary">{member.role}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-[var(--border)] bg-card p-10 shadow-sm">
            <p className="text-sm uppercase tracking-[0.3em] text-amber">சங்கத்தின் விதிமுறைகள்</p>
            <div className="mt-8 max-h-[560px] overflow-y-auto rounded-3xl border border-[var(--border)] bg-secondary p-6 text-secondary text-sm leading-7 whitespace-pre-wrap">
              {rulesText}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
