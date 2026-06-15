import { Helmet } from 'react-helmet-async'
import { SITE_URL } from '../config/constants'

const SEO = ({ title, description, url }) => (
  <Helmet>
    <title>{title} | தென்னிந்திய வெல்டிங் தொழிலாளர்கள் நலச்சங்கம்</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={`${SITE_URL}${url}`} />
    <meta name="theme-color" content="#FF6B00" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" content={`${SITE_URL}${url}`} />
  </Helmet>
)

export default SEO
