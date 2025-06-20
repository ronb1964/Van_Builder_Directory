/**
 * Mock data for van builders
 * Updated with verified Google Places API data
 */

export interface MockBuilder {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  description: string;
  rating: number;
  reviewCount: number;
  vanTypes: string[];
  priceMin: number;
  priceMax: number;
  amenities: string[];
  services: string[];
}

export const mockBuilders: MockBuilder[] = [
  {
    "id": 1,
    "name": "Ready Set Van",
    "address": "1800 E State St Suite 165, Hamilton Township, NJ 08609, USA",
    "phone": "(609) 878-8822",
    "email": "",
    "website": "http://www.readysetvan.com/",
    "city": "Hamilton Township",
    "state": "New Jersey",
    "zip": "08609",
    "lat": 40.2346801,
    "lng": -74.7313461,
    "description": "Professional van conversion specialists with 5-star rating",
    "rating": 5,
    "reviewCount": 29,
    "vanTypes": [
      "Ford Transit",
      "Mercedes Sprinter"
    ],
    "priceMin": 50000,
    "priceMax": 150000,
    "amenities": [
      "Kitchen",
      "Bathroom",
      "Solar",
      "Heating"
    ],
    "services": [
      "Custom Builds",
      "Electrical",
      "Plumbing",
      "Interior Design"
    ]
  },
  {
    "id": 2,
    "name": "Sequoia + Salt - Conversion Vans",
    "address": "202 E Main St Unit 1, Manasquan, NJ 08736, USA",
    "phone": "(732) 357-3483",
    "email": "",
    "website": "https://sequoiasaltvans.com/",
    "city": "Manasquan",
    "state": "New Jersey",
    "zip": "08736",
    "lat": 40.121863,
    "lng": -74.046628,
    "description": "Expert van conversions with adventure wall kits and custom cabinetry",
    "rating": 4.9,
    "reviewCount": 51,
    "vanTypes": [
      "Ford Transit",
      "Mercedes Sprinter"
    ],
    "priceMin": 60000,
    "priceMax": 180000,
    "amenities": [
      "Adventure Wall",
      "Custom Cabinetry",
      "Solar",
      "Kitchen"
    ],
    "services": [
      "Custom Builds",
      "Adventure Kits",
      "Electrical",
      "Cabinetry"
    ]
  },
  {
    "id": 3,
    "name": "Diversified Vehicle Services",
    "address": "7300 N Crescent Blvd Unit 1B, Pennsauken Township, NJ 08110, USA",
    "phone": "(856) 404-2694",
    "email": "",
    "website": "http://www.dvsnj.com/",
    "city": "Pennsauken Township",
    "state": "New Jersey",
    "zip": "08110",
    "lat": 39.9684429,
    "lng": -75.04443169999999,
    "description": "Professional van modifications and electrical installations",
    "rating": 4.8,
    "reviewCount": 22,
    "vanTypes": [
      "ProMaster",
      "Ford Transit"
    ],
    "priceMin": 30000,
    "priceMax": 120000,
    "amenities": [
      "Electrical Systems",
      "Fans",
      "Solar",
      "Custom Work"
    ],
    "services": [
      "Electrical",
      "Fan Installation",
      "Solar Setup",
      "Custom Modifications"
    ]
  },
  {
    "id": 4,
    "name": "HQ Custom Design",
    "address": "275 Huyler St, South Hackensack, NJ 07606, USA",
    "phone": "(201) 592-6939",
    "email": "",
    "website": "http://www.hqcustomdesign.com/",
    "city": "South Hackensack",
    "state": "New Jersey",
    "zip": "07606",
    "lat": 40.8705744,
    "lng": -74.0493371,
    "description": "High-quality custom van designs and conversions",
    "rating": 4.4,
    "reviewCount": 30,
    "vanTypes": [
      "Custom Vans",
      "Commercial Vehicles"
    ],
    "priceMin": 40000,
    "priceMax": 200000,
    "amenities": [
      "Custom Design",
      "Quality Materials",
      "Professional Finish"
    ],
    "services": [
      "Custom Design",
      "Full Conversions",
      "Commercial Work"
    ]
  },
  {
    "id": 5,
    "name": "Vanture Customs",
    "address": "725 County Line Rd STE C, Huntingdon Valley, PA 19006, USA",
    "phone": "(814) 320-4253",
    "email": "",
    "website": "https://vanturecustoms.com/",
    "city": "Huntingdon Valley",
    "state": "Pennsylvania",
    "zip": "19006",
    "lat": 40.16207859999999,
    "lng": -75.05427,
    "description": "Van rentals and custom builds with excellent customer service",
    "rating": 5,
    "reviewCount": 107,
    "vanTypes": [
      "Ford Transit",
      "Mercedes Sprinter"
    ],
    "priceMin": 70000,
    "priceMax": 250000,
    "amenities": [
      "Rental Fleet",
      "Custom Builds",
      "Full Service"
    ],
    "services": [
      "Van Rentals",
      "Custom Builds",
      "Consultation",
      "Full Service"
    ]
  },
  {
    "id": 6,
    "name": "Humble Road",
    "address": "New Jersey Shore Area",
    "phone": "Contact via website",
    "email": "georgemauro@humbleroad.tv",
    "website": "https://www.humbleroad.tv/",
    "city": "Shore Area",
    "state": "New Jersey",
    "zip": "",
    "lat": 40.1,
    "lng": -74.2,
    "description": "Custom tailored camper vans from micro to luxury builds",
    "rating": 5,
    "reviewCount": 0,
    "vanTypes": [
      "Ford Transit",
      "RAM Promaster City",
      "Mercedes Sprinter"
    ],
    "priceMin": 38000,
    "priceMax": 215000,
    "amenities": [
      "Micro Campers",
      "Custom Tailoring",
      "Luxury Options"
    ],
    "services": [
      "Custom Builds",
      "Micro Conversions",
      "Luxury Builds",
      "Consultation"
    ]
  },
  {
    "id": 7,
    "name": "Vandoit",
    "address": "Blue Springs, MO (Ships Nationwide)",
    "phone": "Contact via website",
    "email": "",
    "website": "https://vandoit.com/",
    "city": "Blue Springs",
    "state": "Missouri",
    "zip": "",
    "lat": 39,
    "lng": -94.4,
    "description": "Modular Ford Transit conversions with 0% financing available",
    "rating": 5,
    "reviewCount": 0,
    "vanTypes": [
      "Ford Transit"
    ],
    "priceMin": 59000,
    "priceMax": 289000,
    "amenities": [
      "Modular Design",
      "0% Financing",
      "National Shipping"
    ],
    "services": [
      "Modular Conversions",
      "Financing",
      "National Delivery",
      "Custom Options"
    ]
  }
];

// Group builders by state for easy access
export const mockBuildersByState = mockBuilders.reduce((acc, builder) => {
  const state = builder.state;
  if (!acc[state]) {
    acc[state] = [];
  }
  acc[state].push(builder);
  return acc;
}, {} as Record<string, MockBuilder[]>);

export default mockBuilders;
