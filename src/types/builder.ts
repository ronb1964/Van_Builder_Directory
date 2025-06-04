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
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
}

export interface BuilderLocation {
  lat: number;
  lng: number;
}
