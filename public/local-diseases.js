// SebilAI — LOCAL_DISEASES knowledge base (extracted from index.html in v7
// for HTML-size reduction). Loaded by <script src="/local-diseases.js"></script>
// BEFORE the main inline script in index.html, so the global identifier
// LOCAL_DISEASES is available everywhere that previously referenced it.
// 'var' (not 'const') so it attaches to window under classic-script scope.
var LOCAL_DISEASES = {
  "enset": [
    {
      name: "Bacterial Wilt (Xcm)", severity: "Very High", confidence: 88,
      keywords: ["wilting","wilt","heart","leaf","ooze","yellow","streak","brown","collapse","smell"],
      diagnosis: "Xanthomonas campestris pv. musacearum (Xcm) — the most devastating enset disease in Ethiopia. Infection spreads through tools, soil, and insects. Internal vascular tissue turns brown-yellow with bacterial ooze when cut.",
      immediate_actions: [
        "Immediately uproot the entire plant including corm and roots",
        "Bury the infected plant in a deep pit far from the field (do NOT compost)",
        "Sterilize all cutting tools with fire or 10% bleach solution before moving to next plant",
        "Mark the infected area and do not plant enset there for 2+ years",
        "Inform your neighbors — this disease spreads rapidly between farms"
      ],
      preventive_measures: [
        "Only use clean suckers from certified disease-free mother plants",
        "Never share tools between farms without sterilizing them",
        "Control insect vectors (aphids) using neem extract spray",
        "Inspect suckers carefully before transplanting — reject any with discoloration",
        "Contact Areka Agricultural Research Center for resistant varieties"
      ],
      local_treatment: "No chemical cure exists. Immediate uprooting is the ONLY management option.",
      source: "Areka ARC / Ethiopian Institute of Agricultural Research (EIAR)"
    },
    {
      name: "Root Mealybug", severity: "Medium", confidence: 75,
      keywords: ["stunted","yellow","white","roots","corm","slow","growth","waxy","cottony"],
      diagnosis: "Pseudococcus sp. mealybugs attack enset roots and corm, causing nutrient deficiency symptoms. Plants grow slowly and leaves turn pale yellow.",
      immediate_actions: [
        "Carefully dig and remove infected corms and inspect roots",
        "Apply wood ash generously around the base of affected plants",
        "Spray neem oil solution (50ml/L water) on corm area",
        "Remove severely infected plants and dispose far from field"
      ],
      preventive_measures: [
        "Use healthy suckers from inspected mother plants",
        "Maintain proper drainage — mealybugs thrive in waterlogged soil",
        "Apply wood ash as preventive soil treatment during transplanting",
        "Inspect roots every 3 months during the growing season"
      ],
      local_treatment: "Wood ash application + neem oil spray every 2 weeks for 6 weeks.",
      source: "Areka ARC Research Bulletin"
    },
    {
      name: "Enset Xanthomonas Wilt (Early Stage)", severity: "High", confidence: 80,
      keywords: ["yellowing","pale","leaf edge","early","slight wilt","marginal necrosis"],
      diagnosis: "Early-stage Xcm infection. Symptoms appear first on leaf margins as yellowing or necrosis before full wilting occurs. Immediate action can save surrounding plants.",
      immediate_actions: [
        "Isolate the plant immediately — create a buffer zone around it",
        "Do not harvest or move any plant parts from this area",
        "Remove and bury all suspicious plants within 2 meters",
        "Sterilize all tools with fire between each plant"
      ],
      preventive_measures: [
        "Regular field scouting every 2 weeks during rainy season",
        "Remove and burn all plant debris after harvest",
        "Avoid working in the field when plants are wet"
      ],
      local_treatment: "Removal and burial of affected plants. No chemical treatment effective.",
      source: "EIAR / Jimma University Cooperative"
    },
    {
      name: "Kocho Fermentation Failure", severity: "Low", confidence: 65,
      keywords: ["smell","fermentation","dark","bad","processing","kocho","storage"],
      diagnosis: "Not a plant disease but a post-harvest management issue. Poor fermentation of enset pulp leads to spoilage. Often caused by contamination or insufficient fermentation time.",
      immediate_actions: [
        "Discard spoiled kocho — do not consume or feed to animals",
        "Clean fermentation containers with hot water and sun-dry them",
        "Ensure fermentation pit is properly lined and sealed"
      ],
      preventive_measures: [
        "Ferment for minimum 3-6 months for safe kocho",
        "Keep fermentation pit sealed and away from water runoff",
        "Use clean tools for processing — boil wooden tools regularly"
      ],
      local_treatment: "Prevention through proper fermentation technique.",
      source: "Hawassa University Research"
    }
  ],
  "teff": [
    {
      name: "Leaf Rust (Puccinia striiformis)", severity: "High", confidence: 85,
      keywords: ["orange","rust","pustules","leaf","yellow","powder","stripe","spots"],
      diagnosis: "Puccinia rust fungus attacking teff leaves. Orange-yellow pustules appear on leaf surface. Severely reduces grain yield (up to 50% loss) under humid conditions. Common in highland areas 1800-2500m altitude.",
      immediate_actions: [
        "Apply Propiconazole 250EC at 0.5L/ha at FIRST sign of pustules",
        "Alternatively use Mancozeb 80WP at 2kg/ha",
        "Spray in early morning or late afternoon — not in midday heat",
        "Repeat spray after 14 days if rain occurs",
        "Do not harvest until 14 days after last fungicide application"
      ],
      preventive_measures: [
        "Use rust-resistant teff varieties: Quncho (DZ-Cr-387), Magna, Tsedey",
        "Plant at recommended spacing (20x20cm) to allow good airflow",
        "Avoid planting in low-lying areas with poor air drainage",
        "Rotate with legumes (lentils, faba bean) every 2-3 seasons",
        "Destroy infected crop residue after harvest — do not leave on field"
      ],
      local_treatment: "Propiconazole 250EC (0.5L/ha) OR Mancozeb 80WP (2kg/ha). Cost: ~200-400 ETB/ha.",
      source: "Debre Zeit Agricultural Research Center (DZARC)"
    },
    {
      name: "Head Smudge (Helminthosporium)", severity: "Medium", confidence: 78,
      keywords: ["dark","smudge","head","grain","black","discolor","dirty","tip"],
      diagnosis: "Helminthosporium spp. fungal infection occurring at heading/grain-fill stage. Dark sooty smudge appears on grain heads. Reduces grain quality and market value significantly.",
      immediate_actions: [
        "Apply Mancozeb 80WP (2kg/ha) at heading stage immediately",
        "Remove and burn severely infected heads to reduce spore spread",
        "Improve field drainage if waterlogged"
      ],
      preventive_measures: [
        "Use certified seed treated with Thiram or Metalaxyl",
        "Plant early in the season to avoid heading during heavy rains",
        "Use improved varieties from Debre Zeit ARC",
        "Practice 2-year crop rotation"
      ],
      local_treatment: "Mancozeb 80WP at 2kg/ha at heading. Cost: ~150-250 ETB/ha.",
      source: "DZARC Teff Research Program"
    },
    {
      name: "Teff Shoot Fly (Atherigona)", severity: "High", confidence: 80,
      keywords: ["dead heart","shoot","dying","center","shoot dead","tip dead","dry center"],
      diagnosis: "Atherigona spp. fly larvae bore into teff shoots causing characteristic 'dead heart' symptom — the central shoot dies while outer leaves remain green. Worst during early seedling stage.",
      immediate_actions: [
        "Remove and destroy dead-heart tillers immediately",
        "Apply Dimethoate 40EC (1L/ha) if infestation is severe (>10% dead hearts)",
        "Increase plant population by thicker seeding to compensate losses"
      ],
      preventive_measures: [
        "Plant early in the season (June-July) to escape peak fly emergence",
        "Use higher seeding rates (25-30kg/ha) to compensate for losses",
        "Intercrop with lentils or chickpeas to repel flies"
      ],
      local_treatment: "Dimethoate 40EC (1L/ha). Early planting is the most effective prevention.",
      source: "EIAR Melkassa Agricultural Research Center"
    },
    {
      name: "Teff Blister Blight", severity: "Medium", confidence: 72,
      keywords: ["blister","white","bubble","leaf","water soak","wet patch"],
      diagnosis: "Fungal disease causing water-soaked blisters on teff leaves during wet seasons. Reduces photosynthetic area but rarely causes complete crop failure.",
      immediate_actions: [
        "Apply copper-based fungicide (Kocide 2000 at 2kg/ha)",
        "Improve field drainage by creating drainage channels",
        "Avoid overhead irrigation if using irrigation"
      ],
      preventive_measures: [
        "Proper field drainage before planting",
        "Avoid planting in flood-prone low areas",
        "Use wider spacing in high-rainfall areas"
      ],
      local_treatment: "Copper oxychloride spray at 2kg/ha. Focus on drainage improvement.",
      source: "Holeta Agricultural Research Center"
    }
  ],
  "wheat": [
    {
      name: "Stripe Rust (Yellow Rust)", severity: "Very High", confidence: 90,
      keywords: ["yellow","stripe","rust","stripe","line","pustule","powder","orange-yellow"],
      diagnosis: "Puccinia striiformis — the #1 wheat disease in Ethiopian highlands. Yellow-orange pustules arranged in stripes along leaf veins. Can destroy entire crop within 2-3 weeks under cool, humid conditions (15-20°C). URGENT treatment needed.",
      immediate_actions: [
        "Apply Tebuconazole 250EC (0.5L/ha) OR Propiconazole 250EC (0.5L/ha) IMMEDIATELY",
        "Spray the entire field — do not spot-treat only visible patches",
        "Repeat spray after 14 days if weather remains humid and cool",
        "Alert neighboring farmers — stripe rust spreads very rapidly by wind"
      ],
      preventive_measures: [
        "Plant Ug99-resistant varieties: Kakaba, Danda'a, Ogolcho, Shorima",
        "Plant at recommended time (October-November in highland areas)",
        "Avoid dense planting — maintain 20cm row spacing for airflow",
        "Monitor fields weekly from tillering to grain fill stage",
        "Contact EIAR/MoA extension agent if stripe rust confirmed"
      ],
      local_treatment: "Tebuconazole 250EC (0.5L/ha) — most effective. Cost: ~350-500 ETB/ha. Apply within 48 hours of first symptoms.",
      source: "EIAR Holeta Wheat Research / CIMMYT Ethiopia"
    },
    {
      name: "Stem Rust (Ug99)", severity: "Very High", confidence: 88,
      keywords: ["stem","brick","red","rust","stalk","brown","brick-red","stem lesion"],
      diagnosis: "Puccinia graminis race Ug99 — extremely virulent stem rust that can cause 100% yield loss. Brick-red oval pustules on stems and leaf sheaths. Ethiopia is in the primary spread zone of Ug99.",
      immediate_actions: [
        "Apply Propiconazole 250EC (0.5L/ha) IMMEDIATELY — do not delay",
        "Contact your nearest Agricultural Research Center urgently",
        "Report outbreak to local MoA office — this is a national emergency disease",
        "Do not move infected plant material between fields"
      ],
      preventive_measures: [
        "ONLY plant Ug99-resistant varieties approved by EIAR",
        "Varieties: Kakaba, Danda'a, Tsehay, Hidasie are resistant to Ug99",
        "Early planting to escape epidemic risk period",
        "Never save seed from infected fields"
      ],
      local_treatment: "Propiconazole 250EC immediately. This is a national-priority disease.",
      source: "EIAR / Cornell University / CIMMYT Ug99 Monitoring Program"
    },
    {
      name: "Fusarium Head Blight (Scab)", severity: "High", confidence: 82,
      keywords: ["pink","head","grain","scab","bleach","white head","pink powder","grain rot"],
      diagnosis: "Fusarium graminearum infects wheat heads at flowering stage. Bleached or pink-orange spikelets on the head. Produces mycotoxins (DON) making grain unsafe for human and animal consumption.",
      immediate_actions: [
        "Apply Tebuconazole 250EC (0.5L/ha) at flowering stage",
        "Do not use infected grain for food or seed",
        "Harvest early and dry grain quickly below 12% moisture",
        "Consult extension agent before selling potentially contaminated grain"
      ],
      preventive_measures: [
        "Plant at recommended time to avoid flowering during rainy period",
        "Use Fusarium-tolerant varieties from EIAR",
        "Practice crop rotation — avoid wheat after maize",
        "Avoid excessive nitrogen fertilizer which promotes disease"
      ],
      local_treatment: "Tebuconazole at flowering + quick drying after harvest. Do not consume infected grain.",
      source: "EIAR Kulumsa Agricultural Research Center"
    },
    {
      name: "Septoria Leaf Blotch", severity: "Medium", confidence: 75,
      keywords: ["tan","blotch","lesion","brown","lower leaf","pycnidia","dots","water soak"],
      diagnosis: "Septoria tritici causing tan-brown irregular blotches on lower leaves with tiny black dots (pycnidia) visible inside lesions. Spreads upward during rainy weather.",
      immediate_actions: [
        "Apply Propiconazole 250EC or Mancozeb at first sign on lower leaves",
        "Remove heavily infected lower leaves to reduce spore source"
      ],
      preventive_measures: [
        "Resistant varieties from Holeta ARC",
        "Avoid dense planting and excessive nitrogen",
        "Crop rotation with non-grass crops"
      ],
      local_treatment: "Propiconazole 250EC (0.5L/ha). Focus on preventing upward spread.",
      source: "Holeta Agricultural Research Center"
    },
    {
      name: "Loose Smut", severity: "Medium", confidence: 78,
      keywords: ["black","smut","head","powder","sooty","grain replaced"],
      diagnosis: "Ustilago tritici — entire wheat head replaced by black smut mass. Spreads through infected seed. Severely reduces yield and is seed-borne.",
      immediate_actions: [
        "Remove smutted heads immediately and burn — do not let spores spread",
        "Do NOT use grain from infected field as seed",
        "Report to extension agent for next season seed replacement"
      ],
      preventive_measures: [
        "Treat seed with Carboxin+Thiram (Vitavax 200) before planting",
        "Use certified disease-free seed from MoA/EIAR",
        "Never save seed from a field with smut"
      ],
      local_treatment: "Seed treatment with Vitavax 200 (Carboxin+Thiram) prevents next season infection.",
      source: "EIAR Plant Pathology Division"
    }
  ],
  "maize": [
    {
      name: "Northern Leaf Blight (NLB)", severity: "High", confidence: 85,
      keywords: ["gray","long","cigar","lesion","leaf","blight","tan","elongated","elliptical"],
      diagnosis: "Exserohilum turcicum causing large gray-tan elliptical lesions (2-15cm) on maize leaves, resembling cigar shapes. Can cause 30-50% yield loss in susceptible varieties. Common during cool, humid highland conditions.",
      immediate_actions: [
        "Apply Propiconazole 250EC (0.5L/ha) at first sign of lesions",
        "Remove and burn heavily infected lower leaves",
        "Improve spacing if crop is very dense",
        "Do not work in the field when leaves are wet — spreads fungal spores"
      ],
      preventive_measures: [
        "Plant NLB-resistant varieties: BH-540, BH-543, BH-661, BHQPY-545",
        "Practice 2-year crop rotation with legumes (soybean, haricot bean)",
        "Destroy maize crop residue after harvest — do not leave stalks in field",
        "Avoid planting in same field consecutively for more than 2 years"
      ],
      local_treatment: "Propiconazole 250EC (0.5L/ha). Cost: ~350 ETB/ha. Resistant varieties are the best long-term solution.",
      source: "Melkassa Agricultural Research Center (MARC)"
    },
    {
      name: "Fall Armyworm (FAW)", severity: "Very High", confidence: 90,
      keywords: ["worm","caterpillar","hole","eat","frass","heart","larva","feeding","bore","damage"],
      diagnosis: "Spodoptera frugiperda — most destructive maize pest in Ethiopia since 2018. Larvae feed on young leaves leaving characteristic 'shot-hole' pattern and brown frass (excrement) in the whorl. Can cause 20-100% yield loss if untreated.",
      immediate_actions: [
        "Apply Emamectin benzoate 1.9EC (0.4L/ha) into the whorl IMMEDIATELY",
        "Alternatively use Lambda-cyhalothrin (0.5L/ha) for cheaper option",
        "Apply in early morning or late evening when larvae are active",
        "Target the whorl (heart) of the plant — not the leaves",
        "Check field every 3-4 days and reapply if new larvae found"
      ],
      preventive_measures: [
        "Scout fields from germination — look for eggs and young larvae weekly",
        "Apply Beauveria bassiana (biological control) as preventive spray",
        "Use sand+ash mixture in whorl as early low-cost deterrent",
        "Intercrop maize with legumes (soybean) to confuse pest",
        "Early planting reduces vulnerability during critical whorl stage"
      ],
      local_treatment: "Emamectin benzoate 1.9EC (0.4L/ha) — most effective. Cost: ~400-600 ETB/ha. Apply directly to whorl.",
      source: "MoA Ethiopia FAW Emergency Response Program / FAO"
    },
    {
      name: "Common Rust", severity: "Medium", confidence: 78,
      keywords: ["orange","red","rust","pustule","both sides","powder","circle","round spots"],
      diagnosis: "Puccinia sorghi causing circular orange-red pustules on both surfaces of maize leaves. Less severe than NLB but can reduce photosynthesis and yield by 15-30% in severe cases.",
      immediate_actions: [
        "Apply Neem extract spray (5% concentration) as organic option",
        "For severe cases: Propiconazole 250EC at 0.5L/ha",
        "Remove heavily infected leaves at base of plant"
      ],
      preventive_measures: [
        "Plant rust-tolerant maize varieties from MARC",
        "Crop rotation every 2 years",
        "Proper spacing for air circulation"
      ],
      local_treatment: "Neem spray for mild cases. Propiconazole for severe infection.",
      source: "Melkassa ARC Maize Research"
    },
    {
      name: "Maize Streak Virus (MSV)", severity: "High", confidence: 80,
      keywords: ["streak","yellow stripe","narrow yellow","pale stripe","mosaic","virus"],
      diagnosis: "Maize Streak Virus transmitted by leafhoppers. Narrow yellow-white streaks run parallel along the leaf veins. Young plants are most severely affected. No chemical cure.",
      immediate_actions: [
        "Remove and destroy severely infected plants",
        "Control leafhopper vectors with Dimethoate 40EC (1L/ha)",
        "Do not use infected plants as seed or feed"
      ],
      preventive_measures: [
        "Plant MSV-resistant varieties: BHQPY-545, Pioneer hybrids",
        "Plant early to reduce leafhopper vector pressure",
        "Control weeds around field that harbour leafhoppers",
        "Avoid planting near sorghum fields (alternate host)"
      ],
      local_treatment: "No cure. Control leafhoppers + plant resistant varieties next season.",
      source: "MARC / CIMMYT East Africa"
    },
    {
      name: "Aflatoxin (Aspergillus ear rot)", severity: "Very High", confidence: 85,
      keywords: ["grain","mold","pink","green","fuzzy","ear","rotten","storage","discolor"],
      diagnosis: "Aspergillus flavus producing aflatoxin on maize grain. Green-yellow fuzzy mold on ears and grain. Aflatoxin is HIGHLY toxic to humans and animals — do not consume or feed affected grain. Common in lowland areas during drought stress.",
      immediate_actions: [
        "IMMEDIATELY separate and destroy visibly moldy grain — burn or bury deep",
        "Do NOT sell or eat suspected grain without testing",
        "Dry remaining grain below 12% moisture immediately",
        "Test grain using aflatoxin test strips before selling"
      ],
      preventive_measures: [
        "Harvest at physiological maturity (35-40% moisture) — do not leave in field",
        "Dry grain to below 12% moisture before storage",
        "Store in clean, dry, ventilated structures — use hermetic bags",
        "Apply Aflasafe biocontrol product at flowering stage to displace toxic strains",
        "Control stem borers which create entry points for the fungus"
      ],
      local_treatment: "Prevention ONLY — there is no treatment for aflatoxin-contaminated grain. Dry grain quickly.",
      source: "IITA Aflasafe Program / MARC Ethiopia"
    }
  ],
  "coffee": [
    {
      name: "Coffee Berry Disease (CBD)", severity: "Very High", confidence: 90,
      keywords: ["dark","lesion","green","berry","black","brown","spot","berry rot","mummy"],
      diagnosis: "Colletotrichum kahawae — the most economically important coffee disease in Ethiopia. Dark brown-black lesions on green berries causing them to mummify. Can destroy 50-80% of coffee yield in wet years. Ethiopian coffeelands are origin center of this disease.",
      immediate_actions: [
        "Apply Mancozeb 80WP (2.5kg/ha) OR Copper oxychloride (3kg/ha) IMMEDIATELY",
        "Spray begins at small-berry stage (June) regardless of whether CBD is visible",
        "Repeat spray every 14 days during the rainy season",
        "Remove and bury mummified berries (do not compost)"
      ],
      preventive_measures: [
        "Spray preventively from June through October every 14 days",
        "Maintain shade cover — avoid over-exposure to sun which stresses plants",
        "Prune coffee to allow air circulation through canopy",
        "Plant CBD-resistant varieties from Jimma ARC (Varieties 74110, 74112, 74158)",
        "Remove all crop residue and mummies after harvest"
      ],
      local_treatment: "Mancozeb 80WP (2.5kg/ha) every 14 days from June-October. Cost: ~500-800 ETB/ha per spray.",
      source: "Jimma University College of Agriculture / Jimma ARC"
    },
    {
      name: "Coffee Wilt Disease (CWD / Gibberella)", severity: "Very High", confidence: 88,
      keywords: ["wilt","sudden","brown","vascular","death","dry","branch","die","twig"],
      diagnosis: "Gibberella xylarioides (Fusarium xylarioides) — second most devastating coffee disease in Ethiopia. Causes sudden wilting and death of branches or entire trees. Vascular tissue turns brown when cut. No effective chemical treatment.",
      immediate_actions: [
        "Immediately uproot and BURN entire infected tree — do not compost",
        "Sterilize all cutting tools with bleach (10%) between each tree",
        "Do not replant coffee in the same hole for minimum 3 years",
        "Mark and record affected tree locations for monitoring"
      ],
      preventive_measures: [
        "Plant resistant varieties from Jimma ARC — varieties 74110, 74112",
        "Do not replant in areas where CWD occurred for 3+ years",
        "Maintain proper shade management and soil health",
        "Report any CWD outbreak to Jimma ARC immediately"
      ],
      local_treatment: "NO chemical treatment effective. Uprooting and burning is the ONLY option.",
      source: "Jimma University / EIAR CWD Management Program"
    },
    {
      name: "Coffee Leaf Rust (CLR)", severity: "High", confidence: 85,
      keywords: ["orange","rust","leaf","powder","yellow","spore","rust patch","underside"],
      diagnosis: "Hemileia vastatrix — coffee leaf rust causing orange-yellow powdery patches on the underside of coffee leaves. Causes premature leaf drop, reducing photosynthesis and yield. Spreading in Ethiopia due to climate change.",
      immediate_actions: [
        "Apply Copper oxychloride (3kg/ha) or Mancozeb (2.5kg/ha) immediately",
        "Remove and burn heavily infected leaves",
        "Reduce shade to improve air circulation",
        "Spray underside of leaves thoroughly — rust spores are there"
      ],
      preventive_measures: [
        "Preventive copper sprays from April every 21 days",
        "Plant CLR-tolerant varieties from Jimma ARC",
        "Maintain balanced shade — neither too dense nor too open",
        "Good nutrition (especially potassium) improves plant resistance"
      ],
      local_treatment: "Copper oxychloride (3kg/ha). Cost: ~300-500 ETB/ha per spray.",
      source: "Jimma University Coffee Research Program"
    },
    {
      name: "Coffee Berry Borer (CBB)", severity: "High", confidence: 82,
      keywords: ["hole","berry","bore","insect","tiny hole","black","entry","pest","beetle"],
      diagnosis: "Hypothenemus hampei — tiny beetle boring tiny holes in coffee berries. Female beetle bores into berry to lay eggs. Larvae feed inside reducing bean quality to zero. Detected by small round entry hole at berry tip.",
      immediate_actions: [
        "Collect and destroy all fallen and overripe berries immediately",
        "Apply Beauveria bassiana (biological control) spray on berries",
        "For severe cases: Chlorpyrifos 48EC (2L/ha) but observe pre-harvest interval"
      ],
      preventive_measures: [
        "Harvest all ripe berries promptly — never leave ripe berries on tree",
        "Collect and destroy all fallen berries from ground weekly",
        "Apply Beauveria bassiana preventively during berry development",
        "Use berry traps (methanol+ethanol) to monitor population"
      ],
      local_treatment: "Beauveria bassiana biological spray + prompt complete harvesting. Chemical: Chlorpyrifos 48EC.",
      source: "Jimma ARC / CABI CBB Management Guide"
    }
  ],
  "potato": [
    {
      name: "Late Blight (Phytophthora infestans)", severity: "Very High", confidence: 90,
      keywords: ["dark","water","lesion","white","mold","leaf","wet","brown","soft","rot"],
      diagnosis: "Phytophthora infestans — the most destructive potato disease worldwide and in Ethiopia. Water-soaked dark lesions on leaves with white fuzzy mold on underside in wet weather. Can destroy entire crop within 7-10 days under cool, wet conditions (15-18°C). EMERGENCY action needed.",
      immediate_actions: [
        "Apply Metalaxyl+Mancozeb (Ridomil Gold MZ) at 2.5kg/ha IMMEDIATELY",
        "Alternatively use Cymoxanil+Mancozeb (Curzate) at 2kg/ha",
        "Spray every 5-7 days during wet weather — do not skip sprays",
        "Remove and bury (not compost) all infected plant material",
        "Avoid working in the field when leaves are wet — you spread the disease"
      ],
      preventive_measures: [
        "Plant resistant varieties: Gudene, Belete, Bubu, Jalenie (all HARC-released)",
        "Use certified disease-free seed tubers from HARC or MoA",
        "Start preventive Mancozeb sprays at planting — don't wait for symptoms",
        "Plant on ridges/raised beds to improve drainage",
        "3-year crop rotation — never plant potato after potato or tomato"
      ],
      local_treatment: "Ridomil Gold MZ (Metalaxyl+Mancozeb) at 2.5kg/ha every 7 days. Cost: ~600-900 ETB/ha per spray. This is the most critical disease requiring emergency treatment.",
      source: "Holeta Agricultural Research Center (HARC) / CIP Ethiopia"
    },
    {
      name: "Bacterial Wilt (Ralstonia solanacearum)", severity: "Very High", confidence: 88,
      keywords: ["wilt","brown","vascular","ooze","cut","stem","sudden","bacterial","thread"],
      diagnosis: "Ralstonia solanacearum causing rapid wilting and death. When infected stem is cut and placed in water, white bacterial strands ooze from vascular tissue. Survives in soil for 10+ years. No chemical treatment.",
      immediate_actions: [
        "Uproot infected plants entirely including all tubers",
        "Bury infected material deep (50cm+) — do NOT compost",
        "Do NOT plant potatoes or tomatoes in that location for 3+ years",
        "Sterilize all tools with bleach (10%) after working in infected area",
        "Do not irrigate from water sources near infected fields"
      ],
      preventive_measures: [
        "Use only certified seed tubers from MoA/HARC",
        "3-year rotation with cereals (teff, wheat, barley) — not tomato or pepper",
        "Improve field drainage — bacterial wilt is worse in waterlogged soils",
        "Remove volunteer potato plants between seasons",
        "Avoid soil movement from infected to clean fields"
      ],
      local_treatment: "NO chemical treatment. Prevention through certified seed and rotation is the ONLY strategy.",
      source: "Holeta ARC / CIP (International Potato Center)"
    },
    {
      name: "Early Blight (Alternaria solani)", severity: "Medium", confidence: 80,
      keywords: ["target","ring","brown","spots","older leaf","concentric","target spot","dry"],
      diagnosis: "Alternaria solani causing brown lesions with concentric target-ring pattern on older leaves. Less devastating than late blight but can cause 20-30% yield loss. Common during alternating wet/dry weather.",
      immediate_actions: [
        "Apply Mancozeb 80WP (2kg/ha) or Chlorothalonil (1.5L/ha)",
        "Remove heavily infected lower leaves before spraying",
        "Ensure adequate potassium fertilizer — deficiency increases susceptibility"
      ],
      preventive_measures: [
        "Balanced fertilization especially potassium (KCl at 60kg/ha)",
        "Avoid excessive nitrogen which promotes lush growth that is more susceptible",
        "Destroy crop residue after harvest",
        "Crop rotation with cereals"
      ],
      local_treatment: "Mancozeb 80WP (2kg/ha). Focus on potassium nutrition for resistance.",
      source: "Holeta ARC Potato Research Program"
    },
    {
      name: "Potato Virus Y (PVY) and Mosaic", severity: "Medium", confidence: 75,
      keywords: ["mosaic","mottled","crinkle","mosaic pattern","curl","distort","stunted","yellow mottled"],
      diagnosis: "Potato Virus Y (PVY) or Potato Leaf Roll Virus (PLRV) spread by aphids. Symptoms include mosaic pattern, leaf crinkle, distortion and stunting. Severely reduces tuber yield and quality.",
      immediate_actions: [
        "Remove and destroy virus-infected plants",
        "Control aphid vectors with Imidacloprid (0.25L/ha)",
        "Do NOT use tubers from infected plants as seed"
      ],
      preventive_measures: [
        "Use certified virus-free seed tubers only",
        "Control aphids from crop establishment with systemic insecticide",
        "Remove weed hosts around the field",
        "Replace planting material with certified seed every 2-3 seasons"
      ],
      local_treatment: "No cure for virus. Control aphid vectors + use certified seed.",
      source: "CIP / HARC Seed Potato Program"
    }
  ],
  "barley": [
    {
      name: "Scald (Rhynchosporium secalis)", severity: "High", confidence: 85,
      keywords: ["water","blotch","tan","brown","leaf","wet","oval","irregular","pale"],
      diagnosis: "Rhynchosporium secalis causing water-soaked oval blotches that turn tan-brown on barley leaves. Very common in Ethiopian highland barley areas during cool, wet weather. Can cause 40-50% yield loss in susceptible varieties.",
      immediate_actions: [
        "Apply Propiconazole 250EC (0.5L/ha) at FIRST appearance of symptoms",
        "Alternatively use Mancozeb 80WP (2kg/ha)",
        "Repeat spray after 14 days if rain continues",
        "Improve field drainage if waterlogged"
      ],
      preventive_measures: [
        "Plant scald-resistant varieties from Adet ARC: IBON 174/03, Traveller",
        "Seed treatment with Thiram 75WS (3g/kg seed) before planting",
        "Crop rotation with non-grass crops (legumes, root crops)",
        "Avoid excessive nitrogen fertilizer",
        "Destroy barley stubble after harvest"
      ],
      local_treatment: "Propiconazole 250EC (0.5L/ha). Cost: ~350 ETB/ha. Resistant varieties from Adet ARC are most effective.",
      source: "Adet Agricultural Research Center (ARC) / ICARDA"
    },
    {
      name: "Net Blotch (Pyrenophora teres)", severity: "High", confidence: 83,
      keywords: ["net","pattern","brown","lesion","leaf","network","net pattern","stripe net"],
      diagnosis: "Pyrenophora teres causing distinctive net-like brown lesion pattern on barley leaves. One of the most common barley diseases in highland Ethiopia. Reduces yield by 10-40%.",
      immediate_actions: [
        "Apply Rescue 430SC (Propiconazole+Tebuconazole) at 0.5L/ha",
        "Alternatively Mancozeb 80WP (2kg/ha)",
        "Remove and burn heavily infected plant material"
      ],
      preventive_measures: [
        "Use resistant varieties from Adet ARC",
        "Treat seed with Carboxin+Thiram (Vitavax 200) before planting",
        "Practice crop rotation with legumes",
        "Destroy infected stubble — net blotch overwinters on residue"
      ],
      local_treatment: "Rescue 430SC (0.5L/ha) is most effective. Available at Adet ARC.",
      source: "Adet ARC Barley Research Program / ICARDA"
    },
    {
      name: "Covered Smut (Ustilago hordei)", severity: "Medium", confidence: 80,
      keywords: ["smut","black","covered","grain","replace","powder","membrane","covered"],
      diagnosis: "Ustilago hordei causing grain heads to be replaced by masses of black spores enclosed in a membrane. Seed-borne disease. Severely reduces harvest and contaminates grain.",
      immediate_actions: [
        "Remove infected heads immediately before membrane breaks",
        "Do NOT use grain from infected field as seed next season",
        "Report to extension agent for certified seed replacement"
      ],
      preventive_measures: [
        "Seed treatment with Carboxin (Vitavax) eliminates smut completely",
        "Use certified smut-free seed from Adet ARC",
        "Hot water seed treatment (50°C for 10 minutes) as low-cost alternative"
      ],
      local_treatment: "Vitavax seed treatment (Carboxin 2g/kg seed) completely prevents covered smut.",
      source: "Adet ARC / ICARDA Barley Disease Management"
    },
    {
      name: "Barley Stem Rust", severity: "High", confidence: 78,
      keywords: ["stem","rust","brick","red","stalk","brown","stem lesion","pustule stem"],
      diagnosis: "Puccinia graminis f.sp. hordei causing brick-red oval pustules on barley stems and leaf sheaths. Can severely weaken stems causing lodging (falling over) and yield losses of 20-40%.",
      immediate_actions: [
        "Apply Propiconazole 250EC (0.5L/ha) immediately",
        "Support lodged plants if possible with bamboo stakes",
        "Harvest as soon as grain reaches physiological maturity"
      ],
      preventive_measures: [
        "Plant resistant varieties from Adet ARC",
        "Balanced fertilization — avoid excessive nitrogen",
        "Early planting to escape peak rust season"
      ],
      local_treatment: "Propiconazole 250EC (0.5L/ha). Harvest early to minimize lodging losses.",
      source: "Adet ARC / EIAR Highland Cereals Program"
    }
  ],
  "sorghum": [
    {
      name: "Anthracnose (Colletotrichum)", severity: "High", confidence: 85,
      keywords: ["red","orange","lesion","stalk","leaf","wet","spot","reddish","glume","rot"],
      diagnosis: "Colletotrichum sublineolum causing red-orange lesions on sorghum leaves, stalks, and grain heads. Very common in humid highland areas. Can cause stalk rotting and significant yield losses.",
      immediate_actions: [
        "Apply Propiconazole 250EC (0.5L/ha) at first sign of lesions",
        "Remove and destroy infected plant debris",
        "Improve field drainage if waterlogged"
      ],
      preventive_measures: [
        "Plant resistant varieties from Melkassa ARC or Jimma ARC: Gambella-1107, Teshale",
        "Crop rotation with legumes (haricot bean, soybean)",
        "Destroy sorghum residue after harvest — anthracnose survives on debris",
        "Avoid dense planting — maintain 60-70cm between rows"
      ],
      local_treatment: "Propiconazole 250EC (0.5L/ha). Resistant varieties from Melkassa ARC are long-term solution.",
      source: "Melkassa ARC / Jimma ARC Sorghum Research"
    },
    {
      name: "Grain Mold Complex", severity: "Medium", confidence: 80,
      keywords: ["pink","grey","black","grain","head","discolor","mold","fluffy","head rot"],
      diagnosis: "Multiple fungi (Fusarium, Curvularia, Alternaria) causing pink, grey, or black mold on sorghum grain heads during grain fill. Worse during wet years. Reduces grain quality and market value.",
      immediate_actions: [
        "Adjust harvest timing — harvest as soon as grain reaches dough stage",
        "Do not leave sorghum in field past maturity in rainy weather",
        "Dry harvested grain quickly to below 12% moisture"
      ],
      preventive_measures: [
        "Plant early to ensure grain fill occurs before heavy September rains",
        "Plant mold-resistant varieties with tight glumes",
        "Quick-harvest and dry grain properly",
        "Crop rotation improves soil health and reduces pathogen load"
      ],
      local_treatment: "Timing management — early planting + quick harvest. No effective chemical post-infection.",
      source: "Melkassa ARC Sorghum Program"
    },
    {
      name: "Head Smut (Sporisorium reilianum)", severity: "High", confidence: 82,
      keywords: ["smut","head","black","replace","powder","complete head","soot"],
      diagnosis: "Entire sorghum head or panicle replaced by black smut mass. Seed-borne and soil-borne. Severely affects yield.",
      immediate_actions: [
        "Remove smutted heads BEFORE spores are released — bag and burn",
        "Do NOT thrash infected heads — spores will contaminate soil",
        "Do not use grain from infected field as seed"
      ],
      preventive_measures: [
        "Seed treatment with Thiram 75WS (3g/kg) or Carboxin+Thiram",
        "Crop rotation — smut can survive in soil for several years",
        "Use certified seed from Melkassa ARC"
      ],
      local_treatment: "Thiram seed treatment (3g/kg) prevents head smut. Rotation for soil-borne strains.",
      source: "Melkassa ARC / EIAR Sorghum Disease Management"
    },
    {
      name: "Sorghum Shoot Fly (Atherigona soccata)", severity: "High", confidence: 80,
      keywords: ["dead heart","shoot","center","dry","tip","dead","whorl","seedling"],
      diagnosis: "Atherigona soccata maggots bore into sorghum shoots causing characteristic dead heart — the central shoot dies while outer leaves remain green. Worst during early seedling stage.",
      immediate_actions: [
        "Remove and destroy dead-heart tillers",
        "Apply Carbofuran 3G (10-15kg/ha) in soil at planting in high-risk areas",
        "For standing crop: Dimethoate 40EC (1L/ha) spray if severe"
      ],
      preventive_measures: [
        "Plant early — timing planting to avoid peak fly emergence (June-July)",
        "Use higher seeding rates to compensate for losses",
        "Plant tolerant varieties from Melkassa ARC",
        "Intercrop sorghum with cowpea to repel shoot fly"
      ],
      local_treatment: "Early planting is most effective. Dimethoate 40EC for standing crop treatment.",
      source: "Melkassa ARC / ICRISAT Sorghum Protection"
    },
    {
      name: "Striga (Witchweed)", severity: "Very High", confidence: 88,
      keywords: ["striga","weed","parasitic","yellow","small flowers","purple flower","soil","nutrient rob"],
      diagnosis: "Striga hermonthica — parasitic weed that attaches to sorghum roots underground, robbing water and nutrients. Purple/yellow small flowers emerge from soil. Can destroy 50-100% of yield. Seed persists in soil 20+ years.",
      immediate_actions: [
        "Hand-pull all visible Striga plants BEFORE they flower and set seed",
        "Use Imazapyr-coated seed (IR technology) for immediate suppression",
        "Apply nitrogen fertilizer to boost sorghum competitiveness"
      ],
      preventive_measures: [
        "Intercrop with Desmodium (a legume that exudes anti-Striga chemicals)",
        "Use Striga-resistant varieties from ICRISAT: SRN-39, Gambella 1107",
        "Avoid spreading soil from Striga-infested areas",
        "Push-pull intercropping system (sorghum + Desmodium + Napier grass)"
      ],
      local_treatment: "Imazapyr-coated seed + Desmodium intercrop. Contact Melkassa ARC for Striga-resistant seed.",
      source: "ICRISAT / Melkassa ARC Striga Management Program"
    }
  ],
  "noug": [
    {
      name: "Alternaria Leaf Spot", severity: "High", confidence: 82,
      keywords: ["spot","brown","leaf","circular","rings","concentric","blight","alternaria","wet"],
      diagnosis: "Alternaria alternata / A. spp. — the most common and damaging Noug disease in Ethiopia. Appears as brown circular spots with concentric rings on leaves. Most severe during wet seasons (Aug-Oct), particularly devastating for early-maturing accessions. Documented since Dagnachew Yirgou (1964) Plant Disease Reporter.",
      immediate_actions: [
        "Remove and burn infected leaves and debris from the field immediately",
        "Apply Mancozeb 80% WP at 2-3 g/L water, repeat every 10-14 days",
        "If available, use Carbendazim + Mancozeb (0.2%) — proven effective per Holetta ARC trials",
        "Avoid overhead irrigation; water at soil level to reduce leaf wetness",
        "Improve field drainage if waterlogged"
      ],
      preventive_measures: [
        "Plant later-maturing 'abat noug' varieties (more disease-escape than 'mesno' types)",
        "Use 3-year crop rotation away from oilseed crops",
        "Seed treatment with thiram or carbendazim before planting",
        "Maintain proper plant spacing (5-10 kg seed/ha) for air circulation",
        "Source clean seed from Holetta Agricultural Research Center (HARC)"
      ],
      local_treatment: "Mancozeb 80% WP — 2 g/L water, spray every 10-14 days starting at flowering. Use Carbendazim + Mancozeb combo for severe outbreaks.",
      source: "Dagnachew Yirgou (1964) Plant Disease Reporter 48:672; EIAR Oilseed Strategy 2016-2023; Holetta ARC research"
    },
    {
      name: "Cercospora Leaf Spot", severity: "Medium", confidence: 75,
      keywords: ["spot","leaf","cercospora","angular","grey","small","yellow","foliar"],
      diagnosis: "Cercospora guizoticola — small angular leaf spots, often with grey centers and yellow halos. Documented in Ethiopian Noug fields by EIAR researchers. Reduces photosynthetic area and seed yield.",
      immediate_actions: [
        "Remove severely infected leaves from the field",
        "Apply Mancozeb 80% WP (2 g/L) at first sign of spots",
        "Repeat sprays every 14 days during disease pressure",
        "Improve drainage to reduce humidity around plants"
      ],
      preventive_measures: [
        "Use disease-free seed from certified EIAR sources",
        "Practice crop rotation with cereals (avoid oilseed succession)",
        "Remove crop debris after harvest",
        "Wider plant spacing for better air flow",
        "Balanced NPK fertilization avoids excessive nitrogen"
      ],
      local_treatment: "Mancozeb 2 g/L every 14 days. Field sanitation after harvest essential.",
      source: "EIAR Oil Crops Research 2009; Holetta ARC field trials"
    },
    {
      name: "Stem & Leaf Blight", severity: "Very High", confidence: 80,
      keywords: ["blight","stem","wilting","collapse","dark","lesion","early","wet","devastating"],
      diagnosis: "Alternaria spp. stem and leaf blight — devastating disease for early-maturing 'mesno noug' accessions during wet seasons (Yitbarek & Truwork 1992 Holetta ARC studies). Dark stem cankers and rapid plant collapse. Can destroy whole fields in severe outbreaks.",
      immediate_actions: [
        "Remove and burn affected plants immediately — do NOT leave in field",
        "Apply systemic fungicide (Tebuconazole or Difenoconazole) at 1 ml/L",
        "Isolate the affected area from healthy plants",
        "Stop irrigation in affected sections",
        "Contact Holetta ARC for emergency variety advice"
      ],
      preventive_measures: [
        "Switch to mid- or late-maturing 'abat noug' varieties for next season",
        "Plant at proper time — avoid waterlogged conditions",
        "3-year rotation with cereal crops",
        "Seed treatment with thiram before sowing",
        "Field drainage critical before rainy season"
      ],
      local_treatment: "Tebuconazole 25% EW at 1 ml/L. For prevention, switch to 'abat noug' variety. Holetta ARC has resistant accessions.",
      source: "Yitbarek & Truwork (1992) Holetta ARC; EIAR Oilseed Research Review 2009"
    },
    {
      name: "Root Rot (Macrophomina)", severity: "High", confidence: 70,
      keywords: ["root","rot","wilting","collapse","yellow","drought","sclerotia","stress"],
      diagnosis: "Macrophomina phaseolina — root and stem rot causing sudden wilting and plant collapse. Black microsclerotia visible in roots when cut. Often worse in drought-stressed plants.",
      immediate_actions: [
        "Remove affected plants with roots intact and dispose far from field",
        "Apply Trichoderma harzianum biocontrol to surrounding soil",
        "Improve irrigation to reduce drought stress on remaining plants",
        "Mulch around healthy plants to retain soil moisture"
      ],
      preventive_measures: [
        "Use Trichoderma-coated seed at planting",
        "Avoid drought stress through timely irrigation",
        "Long crop rotation (4+ years) — pathogen survives in soil",
        "Add organic matter to improve soil microbiome",
        "Choose well-drained but moisture-retentive sites"
      ],
      local_treatment: "Trichoderma harzianum soil treatment + organic compost. Maintain consistent soil moisture.",
      source: "PROTA Ethiopian Plant Resources database; Holetta ARC field observations"
    }
  ],
  "tomato": [
    {
      name: "Tuta absoluta (Tomato Leafminer)", severity: "Very High", confidence: 92,
      keywords: ["mines","tunnels","leaf","mining","tuta","leafminer","frass","holes","stems","fruits","invasive"],
      diagnosis: "Tuta absoluta — INVASIVE pest in Ethiopia since 2012, can cause 80-100% yield loss if unmanaged. Look for irregular mines/tunnels in leaves with blackish frass (droppings). Larvae also bore into stems and fruits. EIAR Melkassa 2024 Technical Manual is the authoritative Ethiopian reference.",
      immediate_actions: [
        "Install pheromone traps immediately (1 trap per 500 m² minimum) for monitoring AND mass trapping",
        "Apply Spinosad (Tracer 480 SC) at 150 ml/ha — most effective on larvae",
        "Earthing-up plants 2-3 times reduces soil-emerging adult moths",
        "Remove and destroy heavily infested leaves and fruits",
        "Spray neem extract (5%) between spinosad applications to rotate modes of action"
      ],
      preventive_measures: [
        "Use Tuta-resistant varieties when available from EIAR Melkassa",
        "Install yellow sticky traps for early adult detection",
        "Insect-proof netting (50-mesh) for nursery seedlings",
        "Crop rotation — avoid Solanaceae (tomato, potato, eggplant) for 2 years",
        "Release Trichogramma achaeae parasitoids if available (biocontrol)",
        "Field sanitation — destroy crop residues after harvest"
      ],
      local_treatment: "Spinosad 150 ml/ha + pheromone mass trapping + earthing-up. This integrated approach reduced larvae 83%+ per Jabamo et al. 2023 Melkassa trial.",
      source: "EIAR Melkassa 2024 Technical Manual (Yitayih Gedefaw et al.); Jabamo, Ayalew, Goftishu, Wakgari (2023) Crop Protection"
    },
    {
      name: "Late Blight (Phytophthora infestans)", severity: "Very High", confidence: 88,
      keywords: ["late","blight","water","soaked","lesion","white","mold","underside","wet","brown","dark"],
      diagnosis: "Phytophthora infestans — water-soaked dark brown to black lesions on leaves and stems with white fluffy mold underneath the leaves in humid conditions. Documented to cause 63.7-100% yield loss in Arbaminch areas (Hawassa ARC 2017). Spreads rapidly in cool, wet weather.",
      immediate_actions: [
        "Apply Ridomil MZ 68% WP (metalaxyl + mancozeb) at 2.5 g/L immediately",
        "Remove and burn infected plant material — do not compost",
        "Reduce overhead irrigation; water at soil level only",
        "Improve air circulation by pruning lower leaves",
        "Apply preventive copper sprays (Copper Plus WP) to nearby healthy plants"
      ],
      preventive_measures: [
        "Use resistant varieties: Melkashola, Melkasalsa, Bisholla (EIAR releases)",
        "Stake plants and prune for air circulation",
        "Drip irrigation instead of overhead",
        "Crop rotation away from potatoes and other Solanaceae",
        "Avoid planting in low/humid fields",
        "Preventive Mancozeb sprays during cool wet weather"
      ],
      local_treatment: "Ridomil MZ Gold (metalaxyl + mancozeb) at 2.5 g/L. Switch to resistant variety next season: Melkashola or Bisholla.",
      source: "Hawassa ARC / SARI (2017) Late Blight integrated management in Arbaminch; EIAR Melkassa 2024 Manual"
    },
    {
      name: "Early Blight (Alternaria solani)", severity: "High", confidence: 82,
      keywords: ["early","blight","dark","concentric","rings","leaf","spot","brown","lesion","alternaria","lower"],
      diagnosis: "Alternaria solani — dark concentric ring lesions on lower leaves first, progressing upward. Stem cankers also possible. One of the most common Ethiopian tomato diseases.",
      immediate_actions: [
        "Remove and destroy infected lower leaves immediately",
        "Apply Mancozeb 80% WP at 2 g/L water",
        "Consider Pseudomonas fluorescens Pfsa31 biocontrol (proven equivalent to chemicals per Berihun et al. 2026 North Wollo)",
        "Improve mulching to reduce soil-splash from rain",
        "Stop overhead watering"
      ],
      preventive_measures: [
        "Use Pfsa31 Pseudomonas fluorescens isolate for biocontrol (indigenous Ethiopian)",
        "Mulch around base of plants to prevent rain splash",
        "Adequate plant spacing for air flow",
        "Balanced NPK fertilization — avoid nitrogen excess",
        "3-year rotation away from Solanaceae",
        "Stake plants to keep foliage off the ground"
      ],
      local_treatment: "Pseudomonas fluorescens Pfsa31 isolate (eco-friendly, matches chemical efficacy) OR Mancozeb 2 g/L every 10 days.",
      source: "Berihun et al. (2026) Woldia University PLoS ONE; EIAR Melkassa 2024 Manual"
    },
    {
      name: "Bacterial Wilt (Ralstonia solanacearum)", severity: "Very High", confidence: 85,
      keywords: ["bacterial","wilt","sudden","wilting","vascular","brown","stem","ralstonia","no","recovery","collapse"],
      diagnosis: "Ralstonia solanacearum — causes sudden wilting in apparently healthy plants without yellowing. Cut stem shows brown vascular discoloration and milky bacterial ooze when placed in clear water. No cure once established — focus on containment.",
      immediate_actions: [
        "Immediately uproot and burn infected plants (with surrounding soil)",
        "Disinfect tools with 10% bleach between plants",
        "Stop watering the affected area to slow spread",
        "Mark contaminated area — avoid planting Solanaceae there for 3+ years",
        "Inform neighbors as disease spreads via water and soil"
      ],
      preventive_measures: [
        "Use ONLY certified disease-free seedlings",
        "3-year minimum rotation away from Solanaceae (tomato, potato, eggplant, pepper)",
        "Resistant rootstocks for grafted transplants if available",
        "Raised beds for better drainage",
        "Soil solarization in severe-history fields",
        "Avoid overhead irrigation"
      ],
      local_treatment: "NO CURE. Containment only: remove + burn infected plants, sterilize tools, 3-year rotation, raised beds.",
      source: "EIAR Melkassa 2024 Technical Manual; Lemma Desalegn (2002) EIAR Research Report 43"
    },
    {
      name: "Powdery Mildew", severity: "Medium", confidence: 75,
      keywords: ["powdery","mildew","white","coating","leaf","surface","dust","flour","fungal"],
      diagnosis: "White powdery fungal growth on upper leaf surfaces. Severe infections cause leaf yellowing and reduced photosynthesis. More common in dry conditions with high humidity at night.",
      immediate_actions: [
        "Apply sulfur-based fungicide (wettable sulfur 0.3%) early in the morning",
        "Or Copper Plus WP at recommended rate",
        "Remove and destroy heavily infected leaves",
        "Improve air circulation by pruning"
      ],
      preventive_measures: [
        "Wider plant spacing for air flow",
        "Avoid overhead irrigation late in day",
        "Choose resistant varieties when available",
        "Apply preventive sulfur sprays during humid periods",
        "Balanced fertilization"
      ],
      local_treatment: "Wettable sulfur 0.3% spray in early morning. Improve plant spacing for air flow.",
      source: "EIAR Melkassa 2024 Technical Manual; Lema & Mekonnen (2026) Hawasa ARC"
    }
  ],
  "onion": [
    {
      name: "Purple Blotch (Alternaria porri)", severity: "Very High", confidence: 90,
      keywords: ["purple","blotch","brown","leaf","lesion","concentric","ring","alternaria","spot","oval"],
      diagnosis: "Alternaria porri — the MOST IMPORTANT onion disease in Ethiopia, reaching 100% prevalence in some Fogera areas. Small whitish sunken lesions become purple-brown elliptical blotches with concentric rings on leaves and scapes. Disease favors humidity >75% RH and temperatures 20-30°C. Severity peaks at bulbing/maturity stage.",
      immediate_actions: [
        "Apply Tebuconazole (Natura 250 EW) at recommended rate immediately",
        "Or Difenoconazole (Diprocon 33 EC) as alternative",
        "Plan 2-3 sprays at 10-14 day intervals starting at first symptom",
        "Remove and destroy heavily infected leaves",
        "Stop overhead irrigation; switch to drip if possible"
      ],
      preventive_measures: [
        "Early transplanting (early December) — proven to reduce disease pressure",
        "Plant after cereals (avoid Allium succession)",
        "Frequent land plowing (more than 4 times) before planting",
        "Smaller field sizes (≤0.25 ha) for better management",
        "Wider plant spacing for air circulation",
        "Balanced fertilization — avoid excessive nitrogen"
      ],
      local_treatment: "2-3 sprays of Tebuconazole (Natura 250 EW) or Difenoconazole (Diprocon 33 EC). Combine with early transplanting and frequent plowing per Genet & Yalew 2022 Fogera trial.",
      source: "Genet & Yalew (2022) Bahir Dar / Fogera Plains; Arba Minch ARC integrated trials"
    },
    {
      name: "Downy Mildew (Peronospora destructor)", severity: "Very High", confidence: 85,
      keywords: ["downy","mildew","pale","yellow","patch","grey","purple","velvet","mold","peronospora","tip","dieback"],
      diagnosis: "Peronospora destructor — pale yellow patches with grey-purple velvety mold growth, often starting at leaf tips. Can cause up to 80% yield loss. Favors cool, humid conditions especially in highland onion areas.",
      immediate_actions: [
        "Apply Mancozeb 80% WP at 2.5 g/L immediately",
        "Or Metalaxyl + Mancozeb combination (Ridomil MZ) for systemic control",
        "Remove infected leaves carefully (don't spread spores)",
        "Increase plant spacing if possible by selective thinning",
        "Reduce irrigation frequency"
      ],
      preventive_measures: [
        "Use certified disease-free sets/seedlings",
        "Choose well-drained fields with good air circulation",
        "Drip irrigation instead of overhead",
        "Crop rotation (3+ years away from Allium)",
        "Wider spacing for ventilation",
        "Preventive Mancozeb sprays during cool humid weather"
      ],
      local_treatment: "Mancozeb 2.5 g/L spray every 7-10 days during cool humid weather. Avoid overhead irrigation.",
      source: "Arba Minch University SARI trials; EIAR onion research"
    },
    {
      name: "Onion Thrips (Thrips tabaci)", severity: "High", confidence: 88,
      keywords: ["thrips","silver","streaks","lines","feeding","leaf","damage","white","stippling","virus","vector"],
      diagnosis: "Thrips tabaci — the MOST COMMON onion pest in Ethiopia. Causes silver streaks and stippling on leaves from feeding damage. Also vectors viral diseases. Economic threshold: 5-10 thrips per plant — intervene above this.",
      immediate_actions: [
        "Spray neem extract (5%) — effective against thrips per EIAR trials",
        "Or apply selective insecticide (Spinosad or Imidacloprid) if threshold exceeded",
        "Avoid broad-spectrum insecticides that kill natural predators",
        "Check plants weekly to monitor threshold (5-10/plant)",
        "Use blue sticky traps to monitor populations"
      ],
      preventive_measures: [
        "Neem extract weekly during dry weather (preventive)",
        "Datura (jimson weed) extract as botanical control",
        "Beauveria bassiana biopesticide application",
        "Avoid water stress — well-watered plants tolerate thrips better",
        "Mulching with reflective material deters thrips",
        "Rotate insecticide modes of action to avoid resistance"
      ],
      local_treatment: "Neem extract 5% spray weekly when threshold (5-10 thrips/plant) exceeded. Rotate with spinosad if needed.",
      source: "EIAR Onion Thrips Management Trials Central Rift Valley; Bahir Dar University research"
    },
    {
      name: "White Rot (Sclerotium cepivorum)", severity: "High", confidence: 75,
      keywords: ["white","rot","fluffy","mycelium","bulb","base","sclerotium","yellowing","collapse","root"],
      diagnosis: "Sclerotium cepivorum — yellowing leaves followed by complete plant collapse. White fluffy mycelium with small black sclerotia visible at the bulb base and on roots. Soilborne pathogen — sclerotia survive 20+ years in soil.",
      immediate_actions: [
        "Remove and burn affected plants with surrounding soil",
        "Mark contaminated area — do not plant Allium there for 8+ years",
        "Apply Trichoderma harzianum biocontrol to surrounding soil",
        "Avoid moving soil from infected areas to clean fields",
        "Disinfect equipment between fields"
      ],
      preventive_measures: [
        "Only plant onions in fields with no Allium history (or 8+ year break)",
        "Soil solarization in known-infested fields",
        "Trichoderma soil treatment at planting",
        "Composted organic matter improves soil microbiome",
        "Source clean planting material (avoid sets from infected areas)"
      ],
      local_treatment: "Trichoderma harzianum + soil solarization. Long rotation (8+ years) essential. NO chemical cure once established.",
      source: "EIAR plant pathology research; PROTA Plant Resources of Tropical Africa"
    }
  ]
};

window.LOCAL_DISEASES = LOCAL_DISEASES;
