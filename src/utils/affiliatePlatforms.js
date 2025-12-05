// Popular affiliate platforms with their details
export const AFFILIATE_PLATFORMS = [
  {
    id: 'flipkart',
    name: 'Flipkart',
    icon: 'cart',
    color: '#2874F0',
    placeholder: 'Enter your Flipkart affiliate ID',
    description: 'Flipkart Affiliate Program',
    website: 'https://affiliate.flipkart.com',
  },
  {
    id: 'amazon',
    name: 'Amazon',
    icon: 'package-variant',
    color: '#FF9900',
    placeholder: 'Enter your Amazon affiliate tag',
    description: 'Amazon Associates',
    website: 'https://affiliate-program.amazon.com',
  },
  {
    id: 'amazon_in',
    name: 'Amazon India',
    icon: 'package-variant',
    color: '#FF9900',
    placeholder: 'Enter your Amazon.in affiliate tag',
    description: 'Amazon Associates India',
    website: 'https://affiliate-program.amazon.in',
  },
  {
    id: 'myntra',
    name: 'Myntra',
    icon: 'tshirt-crew',
    color: '#FF3F6C',
    placeholder: 'Enter your Myntra affiliate ID',
    description: 'Myntra Affiliate Program',
    website: 'https://affiliate.myntra.com',
  },
  {
    id: 'paytm',
    name: 'Paytm',
    icon: 'wallet',
    color: '#00BAF2',
    placeholder: 'Enter your Paytm affiliate ID',
    description: 'Paytm Affiliate Program',
    website: 'https://paytmmall.com/affiliate',
  },
  {
    id: 'snapdeal',
    name: 'Snapdeal',
    icon: 'shopping',
    color: '#FF5722',
    placeholder: 'Enter your Snapdeal affiliate ID',
    description: 'Snapdeal Affiliate Program',
    website: 'https://affiliate.snapdeal.com',
  },
  {
    id: 'shopclues',
    name: 'ShopClues',
    icon: 'store',
    color: '#FF6600',
    placeholder: 'Enter your ShopClues affiliate ID',
    description: 'ShopClues Affiliate Program',
    website: 'https://affiliate.shopclues.com',
  },
  {
    id: 'nykaa',
    name: 'Nykaa',
    icon: 'lipstick',
    color: '#E91E63',
    placeholder: 'Enter your Nykaa affiliate ID',
    description: 'Nykaa Affiliate Program',
    website: 'https://affiliate.nykaa.com',
  },
  {
    id: 'bigbasket',
    name: 'BigBasket',
    icon: 'basket',
    color: '#8BC34A',
    placeholder: 'Enter your BigBasket affiliate ID',
    description: 'BigBasket Affiliate Program',
    website: 'https://affiliate.bigbasket.com',
  },
  {
    id: 'swiggy',
    name: 'Swiggy',
    icon: 'food',
    color: '#FF6B35',
    placeholder: 'Enter your Swiggy affiliate ID',
    description: 'Swiggy Affiliate Program',
    website: 'https://affiliate.swiggy.com',
  },
  {
    id: 'zomato',
    name: 'Zomato',
    icon: 'silverware-fork-knife',
    color: '#E23744',
    placeholder: 'Enter your Zomato affiliate ID',
    description: 'Zomato Affiliate Program',
    website: 'https://affiliate.zomato.com',
  },
  {
    id: 'bookmyshow',
    name: 'BookMyShow',
    icon: 'ticket',
    color: '#F84464',
    placeholder: 'Enter your BookMyShow affiliate ID',
    description: 'BookMyShow Affiliate Program',
    website: 'https://affiliate.bookmyshow.com',
  },
  {
    id: 'makemytrip',
    name: 'MakeMyTrip',
    icon: 'airplane',
    color: '#1AB394',
    placeholder: 'Enter your MakeMyTrip affiliate ID',
    description: 'MakeMyTrip Affiliate Program',
    website: 'https://affiliate.makemytrip.com',
  },
  {
    id: 'goibibo',
    name: 'Goibibo',
    icon: 'airplane-takeoff',
    color: '#FF5722',
    placeholder: 'Enter your Goibibo affiliate ID',
    description: 'Goibibo Affiliate Program',
    website: 'https://affiliate.goibibo.com',
  },
  {
    id: 'oyo',
    name: 'OYO',
    icon: 'bed',
    color: '#FF5A5F',
    placeholder: 'Enter your OYO affiliate ID',
    description: 'OYO Affiliate Program',
    website: 'https://affiliate.oyorooms.com',
  },
  {
    id: 'uber',
    name: 'Uber',
    icon: 'car',
    color: '#000000',
    placeholder: 'Enter your Uber affiliate code',
    description: 'Uber Affiliate Program',
    website: 'https://partners.uber.com',
  },
  {
    id: 'ola',
    name: 'Ola',
    icon: 'car-side',
    color: '#000000',
    placeholder: 'Enter your Ola affiliate code',
    description: 'Ola Affiliate Program',
    website: 'https://affiliate.olacabs.com',
  },
  {
    id: 'custom',
    name: 'Custom Platform',
    icon: 'link-variant',
    color: '#9E9E9E',
    placeholder: 'Enter affiliate link or ID',
    description: 'Custom Affiliate Program',
    website: null,
  },
];

// Helper function to get platform by ID
export const getPlatformById = (id) => {
  return AFFILIATE_PLATFORMS.find(p => p.id === id) || AFFILIATE_PLATFORMS.find(p => p.id === 'custom');
};

// Helper function to format affiliate link
export const formatAffiliateLink = (platform, affiliateId, productUrl = '') => {
  if (!affiliateId) return '';
  
  const baseUrls = {
    flipkart: `https://www.flipkart.com?affid=${affiliateId}`,
    amazon: productUrl ? `https://www.amazon.com/dp/${productUrl}?tag=${affiliateId}` : `https://www.amazon.com/?tag=${affiliateId}`,
    amazon_in: productUrl ? `https://www.amazon.in/dp/${productUrl}?tag=${affiliateId}` : `https://www.amazon.in/?tag=${affiliateId}`,
    myntra: `https://www.myntra.com?affid=${affiliateId}`,
    paytm: `https://paytmmall.com?affid=${affiliateId}`,
    snapdeal: `https://www.snapdeal.com?affid=${affiliateId}`,
    shopclues: `https://www.shopclues.com?affid=${affiliateId}`,
    nykaa: `https://www.nykaa.com?affid=${affiliateId}`,
    bigbasket: `https://www.bigbasket.com?affid=${affiliateId}`,
    swiggy: `https://www.swiggy.com?affid=${affiliateId}`,
    zomato: `https://www.zomato.com?affid=${affiliateId}`,
    bookmyshow: `https://in.bookmyshow.com?affid=${affiliateId}`,
    makemytrip: `https://www.makemytrip.com?affid=${affiliateId}`,
    goibibo: `https://www.goibibo.com?affid=${affiliateId}`,
    oyo: `https://www.oyorooms.com?affid=${affiliateId}`,
    uber: `https://www.uber.com/invite/${affiliateId}`,
    ola: `https://www.olacabs.com?affid=${affiliateId}`,
  };

  if (platform.id === 'custom') {
    return affiliateId.startsWith('http') ? affiliateId : `https://${affiliateId}`;
  }

  const baseUrl = baseUrls[platform.id] || '';
  // For Amazon links, productUrl is already handled in baseUrls
  if (platform.id === 'amazon' || platform.id === 'amazon_in') {
    return baseUrl;
  }
  // For other platforms, replace PRODUCT_ID if needed
  if (productUrl && baseUrl.includes('PRODUCT_ID')) {
    return baseUrl.replace('PRODUCT_ID', productUrl);
  }
  return baseUrl;
};

