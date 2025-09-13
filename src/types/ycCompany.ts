export type YCCompany = {
  id: number;
  name: string;
  yc_page_url: string;
  logo: string | null;
  description: string;
  about: string;
  founded: string | null;
  batch: string | null;
  region: string | null;
  location: CompanyLocation;
  team_size: string | null;
  status: string | null;
  primary_partner: string | null;
  company_pages: WebPlatform[];
  company_photos: string[] | null;
  industry: string[];
  founders: Founder[];
};

type CompanyLocation = {
  latitude: number | null;
  longitude: number | null;
  long_address: string | null;
  short_address: string | null;
};

export type WebPlatform = {
  platform: string;
  url: string;
};

export type Founder = {
  id: number;
  name: string | null;
  bio: string | null;
  avatar: string | null;
  has_placeholder_avatar?: boolean;
  job_title: string | null;
  social_media_profiles: WebPlatform[];
};
