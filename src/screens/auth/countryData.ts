/**
 * Full ISO 3166-1 country/territory list (248 entries), generated from the
 * maintained 'world-countries' npm package (a build-time-only devDependency
 * — this file is the static, framework-free output; the package itself
 * isn't imported at runtime, so it adds nothing to the shipped bundle).
 * Replaces the earlier hand-picked 15-country illustrative list.
 *
 * Regenerate with: node scripts/generate-countries.mjs (see that file for
 * the exact generation logic, including how shared calling codes like NANP's
 * +1 — 25 countries/territories, from the US to Saint Lucia — are resolved:
 * one real E.164 dial code per country, distinguished by name, not merged.)
 *
 * minAge (digital-consent minimum age): only Nigeria, US, UK, Germany,
 * France, India, Brazil, Japan, South Korea, South Africa, UAE, Kenya,
 * Ghana, Canada, and Egypt have an individually-researched value here
 * (verifiedAge: true) — every other country defaults to 16 (the GDPR
 * baseline used elsewhere in this build) rather than a fabricated
 * per-country legal figure. Flagged for real per-jurisdiction legal review
 * before this default is relied on outside a demo build (§16.6 Country
 * Verification Adapter System calls for exactly this kind of per-country
 * adapter — minAge here is the placeholder that system should replace).
 */
export interface CountryRecord {
  name: string
  /** ISO 3166-1 alpha-2. */
  iso2: string
  /** E.164 calling code, e.g. '+234'. Shared across multiple countries where that's real (NANP's +1). */
  dial: string
  flag: string
  lang: string
  minAge: number
  /** true only for the 15 countries above with an individually-researched minAge. */
  verifiedAge: boolean
}

export const COUNTRIES: CountryRecord[] = [
  {
    "name": "Afghanistan",
    "iso2": "AF",
    "dial": "+93",
    "flag": "🇦🇫",
    "lang": "Dari / Pashto / Turkmen",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Åland Islands",
    "iso2": "AX",
    "dial": "+35818",
    "flag": "🇦🇽",
    "lang": "Swedish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Albania",
    "iso2": "AL",
    "dial": "+355",
    "flag": "🇦🇱",
    "lang": "Albanian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Algeria",
    "iso2": "DZ",
    "dial": "+213",
    "flag": "🇩🇿",
    "lang": "Arabic",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "American Samoa",
    "iso2": "AS",
    "dial": "+1",
    "flag": "🇦🇸",
    "lang": "English / Samoan",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Andorra",
    "iso2": "AD",
    "dial": "+376",
    "flag": "🇦🇩",
    "lang": "Catalan",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Angola",
    "iso2": "AO",
    "dial": "+244",
    "flag": "🇦🇴",
    "lang": "Portuguese",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Anguilla",
    "iso2": "AI",
    "dial": "+1",
    "flag": "🇦🇮",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Antigua and Barbuda",
    "iso2": "AG",
    "dial": "+1",
    "flag": "🇦🇬",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Argentina",
    "iso2": "AR",
    "dial": "+54",
    "flag": "🇦🇷",
    "lang": "Guaraní / Spanish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Armenia",
    "iso2": "AM",
    "dial": "+374",
    "flag": "🇦🇲",
    "lang": "Armenian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Aruba",
    "iso2": "AW",
    "dial": "+297",
    "flag": "🇦🇼",
    "lang": "Dutch / Papiamento",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Australia",
    "iso2": "AU",
    "dial": "+61",
    "flag": "🇦🇺",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Austria",
    "iso2": "AT",
    "dial": "+43",
    "flag": "🇦🇹",
    "lang": "Austro-Bavarian German",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Azerbaijan",
    "iso2": "AZ",
    "dial": "+994",
    "flag": "🇦🇿",
    "lang": "Azerbaijani / Russian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Bahamas",
    "iso2": "BS",
    "dial": "+1",
    "flag": "🇧🇸",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Bahrain",
    "iso2": "BH",
    "dial": "+973",
    "flag": "🇧🇭",
    "lang": "Arabic",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Bangladesh",
    "iso2": "BD",
    "dial": "+880",
    "flag": "🇧🇩",
    "lang": "Bengali",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Barbados",
    "iso2": "BB",
    "dial": "+1",
    "flag": "🇧🇧",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Belarus",
    "iso2": "BY",
    "dial": "+375",
    "flag": "🇧🇾",
    "lang": "Belarusian / Russian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Belgium",
    "iso2": "BE",
    "dial": "+32",
    "flag": "🇧🇪",
    "lang": "German / French / Dutch",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Belize",
    "iso2": "BZ",
    "dial": "+501",
    "flag": "🇧🇿",
    "lang": "Belizean Creole / English / Spanish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Benin",
    "iso2": "BJ",
    "dial": "+229",
    "flag": "🇧🇯",
    "lang": "French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Bermuda",
    "iso2": "BM",
    "dial": "+1",
    "flag": "🇧🇲",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Bhutan",
    "iso2": "BT",
    "dial": "+975",
    "flag": "🇧🇹",
    "lang": "Dzongkha",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Bolivia",
    "iso2": "BO",
    "dial": "+591",
    "flag": "🇧🇴",
    "lang": "Aymara / Guaraní / Quechua",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Bosnia and Herzegovina",
    "iso2": "BA",
    "dial": "+387",
    "flag": "🇧🇦",
    "lang": "Bosnian / Croatian / Serbian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Botswana",
    "iso2": "BW",
    "dial": "+267",
    "flag": "🇧🇼",
    "lang": "English / Tswana",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Bouvet Island",
    "iso2": "BV",
    "dial": "+47",
    "flag": "🇧🇻",
    "lang": "Norwegian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Brazil",
    "iso2": "BR",
    "dial": "+55",
    "flag": "🇧🇷",
    "lang": "Portuguese",
    "minAge": 13,
    "verifiedAge": true
  },
  {
    "name": "British Indian Ocean Territory",
    "iso2": "IO",
    "dial": "+246",
    "flag": "🇮🇴",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "British Virgin Islands",
    "iso2": "VG",
    "dial": "+1",
    "flag": "🇻🇬",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Brunei",
    "iso2": "BN",
    "dial": "+673",
    "flag": "🇧🇳",
    "lang": "Malay",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Bulgaria",
    "iso2": "BG",
    "dial": "+359",
    "flag": "🇧🇬",
    "lang": "Bulgarian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Burkina Faso",
    "iso2": "BF",
    "dial": "+226",
    "flag": "🇧🇫",
    "lang": "French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Burundi",
    "iso2": "BI",
    "dial": "+257",
    "flag": "🇧🇮",
    "lang": "French / Kirundi",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Cambodia",
    "iso2": "KH",
    "dial": "+855",
    "flag": "🇰🇭",
    "lang": "Khmer",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Cameroon",
    "iso2": "CM",
    "dial": "+237",
    "flag": "🇨🇲",
    "lang": "English / French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Canada",
    "iso2": "CA",
    "dial": "+1",
    "flag": "🇨🇦",
    "lang": "English / French",
    "minAge": 13,
    "verifiedAge": true
  },
  {
    "name": "Cape Verde",
    "iso2": "CV",
    "dial": "+238",
    "flag": "🇨🇻",
    "lang": "Portuguese",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Caribbean Netherlands",
    "iso2": "BQ",
    "dial": "+599",
    "flag": "🇧🇶",
    "lang": "English / Dutch / Papiamento",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Cayman Islands",
    "iso2": "KY",
    "dial": "+1",
    "flag": "🇰🇾",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Central African Republic",
    "iso2": "CF",
    "dial": "+236",
    "flag": "🇨🇫",
    "lang": "French / Sango",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Chad",
    "iso2": "TD",
    "dial": "+235",
    "flag": "🇹🇩",
    "lang": "Arabic / French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Chile",
    "iso2": "CL",
    "dial": "+56",
    "flag": "🇨🇱",
    "lang": "Spanish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "China",
    "iso2": "CN",
    "dial": "+86",
    "flag": "🇨🇳",
    "lang": "Chinese",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Christmas Island",
    "iso2": "CX",
    "dial": "+61",
    "flag": "🇨🇽",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Cocos (Keeling) Islands",
    "iso2": "CC",
    "dial": "+61",
    "flag": "🇨🇨",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Colombia",
    "iso2": "CO",
    "dial": "+57",
    "flag": "🇨🇴",
    "lang": "Spanish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Comoros",
    "iso2": "KM",
    "dial": "+269",
    "flag": "🇰🇲",
    "lang": "Arabic / French / Comorian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Cook Islands",
    "iso2": "CK",
    "dial": "+682",
    "flag": "🇨🇰",
    "lang": "English / Cook Islands Māori",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Costa Rica",
    "iso2": "CR",
    "dial": "+506",
    "flag": "🇨🇷",
    "lang": "Spanish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Croatia",
    "iso2": "HR",
    "dial": "+385",
    "flag": "🇭🇷",
    "lang": "Croatian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Cuba",
    "iso2": "CU",
    "dial": "+53",
    "flag": "🇨🇺",
    "lang": "Spanish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Curaçao",
    "iso2": "CW",
    "dial": "+599",
    "flag": "🇨🇼",
    "lang": "English / Dutch / Papiamento",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Cyprus",
    "iso2": "CY",
    "dial": "+357",
    "flag": "🇨🇾",
    "lang": "Greek / Turkish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Czechia",
    "iso2": "CZ",
    "dial": "+420",
    "flag": "🇨🇿",
    "lang": "Czech / Slovak",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Denmark",
    "iso2": "DK",
    "dial": "+45",
    "flag": "🇩🇰",
    "lang": "Danish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Djibouti",
    "iso2": "DJ",
    "dial": "+253",
    "flag": "🇩🇯",
    "lang": "Arabic / French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Dominica",
    "iso2": "DM",
    "dial": "+1",
    "flag": "🇩🇲",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Dominican Republic",
    "iso2": "DO",
    "dial": "+1",
    "flag": "🇩🇴",
    "lang": "Spanish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "DR Congo",
    "iso2": "CD",
    "dial": "+243",
    "flag": "🇨🇩",
    "lang": "French / Kikongo / Lingala",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Ecuador",
    "iso2": "EC",
    "dial": "+593",
    "flag": "🇪🇨",
    "lang": "Spanish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Egypt",
    "iso2": "EG",
    "dial": "+20",
    "flag": "🇪🇬",
    "lang": "Arabic",
    "minAge": 16,
    "verifiedAge": true
  },
  {
    "name": "El Salvador",
    "iso2": "SV",
    "dial": "+503",
    "flag": "🇸🇻",
    "lang": "Spanish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Equatorial Guinea",
    "iso2": "GQ",
    "dial": "+240",
    "flag": "🇬🇶",
    "lang": "French / Portuguese / Spanish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Eritrea",
    "iso2": "ER",
    "dial": "+291",
    "flag": "🇪🇷",
    "lang": "Arabic / English / Tigrinya",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Estonia",
    "iso2": "EE",
    "dial": "+372",
    "flag": "🇪🇪",
    "lang": "Estonian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Eswatini",
    "iso2": "SZ",
    "dial": "+268",
    "flag": "🇸🇿",
    "lang": "English / Swazi",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Ethiopia",
    "iso2": "ET",
    "dial": "+251",
    "flag": "🇪🇹",
    "lang": "Amharic",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Falkland Islands",
    "iso2": "FK",
    "dial": "+500",
    "flag": "🇫🇰",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Faroe Islands",
    "iso2": "FO",
    "dial": "+298",
    "flag": "🇫🇴",
    "lang": "Danish / Faroese",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Fiji",
    "iso2": "FJ",
    "dial": "+679",
    "flag": "🇫🇯",
    "lang": "English / Fijian / Fiji Hindi",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Finland",
    "iso2": "FI",
    "dial": "+358",
    "flag": "🇫🇮",
    "lang": "Finnish / Swedish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "France",
    "iso2": "FR",
    "dial": "+33",
    "flag": "🇫🇷",
    "lang": "French",
    "minAge": 15,
    "verifiedAge": true
  },
  {
    "name": "French Guiana",
    "iso2": "GF",
    "dial": "+594",
    "flag": "🇬🇫",
    "lang": "French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "French Polynesia",
    "iso2": "PF",
    "dial": "+689",
    "flag": "🇵🇫",
    "lang": "French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "French Southern and Antarctic Lands",
    "iso2": "TF",
    "dial": "+262",
    "flag": "🇹🇫",
    "lang": "French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Gabon",
    "iso2": "GA",
    "dial": "+241",
    "flag": "🇬🇦",
    "lang": "French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Gambia",
    "iso2": "GM",
    "dial": "+220",
    "flag": "🇬🇲",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Georgia",
    "iso2": "GE",
    "dial": "+995",
    "flag": "🇬🇪",
    "lang": "Georgian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Germany",
    "iso2": "DE",
    "dial": "+49",
    "flag": "🇩🇪",
    "lang": "German",
    "minAge": 16,
    "verifiedAge": true
  },
  {
    "name": "Ghana",
    "iso2": "GH",
    "dial": "+233",
    "flag": "🇬🇭",
    "lang": "English",
    "minAge": 13,
    "verifiedAge": true
  },
  {
    "name": "Gibraltar",
    "iso2": "GI",
    "dial": "+350",
    "flag": "🇬🇮",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Greece",
    "iso2": "GR",
    "dial": "+30",
    "flag": "🇬🇷",
    "lang": "Greek",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Greenland",
    "iso2": "GL",
    "dial": "+299",
    "flag": "🇬🇱",
    "lang": "Greenlandic",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Grenada",
    "iso2": "GD",
    "dial": "+1",
    "flag": "🇬🇩",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Guadeloupe",
    "iso2": "GP",
    "dial": "+590",
    "flag": "🇬🇵",
    "lang": "French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Guam",
    "iso2": "GU",
    "dial": "+1",
    "flag": "🇬🇺",
    "lang": "Chamorro / English / Spanish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Guatemala",
    "iso2": "GT",
    "dial": "+502",
    "flag": "🇬🇹",
    "lang": "Spanish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Guernsey",
    "iso2": "GG",
    "dial": "+44",
    "flag": "🇬🇬",
    "lang": "English / French / Guernésiais",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Guinea",
    "iso2": "GN",
    "dial": "+224",
    "flag": "🇬🇳",
    "lang": "French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Guinea-Bissau",
    "iso2": "GW",
    "dial": "+245",
    "flag": "🇬🇼",
    "lang": "Portuguese / Upper Guinea Creole",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Guyana",
    "iso2": "GY",
    "dial": "+592",
    "flag": "🇬🇾",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Haiti",
    "iso2": "HT",
    "dial": "+509",
    "flag": "🇭🇹",
    "lang": "French / Haitian Creole",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Honduras",
    "iso2": "HN",
    "dial": "+504",
    "flag": "🇭🇳",
    "lang": "Spanish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Hong Kong",
    "iso2": "HK",
    "dial": "+852",
    "flag": "🇭🇰",
    "lang": "English / Chinese",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Hungary",
    "iso2": "HU",
    "dial": "+36",
    "flag": "🇭🇺",
    "lang": "Hungarian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Iceland",
    "iso2": "IS",
    "dial": "+354",
    "flag": "🇮🇸",
    "lang": "Icelandic",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "India",
    "iso2": "IN",
    "dial": "+91",
    "flag": "🇮🇳",
    "lang": "English / Hindi / Tamil",
    "minAge": 18,
    "verifiedAge": true
  },
  {
    "name": "Indonesia",
    "iso2": "ID",
    "dial": "+62",
    "flag": "🇮🇩",
    "lang": "Indonesian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Iran",
    "iso2": "IR",
    "dial": "+98",
    "flag": "🇮🇷",
    "lang": "Persian (Farsi)",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Iraq",
    "iso2": "IQ",
    "dial": "+964",
    "flag": "🇮🇶",
    "lang": "Arabic / Aramaic / Sorani",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Ireland",
    "iso2": "IE",
    "dial": "+353",
    "flag": "🇮🇪",
    "lang": "English / Irish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Isle of Man",
    "iso2": "IM",
    "dial": "+44",
    "flag": "🇮🇲",
    "lang": "English / Manx",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Israel",
    "iso2": "IL",
    "dial": "+972",
    "flag": "🇮🇱",
    "lang": "Arabic / Hebrew",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Italy",
    "iso2": "IT",
    "dial": "+39",
    "flag": "🇮🇹",
    "lang": "Italian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Ivory Coast",
    "iso2": "CI",
    "dial": "+225",
    "flag": "🇨🇮",
    "lang": "French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Jamaica",
    "iso2": "JM",
    "dial": "+1",
    "flag": "🇯🇲",
    "lang": "English / Jamaican Patois",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Japan",
    "iso2": "JP",
    "dial": "+81",
    "flag": "🇯🇵",
    "lang": "Japanese",
    "minAge": 16,
    "verifiedAge": true
  },
  {
    "name": "Jersey",
    "iso2": "JE",
    "dial": "+44",
    "flag": "🇯🇪",
    "lang": "English / French / Jèrriais",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Jordan",
    "iso2": "JO",
    "dial": "+962",
    "flag": "🇯🇴",
    "lang": "Arabic",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Kazakhstan",
    "iso2": "KZ",
    "dial": "+7",
    "flag": "🇰🇿",
    "lang": "Kazakh / Russian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Kenya",
    "iso2": "KE",
    "dial": "+254",
    "flag": "🇰🇪",
    "lang": "English / Swahili",
    "minAge": 13,
    "verifiedAge": true
  },
  {
    "name": "Kiribati",
    "iso2": "KI",
    "dial": "+686",
    "flag": "🇰🇮",
    "lang": "English / Gilbertese",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Kosovo",
    "iso2": "XK",
    "dial": "+383",
    "flag": "🇽🇰",
    "lang": "Albanian / Serbian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Kuwait",
    "iso2": "KW",
    "dial": "+965",
    "flag": "🇰🇼",
    "lang": "Arabic",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Kyrgyzstan",
    "iso2": "KG",
    "dial": "+996",
    "flag": "🇰🇬",
    "lang": "Kyrgyz / Russian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Laos",
    "iso2": "LA",
    "dial": "+856",
    "flag": "🇱🇦",
    "lang": "Lao",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Latvia",
    "iso2": "LV",
    "dial": "+371",
    "flag": "🇱🇻",
    "lang": "Latvian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Lebanon",
    "iso2": "LB",
    "dial": "+961",
    "flag": "🇱🇧",
    "lang": "Arabic / French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Lesotho",
    "iso2": "LS",
    "dial": "+266",
    "flag": "🇱🇸",
    "lang": "English / Sotho",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Liberia",
    "iso2": "LR",
    "dial": "+231",
    "flag": "🇱🇷",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Libya",
    "iso2": "LY",
    "dial": "+218",
    "flag": "🇱🇾",
    "lang": "Arabic",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Liechtenstein",
    "iso2": "LI",
    "dial": "+423",
    "flag": "🇱🇮",
    "lang": "German",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Lithuania",
    "iso2": "LT",
    "dial": "+370",
    "flag": "🇱🇹",
    "lang": "Lithuanian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Luxembourg",
    "iso2": "LU",
    "dial": "+352",
    "flag": "🇱🇺",
    "lang": "German / French / Luxembourgish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Macau",
    "iso2": "MO",
    "dial": "+853",
    "flag": "🇲🇴",
    "lang": "Portuguese / Chinese",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Madagascar",
    "iso2": "MG",
    "dial": "+261",
    "flag": "🇲🇬",
    "lang": "French / Malagasy",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Malawi",
    "iso2": "MW",
    "dial": "+265",
    "flag": "🇲🇼",
    "lang": "English / Chewa",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Malaysia",
    "iso2": "MY",
    "dial": "+60",
    "flag": "🇲🇾",
    "lang": "English / Malay",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Maldives",
    "iso2": "MV",
    "dial": "+960",
    "flag": "🇲🇻",
    "lang": "Maldivian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Mali",
    "iso2": "ML",
    "dial": "+223",
    "flag": "🇲🇱",
    "lang": "French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Malta",
    "iso2": "MT",
    "dial": "+356",
    "flag": "🇲🇹",
    "lang": "English / Maltese",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Marshall Islands",
    "iso2": "MH",
    "dial": "+692",
    "flag": "🇲🇭",
    "lang": "English / Marshallese",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Martinique",
    "iso2": "MQ",
    "dial": "+596",
    "flag": "🇲🇶",
    "lang": "French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Mauritania",
    "iso2": "MR",
    "dial": "+222",
    "flag": "🇲🇷",
    "lang": "Arabic",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Mauritius",
    "iso2": "MU",
    "dial": "+230",
    "flag": "🇲🇺",
    "lang": "English / French / Mauritian Creole",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Mayotte",
    "iso2": "YT",
    "dial": "+262",
    "flag": "🇾🇹",
    "lang": "French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Mexico",
    "iso2": "MX",
    "dial": "+52",
    "flag": "🇲🇽",
    "lang": "Spanish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Micronesia",
    "iso2": "FM",
    "dial": "+691",
    "flag": "🇫🇲",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Moldova",
    "iso2": "MD",
    "dial": "+373",
    "flag": "🇲🇩",
    "lang": "Moldavian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Monaco",
    "iso2": "MC",
    "dial": "+377",
    "flag": "🇲🇨",
    "lang": "French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Mongolia",
    "iso2": "MN",
    "dial": "+976",
    "flag": "🇲🇳",
    "lang": "Mongolian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Montenegro",
    "iso2": "ME",
    "dial": "+382",
    "flag": "🇲🇪",
    "lang": "Montenegrin",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Montserrat",
    "iso2": "MS",
    "dial": "+1",
    "flag": "🇲🇸",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Morocco",
    "iso2": "MA",
    "dial": "+212",
    "flag": "🇲🇦",
    "lang": "Arabic / Berber",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Mozambique",
    "iso2": "MZ",
    "dial": "+258",
    "flag": "🇲🇿",
    "lang": "Portuguese",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Myanmar",
    "iso2": "MM",
    "dial": "+95",
    "flag": "🇲🇲",
    "lang": "Burmese",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Namibia",
    "iso2": "NA",
    "dial": "+264",
    "flag": "🇳🇦",
    "lang": "Afrikaans / German / English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Nauru",
    "iso2": "NR",
    "dial": "+674",
    "flag": "🇳🇷",
    "lang": "English / Nauru",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Nepal",
    "iso2": "NP",
    "dial": "+977",
    "flag": "🇳🇵",
    "lang": "Nepali",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Netherlands",
    "iso2": "NL",
    "dial": "+31",
    "flag": "🇳🇱",
    "lang": "Dutch",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "New Caledonia",
    "iso2": "NC",
    "dial": "+687",
    "flag": "🇳🇨",
    "lang": "French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "New Zealand",
    "iso2": "NZ",
    "dial": "+64",
    "flag": "🇳🇿",
    "lang": "English / Māori / New Zealand Sign Language",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Nicaragua",
    "iso2": "NI",
    "dial": "+505",
    "flag": "🇳🇮",
    "lang": "Spanish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Niger",
    "iso2": "NE",
    "dial": "+227",
    "flag": "🇳🇪",
    "lang": "French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Nigeria",
    "iso2": "NG",
    "dial": "+234",
    "flag": "🇳🇬",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": true
  },
  {
    "name": "Niue",
    "iso2": "NU",
    "dial": "+683",
    "flag": "🇳🇺",
    "lang": "English / Niuean",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Norfolk Island",
    "iso2": "NF",
    "dial": "+672",
    "flag": "🇳🇫",
    "lang": "English / Norfuk",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "North Korea",
    "iso2": "KP",
    "dial": "+850",
    "flag": "🇰🇵",
    "lang": "Korean",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "North Macedonia",
    "iso2": "MK",
    "dial": "+389",
    "flag": "🇲🇰",
    "lang": "Macedonian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Northern Mariana Islands",
    "iso2": "MP",
    "dial": "+1",
    "flag": "🇲🇵",
    "lang": "Carolinian / Chamorro / English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Norway",
    "iso2": "NO",
    "dial": "+47",
    "flag": "🇳🇴",
    "lang": "Norwegian Nynorsk / Norwegian Bokmål / Sami",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Oman",
    "iso2": "OM",
    "dial": "+968",
    "flag": "🇴🇲",
    "lang": "Arabic",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Pakistan",
    "iso2": "PK",
    "dial": "+92",
    "flag": "🇵🇰",
    "lang": "English / Urdu",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Palau",
    "iso2": "PW",
    "dial": "+680",
    "flag": "🇵🇼",
    "lang": "English / Palauan",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Palestine",
    "iso2": "PS",
    "dial": "+970",
    "flag": "🇵🇸",
    "lang": "Arabic",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Panama",
    "iso2": "PA",
    "dial": "+507",
    "flag": "🇵🇦",
    "lang": "Spanish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Papua New Guinea",
    "iso2": "PG",
    "dial": "+675",
    "flag": "🇵🇬",
    "lang": "English / Hiri Motu / Tok Pisin",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Paraguay",
    "iso2": "PY",
    "dial": "+595",
    "flag": "🇵🇾",
    "lang": "Guaraní / Spanish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Peru",
    "iso2": "PE",
    "dial": "+51",
    "flag": "🇵🇪",
    "lang": "Aymara / Quechua / Spanish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Philippines",
    "iso2": "PH",
    "dial": "+63",
    "flag": "🇵🇭",
    "lang": "English / Filipino",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Pitcairn Islands",
    "iso2": "PN",
    "dial": "+64",
    "flag": "🇵🇳",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Poland",
    "iso2": "PL",
    "dial": "+48",
    "flag": "🇵🇱",
    "lang": "Polish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Portugal",
    "iso2": "PT",
    "dial": "+351",
    "flag": "🇵🇹",
    "lang": "Portuguese",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Puerto Rico",
    "iso2": "PR",
    "dial": "+1",
    "flag": "🇵🇷",
    "lang": "English / Spanish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Qatar",
    "iso2": "QA",
    "dial": "+974",
    "flag": "🇶🇦",
    "lang": "Arabic",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Republic of the Congo",
    "iso2": "CG",
    "dial": "+242",
    "flag": "🇨🇬",
    "lang": "French / Kikongo / Lingala",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Réunion",
    "iso2": "RE",
    "dial": "+262",
    "flag": "🇷🇪",
    "lang": "French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Romania",
    "iso2": "RO",
    "dial": "+40",
    "flag": "🇷🇴",
    "lang": "Romanian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Russia",
    "iso2": "RU",
    "dial": "+7",
    "flag": "🇷🇺",
    "lang": "Russian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Rwanda",
    "iso2": "RW",
    "dial": "+250",
    "flag": "🇷🇼",
    "lang": "English / French / Kinyarwanda",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Saint Barthélemy",
    "iso2": "BL",
    "dial": "+590",
    "flag": "🇧🇱",
    "lang": "French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Saint Helena, Ascension and Tristan da Cunha",
    "iso2": "SH",
    "dial": "+2",
    "flag": "🇸🇭",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Saint Kitts and Nevis",
    "iso2": "KN",
    "dial": "+1",
    "flag": "🇰🇳",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Saint Lucia",
    "iso2": "LC",
    "dial": "+1",
    "flag": "🇱🇨",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Saint Martin",
    "iso2": "MF",
    "dial": "+590",
    "flag": "🇲🇫",
    "lang": "French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Saint Pierre and Miquelon",
    "iso2": "PM",
    "dial": "+508",
    "flag": "🇵🇲",
    "lang": "French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Saint Vincent and the Grenadines",
    "iso2": "VC",
    "dial": "+1",
    "flag": "🇻🇨",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Samoa",
    "iso2": "WS",
    "dial": "+685",
    "flag": "🇼🇸",
    "lang": "English / Samoan",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "San Marino",
    "iso2": "SM",
    "dial": "+378",
    "flag": "🇸🇲",
    "lang": "Italian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "São Tomé and Príncipe",
    "iso2": "ST",
    "dial": "+239",
    "flag": "🇸🇹",
    "lang": "Portuguese",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Saudi Arabia",
    "iso2": "SA",
    "dial": "+966",
    "flag": "🇸🇦",
    "lang": "Arabic",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Senegal",
    "iso2": "SN",
    "dial": "+221",
    "flag": "🇸🇳",
    "lang": "French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Serbia",
    "iso2": "RS",
    "dial": "+381",
    "flag": "🇷🇸",
    "lang": "Serbian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Seychelles",
    "iso2": "SC",
    "dial": "+248",
    "flag": "🇸🇨",
    "lang": "Seychellois Creole / English / French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Sierra Leone",
    "iso2": "SL",
    "dial": "+232",
    "flag": "🇸🇱",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Singapore",
    "iso2": "SG",
    "dial": "+65",
    "flag": "🇸🇬",
    "lang": "English / Malay / Tamil",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Sint Maarten",
    "iso2": "SX",
    "dial": "+1",
    "flag": "🇸🇽",
    "lang": "English / French / Dutch",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Slovakia",
    "iso2": "SK",
    "dial": "+421",
    "flag": "🇸🇰",
    "lang": "Slovak",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Slovenia",
    "iso2": "SI",
    "dial": "+386",
    "flag": "🇸🇮",
    "lang": "Slovene",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Solomon Islands",
    "iso2": "SB",
    "dial": "+677",
    "flag": "🇸🇧",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Somalia",
    "iso2": "SO",
    "dial": "+252",
    "flag": "🇸🇴",
    "lang": "Arabic / Somali",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "South Africa",
    "iso2": "ZA",
    "dial": "+27",
    "flag": "🇿🇦",
    "lang": "Afrikaans / English / Southern Ndebele",
    "minAge": 13,
    "verifiedAge": true
  },
  {
    "name": "South Georgia",
    "iso2": "GS",
    "dial": "+500",
    "flag": "🇬🇸",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "South Korea",
    "iso2": "KR",
    "dial": "+82",
    "flag": "🇰🇷",
    "lang": "Korean",
    "minAge": 14,
    "verifiedAge": true
  },
  {
    "name": "South Sudan",
    "iso2": "SS",
    "dial": "+211",
    "flag": "🇸🇸",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Spain",
    "iso2": "ES",
    "dial": "+34",
    "flag": "🇪🇸",
    "lang": "Spanish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Sri Lanka",
    "iso2": "LK",
    "dial": "+94",
    "flag": "🇱🇰",
    "lang": "Sinhala / Tamil",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Sudan",
    "iso2": "SD",
    "dial": "+249",
    "flag": "🇸🇩",
    "lang": "Arabic / English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Suriname",
    "iso2": "SR",
    "dial": "+597",
    "flag": "🇸🇷",
    "lang": "Dutch",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Svalbard and Jan Mayen",
    "iso2": "SJ",
    "dial": "+4779",
    "flag": "🇸🇯",
    "lang": "Norwegian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Sweden",
    "iso2": "SE",
    "dial": "+46",
    "flag": "🇸🇪",
    "lang": "Swedish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Switzerland",
    "iso2": "CH",
    "dial": "+41",
    "flag": "🇨🇭",
    "lang": "French / Swiss German / Italian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Syria",
    "iso2": "SY",
    "dial": "+963",
    "flag": "🇸🇾",
    "lang": "Arabic",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Taiwan",
    "iso2": "TW",
    "dial": "+886",
    "flag": "🇹🇼",
    "lang": "Chinese",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Tajikistan",
    "iso2": "TJ",
    "dial": "+992",
    "flag": "🇹🇯",
    "lang": "Russian / Tajik",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Tanzania",
    "iso2": "TZ",
    "dial": "+255",
    "flag": "🇹🇿",
    "lang": "English / Swahili",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Thailand",
    "iso2": "TH",
    "dial": "+66",
    "flag": "🇹🇭",
    "lang": "Thai",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Timor-Leste",
    "iso2": "TL",
    "dial": "+670",
    "flag": "🇹🇱",
    "lang": "Portuguese / Tetum",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Togo",
    "iso2": "TG",
    "dial": "+228",
    "flag": "🇹🇬",
    "lang": "French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Tokelau",
    "iso2": "TK",
    "dial": "+690",
    "flag": "🇹🇰",
    "lang": "English / Samoan / Tokelauan",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Tonga",
    "iso2": "TO",
    "dial": "+676",
    "flag": "🇹🇴",
    "lang": "English / Tongan",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Trinidad and Tobago",
    "iso2": "TT",
    "dial": "+1",
    "flag": "🇹🇹",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Tunisia",
    "iso2": "TN",
    "dial": "+216",
    "flag": "🇹🇳",
    "lang": "Arabic",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Türkiye",
    "iso2": "TR",
    "dial": "+90",
    "flag": "🇹🇷",
    "lang": "Turkish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Turkmenistan",
    "iso2": "TM",
    "dial": "+993",
    "flag": "🇹🇲",
    "lang": "Russian / Turkmen",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Turks and Caicos Islands",
    "iso2": "TC",
    "dial": "+1",
    "flag": "🇹🇨",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Tuvalu",
    "iso2": "TV",
    "dial": "+688",
    "flag": "🇹🇻",
    "lang": "English / Tuvaluan",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Uganda",
    "iso2": "UG",
    "dial": "+256",
    "flag": "🇺🇬",
    "lang": "English / Swahili",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Ukraine",
    "iso2": "UA",
    "dial": "+380",
    "flag": "🇺🇦",
    "lang": "Ukrainian",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "United Arab Emirates",
    "iso2": "AE",
    "dial": "+971",
    "flag": "🇦🇪",
    "lang": "Arabic",
    "minAge": 18,
    "verifiedAge": true
  },
  {
    "name": "United Kingdom",
    "iso2": "GB",
    "dial": "+44",
    "flag": "🇬🇧",
    "lang": "English",
    "minAge": 13,
    "verifiedAge": true
  },
  {
    "name": "United States",
    "iso2": "US",
    "dial": "+1",
    "flag": "🇺🇸",
    "lang": "English",
    "minAge": 13,
    "verifiedAge": true
  },
  {
    "name": "United States Minor Outlying Islands",
    "iso2": "UM",
    "dial": "+268",
    "flag": "🇺🇲",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "United States Virgin Islands",
    "iso2": "VI",
    "dial": "+1",
    "flag": "🇻🇮",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Uruguay",
    "iso2": "UY",
    "dial": "+598",
    "flag": "🇺🇾",
    "lang": "Spanish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Uzbekistan",
    "iso2": "UZ",
    "dial": "+998",
    "flag": "🇺🇿",
    "lang": "Russian / Uzbek",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Vanuatu",
    "iso2": "VU",
    "dial": "+678",
    "flag": "🇻🇺",
    "lang": "Bislama / English / French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Vatican City",
    "iso2": "VA",
    "dial": "+3",
    "flag": "🇻🇦",
    "lang": "Italian / Latin",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Venezuela",
    "iso2": "VE",
    "dial": "+58",
    "flag": "🇻🇪",
    "lang": "Spanish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Vietnam",
    "iso2": "VN",
    "dial": "+84",
    "flag": "🇻🇳",
    "lang": "Vietnamese",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Wallis and Futuna",
    "iso2": "WF",
    "dial": "+681",
    "flag": "🇼🇫",
    "lang": "French",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Western Sahara",
    "iso2": "EH",
    "dial": "+2",
    "flag": "🇪🇭",
    "lang": "Berber / Hassaniya / Spanish",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Yemen",
    "iso2": "YE",
    "dial": "+967",
    "flag": "🇾🇪",
    "lang": "Arabic",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Zambia",
    "iso2": "ZM",
    "dial": "+260",
    "flag": "🇿🇲",
    "lang": "English",
    "minAge": 16,
    "verifiedAge": false
  },
  {
    "name": "Zimbabwe",
    "iso2": "ZW",
    "dial": "+263",
    "flag": "🇿🇼",
    "lang": "Chibarwe / English / Kalanga",
    "minAge": 16,
    "verifiedAge": false
  }
]

export function ageFromDob(dobStr: string): number | null {
  if (!dobStr) return null
  const d = new Date(dobStr)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const notYetBirthday = now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())
  if (notYetBirthday) age--
  return age
}

const FREE_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'protonmail.com']

/**
 * §8.4.1 — organisation official email must not be on a free/personal domain.
 *
 * Both regexes here previously read `[^s@]` (missing the backslash on `\s`)
 * — a character class excluding the literal letter 's', not whitespace. That
 * silently rejected almost every real email address containing an 's'
 * anywhere before the '@' or in the domain (which is most of them —
 * "user", "test", "smith", "first.last", …), with no visible error message
 * pointing at the email field. individualValid/orgValid stayed permanently
 * false for those emails, so Continue looked broken for no apparent reason
 * — the exact real bug behind "there's no tickbox, so I can't create an
 * account" (the checkbox that IS there several steps later was never
 * reached; email validation silently blocked getting that far).
 */
export function isOfficialDomainEmail(email: string): boolean {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return false
  const domain = email.trim().toLowerCase().split('@')[1]
  return !!domain && !FREE_EMAIL_DOMAINS.includes(domain)
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}
