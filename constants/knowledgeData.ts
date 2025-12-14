export interface KnowledgeItem {
  id: string;
  title: string;
  emoji: string;
  goodEffects: string[];
  badEffects: string[];
}

export interface VitaminItem {
  id: string;
  name: string;
  function: string;
  deficiency: string;
  sources: string[];
}

export const FOOD_TOPICS: KnowledgeItem[] = [
  {
    id: 'sugar',
    title: 'High-Sugar Foods',
    emoji: '🍭',
    goodEffects: ['Quick energy boost', 'Improves mood short-term'],
    badEffects: ['Causes insulin spikes', 'Increases fat storage', 'Risk of diabetes', 'Weakens immune system', 'Damages teeth'],
  },
  {
    id: 'sodium',
    title: 'High-Sodium Foods',
    emoji: '🧂',
    goodEffects: ['Essential for nerve function', 'Maintain fluid balance'],
    badEffects: ['High blood pressure', 'Kidney strain', 'Water retention', 'Risk of heart disease'],
  },
  {
    id: 'sat_fats',
    title: 'Saturated Fats',
    emoji: '🥩',
    goodEffects: ['Necessary for cell membranes', 'Hormone production'],
    badEffects: ['Raises LDL cholesterol', 'Increases heart disease risk', 'Promotes inflammation'],
  },
  {
    id: 'trans_fats',
    title: 'Trans Fats',
    emoji: '🍟',
    goodEffects: ['Longer shelf life (for products, not you)'],
    badEffects: ['Raises bad cholesterol', 'Lowers good cholesterol', 'High heart disease risk', 'Systemic inflammation'],
  },
  {
    id: 'fiber',
    title: 'High-Fiber Foods',
    emoji: '🌾',
    goodEffects: ['Improves digestion', 'Regulates blood sugar', 'Lowers cholesterol', 'Promotes satiety'],
    badEffects: ['Can cause bloating if increased too fast', 'May interfere with mineral absorption'],
  },
  {
    id: 'lean_proteins',
    title: 'Lean Proteins',
    emoji: '🍗',
    goodEffects: ['Builds muscle', 'Supports metabolism', 'Keeps you full longer', 'Tissue repair'],
    badEffects: ['Excess can strain kidneys', 'Can be expensive'],
  },
  {
    id: 'refined_carbs',
    title: 'Refined Carbohydrates',
    emoji: '🍞',
    goodEffects: ['Quick energy source', 'Easy to digest'],
    badEffects: ['Rapid blood sugar spike', 'Low nutrient density', 'Can lead to overeating', 'Energy crash later'],
  },
  {
    id: 'whole_grains',
    title: 'Whole Grains',
    emoji: '🥣',
    goodEffects: ['Rich in fiber', 'B vitamins source', 'Steady energy release', 'Heart health'],
    badEffects: ['Contains anti-nutrients (phytic acid)', 'Harder to digest for some'],
  },
  {
    id: 'omega3',
    title: 'Omega-3 Fatty Acids',
    emoji: '🐟',
    goodEffects: ['Brain health', 'Reduces inflammation', 'Heart health', 'Supports joint health'],
    badEffects: ['Blood thinning in high doses', 'Fishy aftertaste'],
  },
  {
    id: 'ultra_processed',
    title: 'Ultra-Processed Foods',
    emoji: '🍕',
    goodEffects: ['Convenient', 'Highly palatable'],
    badEffects: ['Addictive', 'Nutrient poor', 'High calories', 'Contains artificial additives'],
  },
  {
    id: 'fermented',
    title: 'Fermented Foods',
    emoji: '🥒',
    goodEffects: ['Rich in probiotics', 'Improves gut health', 'Enhanced nutrient absorption'],
    badEffects: ['High histamine', 'Strong taste', 'High sodium in some'],
  },
  {
    id: 'antioxidant',
    title: 'Antioxidant-Rich Foods',
    emoji: '🫐',
    goodEffects: ['Fights free radicals', 'Slows aging', 'Reduces cancer risk', 'Skin health'],
    badEffects: ['Overconsumption of supplements can be harmful'],
  },
  {
    id: 'cholesterol',
    title: 'High-Cholesterol Foods',
    emoji: '🥚',
    goodEffects: ['Hormone production', 'Cell structure'],
    badEffects: ['May raise blood cholesterol in responders', 'Heart health concern'],
  },
  {
    id: 'artificial_sweeteners',
    title: 'Artificial Sweeteners',
    emoji: '🥤',
    goodEffects: ['Zero calories', 'Doesn\'t spike blood sugar'],
    badEffects: ['May alter gut microbiome', 'May increase cravings', 'Potential headaches'],
  },
  {
    id: 'alcohol',
    title: 'Excess Alcohol',
    emoji: '🍷',
    goodEffects: ['Social relaxation (in moderation)', 'Some antioxidants (red wine)'],
    badEffects: ['Liver damage', 'Brain cell damage', 'Dehydration', 'Weight gain', 'Sleep disruption'],
  },
  {
    id: 'hydration',
    title: 'Hydration & Water',
    emoji: '💧',
    goodEffects: ['Essential for life', 'Temperature regulation', 'Brain function', 'Skin health'],
    badEffects: ['Water intoxication (hyponatremia) if excessive'],
  },
  {
    id: 'caffeine',
    title: 'Caffeine',
    emoji: '☕',
    goodEffects: ['Alertness', 'Performance boost', 'Metabolism boost'],
    badEffects: ['Anxiety', 'Insomnia', 'Digestive issues', 'Dependency'],
  },
  {
    id: 'spicy',
    title: 'Spicy Foods',
    emoji: '🌶️',
    goodEffects: ['Metabolism boost', 'Anti-inflammatory (capsaicin)', 'Pain relief'],
    badEffects: ['Heartburn', 'Stomach irritation', 'Sweating'],
  },
  {
    id: 'fried',
    title: 'Fried Foods',
    emoji: '🍟',
    goodEffects: ['Tasty texture'],
    badEffects: ['High calories', 'Trans fats', 'Acrylamide formation', 'Inflammation'],
  },
  {
    id: 'raw_vs_cooked',
    title: 'Raw vs Cooked Vegetables',
    emoji: '🥦',
    goodEffects: ['Raw: more vitamin C', 'Cooked: better nutrient absorption (lycopene)'],
    badEffects: ['Raw: harder to digest', 'Cooked: some vitamin loss'],
  },
  {
    id: 'meat_red_white',
    title: 'Red Meat vs White Meat',
    emoji: '🥩',
    goodEffects: ['Red: High iron, B12', 'White: Lower saturated fat, leaner'],
    badEffects: ['Red: Risk of colorectal cancer', 'White: Less iron than red'],
  },
  {
    id: 'dairy',
    title: 'Dairy',
    emoji: '🥛',
    goodEffects: ['Calcium for bones', 'Protein source', 'Vitamin D'],
    badEffects: ['Lactose intolerance', 'Saturated fat', 'Acne for some'],
  },
  {
    id: 'probiotics',
    title: 'Probiotics & Gut Health',
    emoji: '🦠',
    goodEffects: ['Digestive health', 'Immune system support', 'Mental health connection'],
    badEffects: ['Bloating initially', 'Risk for immunocompromised'],
  },
  {
    id: 'high_protein',
    title: 'High-Protein Diets',
    emoji: '💪',
    goodEffects: ['Muscle gain', 'Satiety', 'Fat loss'],
    badEffects: ['Kidney strain if pre-existing condition', 'Dehydration', 'Lack of fiber'],
  },
  {
    id: 'low_carb',
    title: 'Low-Carb Diets',
    emoji: '🥑',
    goodEffects: ['Rapid weight loss', 'Stable blood sugar', 'Lower insulin'],
    badEffects: ['Keto flu', 'Nutrient deficiencies', 'Socially restrictive'],
  },
];

export const VITAMINS: VitaminItem[] = [
  {
    id: 'vita',
    name: 'Vitamin A',
    function: 'Vision, immune system, skin',
    deficiency: 'Night blindness, dry skin',
    sources: ['Carrots', 'Sweet potatoes', 'Spinach', 'Kale', 'Liver'],
  },
  {
    id: 'vitb1',
    name: 'Vitamin B1 (Thiamine)',
    function: 'Energy metabolism',
    deficiency: 'Beriberi, fatigue, nerve damage',
    sources: ['Pork', 'Sunflower seeds', 'Whole grains', 'Beans', 'Lentils'],
  },
  {
    id: 'vitb2',
    name: 'Vitamin B2 (Riboflavin)',
    function: 'Red blood cell production',
    deficiency: 'Cracked lips, sore throat',
    sources: ['Milk', 'Eggs', 'Almonds', 'Spinach', 'Yogurt'],
  },
  {
    id: 'vitb3',
    name: 'Vitamin B3 (Niacin)',
    function: 'Digestive health, cholesterol',
    deficiency: 'Pellagra (skin, digestive issues)',
    sources: ['Chicken', 'Tuna', 'Peanuts', 'Mushrooms', 'Avocado'],
  },
  {
    id: 'vitb5',
    name: 'Vitamin B5 (Pantothenic Acid)',
    function: 'Hormones, metabolism',
    deficiency: 'Fatigue, irritability',
    sources: ['Mushrooms', 'Avocado', 'Eggs', 'Beef', 'Chicken'],
  },
  {
    id: 'vitb6',
    name: 'Vitamin B6',
    function: 'Brain health, mood',
    deficiency: 'Anemia, depression, confusion',
    sources: ['Bananas', 'Chickpeas', 'Tuna', 'Salmon', 'Potatoes'],
  },
  {
    id: 'vitb7',
    name: 'Vitamin B7 (Biotin)',
    function: 'Hair, nails, metabolism',
    deficiency: 'Hair loss, rash',
    sources: ['Eggs', 'Salmon', 'Walnuts', 'Sweet potatoes', 'Spinach'],
  },
  {
    id: 'vitb9',
    name: 'Vitamin B9 (Folate)',
    function: 'Cell repair, pregnancy health',
    deficiency: 'Anemia, birth defects',
    sources: ['Leafy greens', 'Beans', 'Citrus fruits', 'Avocado', 'Brussels sprouts'],
  },
  {
    id: 'vitb12',
    name: 'Vitamin B12',
    function: 'Nerve function, energy',
    deficiency: 'Anemia, fatigue, nerve damage',
    sources: ['Beef', 'Fish', 'Dairy', 'Fortified cereals', 'Eggs'],
  },
  {
    id: 'vitc',
    name: 'Vitamin C',
    function: 'Immunity, antioxidant',
    deficiency: 'Scurvy, slow wound healing',
    sources: ['Oranges', 'Strawberries', 'Bell peppers', 'Kiwi', 'Broccoli'],
  },
  {
    id: 'vitd',
    name: 'Vitamin D',
    function: 'Bone health, mood',
    deficiency: 'Rickets, bone pain, fatigue',
    sources: ['Sunlight', 'Salmon', 'Fortified milk', 'Egg yolks', 'Mushrooms'],
  },
  {
    id: 'vite',
    name: 'Vitamin E',
    function: 'Skin, antioxidant',
    deficiency: 'Nerve damage, muscle weakness',
    sources: ['Almonds', 'Sunflower oil', 'Hazelnuts', 'Spinach', 'Avocado'],
  },
  {
    id: 'vitk',
    name: 'Vitamin K',
    function: 'Blood clotting, bone strength',
    deficiency: 'Easy bruising, bleeding',
    sources: ['Kale', 'Broccoli', 'Spinach', 'Brussels sprouts', 'Cabbage'],
  },
];
