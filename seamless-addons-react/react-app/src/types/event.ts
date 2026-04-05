export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

export interface Event {
  id: string;
  uuid: string;
  title: string;
  slug: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  category?: string;
  featured_image?: string;
  price?: string | number;
  is_free?: boolean;
  registration_url?: string;
  registration_closes?: string;
  capacity?: number;
  registered_count?: number;
  tags?: string[];
  type?: string;
}
