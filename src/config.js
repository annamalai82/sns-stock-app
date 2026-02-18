// config.js — All restaurant data, sections, thresholds, staff

export const STAFF = [
  { id: 'sapna', name: 'Sapna', avatar: '👩‍🍳', sections: ['Dry Store', 'KOT Fridge & Freezer'] },
  { id: 'simran', name: 'Simran', avatar: '👩‍🍳', sections: ['Vegetables', 'Dough', 'Marination', 'Front Fridge', 'Dairy', 'Drinks'] },
  { id: 'charles', name: 'Charles', avatar: '👨‍🍳', sections: ['Cold Room', 'Meat Stock', 'Seafood'] },
  { id: 'veer', name: 'Veer', avatar: '👨‍🍳', sections: ['Back Dry Store', 'KOT Dry Section', 'KOT Fridge/Freezer', 'Mini Freezer'] },
  { id: 'pramod', name: 'Pramod', avatar: '👨‍🍳', sections: ['Mini Storage Fridges', 'Curry Stock', 'Meat & Seafood'] },
  { id: 'vijith', name: 'Vijith', avatar: '👨‍🍳', sections: ['Mini Storage Fridges', 'Curry Stock', 'Meat & Seafood'] },
  { id: 'shushi', name: 'Shushi/Rushda', avatar: '👨‍🍳', sections: ['Ordering', 'Final Stock Check', 'Overall Management'] },
];

export const LOCATIONS = ['Nedlands', 'Vic Park'];

export const SECTIONS = {
  'KOT Section': {
    items: ['Sambar','Tamarind','Veg Korma','Combo Curry','Coconut Chutney','Red Chutney','Idli','Mini Idli','Thattu Idli','Kuzhi Paniyaram','Big Vada','Small Vada','Raita','Mint Chutney','Samosa','Chicken Biryani','Goat Biryani','Dum Chicken','Donne Mutton','Beef Biryani','Veg Biryani','Plain Rice','Sappadu Rice','Idiyappam','Prawns','Lamb Sheek','Madras Chicken'],
    icon: '🍛'
  },
  'Cool Room': {
    items: ['Lamb Rogan Josh','Butter Sauce','Veg Khorma','Dal','North OT','OT Base','White Khorma','Dosa Batter','Sambar','Curry Base','Mutton Boiled','Chicken Lollipop','Fish Goramthy','Beef Cooked','Mutton Chukka','Boiled Chicken','Noodles','Lamb Mince Mix','65','Fried Chicken','Fish','Palak','Chicken Thighs'],
    icon: '❄️'
  },
  'Freezer': {
    items: ['Fish Fillets','Raw Prawns','Green Chillies','Puff Pastry','Raw Mutton','Green Peas','Frozen Carrots','Spinach','Varthu Curry Paste','Chicken Thigh','Biryani Chicken','Whole Chicken','Lollipop','Okra'],
    icon: '🧊'
  },
  'Dry Store': {
    items: ['Long Life Noodle','Coconut Oil','Tamarind Chutney','Chaat Masala','Baking Soda','Baking Powder','Tamarind Paste','Tomato Sauce','Tea','Light Soy Sauce','Dark Soy Sauce','Sweet Chilli Sauce','Hot Chilli Sauce','Condensed Milk','Rose Milk','Lemon Juice','Schezewan Chutney','Canola Oil','Ghee','Oil','Rice','Salt','Plain Flour','Raising Flour'],
    icon: '📦'
  },
  'Vegetables': {
    items: ['Capsicum','Coriander','Spring Onion','Mint','Eggplant','Carrot','Lemon','Cucumber','Beans','Tomato','Garlic','Ginger','Green Chilli','Cabbage','Red Cabbage','Cauliflower','Mushroom','Red Onion','White Onion','Potatoes'],
    icon: '🥬'
  },
  'Dairy': { items: ['Yogurt','Paneer','Cream','Butter','Cheese','Milk'], icon: '🥛' },
  'Drinks': {
    items: ['Coca Classic','Coca Zero','Fanta','Sprite','Water','Lemonade','Soda Water','Apple Juice','Lemon Lime Bitter','Coconut Water'],
    icon: '🥤'
  },
  'Tandoor/Grill': {
    items: ['Tandoori Chicken','Murg Malai Tikka','Lamb Sheek','Paneer Tikka','Bhaji','Naan','Paratha','Roti Dough'],
    icon: '🔥'
  },
  'Marination': { items: ['Yellow Marination','Red Marination','White Marination'], icon: '🫙' },
  'Meat & Seafood': {
    items: ['Whole Chicken','Prawns','Thigh Fillet','Lollipop','Fish','Chicken Chettinad','Chicken Vartha Curry','Mutton Vartha Curry','Mutton Chettinad','White Khorma','Butter Sauce','OT Base','Lamb Rogan','Curry Base'],
    icon: '🥩'
  },
};

export const ORDERING_SCHEDULE = [
  { supplier: 'Amith', day: 'Sunday', note: 'Missing items informed by Friday' },
  { supplier: 'Vegetables', day: 'Twice a week', note: '' },
  { supplier: 'Shakti', day: 'Wednesday', note: '' },
  { supplier: 'Billy', day: 'Regular pick-up', note: '' },
  { supplier: 'Yuwan', day: 'Friday (Nedlands) / Tuesday (Vic Park)', note: '' },
];

export const LOW_STOCK_THRESHOLDS = {
  default: 2,
  'Sambar': 10,
  'Curry Base': 5,
  'Butter Sauce': 5,
  'OT Base': 5,
  'White Khorma': 3,
  'Dosa Batter': 10,
  'Chicken Biryani': 5,
  'White Onion': 20,
  'Potatoes': 5,
  'Tomato': 3,
  'Plain Rice': 5,
  'Big Vada': 5,
  'Small Vada': 5,
};

export const QUICK_REPLIES = [
  { label: '📊 Summary', text: 'Daily summary' },
  { label: '⚠️ Low Stock', text: 'Show low stock items' },
  { label: '📦 Orders', text: 'What orders are due?' },
  { label: '❄️ Cool Room', text: 'Show cool room stock' },
  { label: '🍛 KOT', text: 'Show KOT section stock' },
];

export function dateKey(d) {
  const t = d || new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

export function timeNow() {
  return new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
}
