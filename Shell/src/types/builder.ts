export interface Location {
  lat: number;
  lng: number;
  city: string;
  state: string;
  zip: string;
  [key: string]: any; // Allow additional properties
}

export interface GalleryImage {
  url: string;
  alt: string;
  caption: string;
}

export interface PricingTier {
  name: string;
  price: number;
  description: string;
  features: string[];
}

export interface Builder {
  id: string | number;
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  location: Location;
  description: string;
  vanTypes?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  pricingTiers?: PricingTier[];
  amenities?: string[];
  certifications?: string[];
  services?: string[];
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    pinterest?: string;
    tiktok?: string;
  };
  gallery?: GalleryImage[] | string[];
  distanceFromZip?: {
    miles: number;
    zipCode: string;
  };
  [key: string]: any; // Allow additional properties
}

export interface BuilderLocation {
  lat: number;
  lng: number;
}
