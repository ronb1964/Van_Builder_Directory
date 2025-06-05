export interface Builder {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude: number;
  longitude: number;
  photos: string[];
  description?: string;
  vanTypes?: string[];
  location: {
    city: string;
    state: string;
    lat: number;
    lng: number;
  };
  distanceFromZip?: {
    miles: number;
  };
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
  };
}

export interface BuilderLocation {
  lat: number;
  lng: number;
}
